import { DeArrowBranding, DeArrowSettings, DeArrowTitle, DeArrowThumbnail } from '@/types';

export const DEFAULT_DEARROW_SETTINGS: DeArrowSettings = {
  enabled: false,
  alternativeTitles: false,
  alternativeThumbnails: false,
};

// In-Memory Cache: Map<videoId, { branding: DeArrowBranding | null; timestamp: number }>
const brandingCache = new Map<string, { branding: DeArrowBranding | null; timestamp: number }>();
// In-Flight deduplication map to prevent redundant concurrent fetches for identical video IDs
const inFlightRequests = new Map<string, Promise<DeArrowBranding | null>>();

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

/**
 * Extracts clean 11-char YouTube ID from NextTube custom IDs (e.g. "yt-dQw4w9WgXcQ") or standard video IDs
 */
export function extractCleanYouTubeId(rawId: string): string {
  if (!rawId) return '';
  if (rawId.startsWith('yt-')) {
    return rawId.replace(/^yt-/, '');
  }
  if (rawId.startsWith('v-')) {
    // If it's a mock local video without a real YT id, return as is
    return rawId;
  }
  // Standard 11 char ID check or URL
  const match = rawId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) {
    return match[1];
  }
  return rawId.trim();
}

export class DeArrowService {
  /**
   * Get cached branding synchronously if available and not expired
   */
  static getCachedBranding(videoId: string): DeArrowBranding | null {
    const cleanId = extractCleanYouTubeId(videoId);
    if (!cleanId) return null;

    const entry = brandingCache.get(cleanId);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      brandingCache.delete(cleanId);
      return null;
    }
    return entry.branding;
  }

  /**
   * Fetch DeArrow branding data (titles, thumbnails, votes) from official API.
   * Utilizes in-memory caching and request deduplication.
   */
  static async getBranding(videoId: string): Promise<DeArrowBranding | null> {
    const cleanId = extractCleanYouTubeId(videoId);
    if (!cleanId || cleanId.startsWith('v-')) {
      return null;
    }

    // 1. Check in-memory cache
    const cached = this.getCachedBranding(cleanId);
    if (cached !== null) {
      return cached;
    }

    // 2. Check in-flight requests deduplication
    if (inFlightRequests.has(cleanId)) {
      return inFlightRequests.get(cleanId)!;
    }

    // 3. Initiate fetch with safe timeout and fallback
    const fetchPromise = (async (): Promise<DeArrowBranding | null> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        // Attempt 1: Next.js internal API proxy (safe from CORS & sandbox restrictions)
        let res = await fetch(`/api/dearrow/branding?videoID=${encodeURIComponent(cleanId)}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        }).catch(() => null);

        // Attempt 2: Direct official SponsorBlock/DeArrow API endpoint if proxy fails
        if (!res || !res.ok) {
          if (res && res.status === 404) {
            // 404 means no branding data exists for this video on DeArrow
            const emptyBranding: DeArrowBranding = { titles: [], thumbnails: [] };
            brandingCache.set(cleanId, { branding: emptyBranding, timestamp: Date.now() });
            return emptyBranding;
          }

          res = await fetch(`https://sponsor.ajay.app/api/branding?videoID=${encodeURIComponent(cleanId)}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }).catch(() => null);
        }

        clearTimeout(timeoutId);

        if (!res) {
          return null;
        }

        if (res.status === 404) {
          const emptyBranding: DeArrowBranding = { titles: [], thumbnails: [] };
          brandingCache.set(cleanId, { branding: emptyBranding, timestamp: Date.now() });
          return emptyBranding;
        }

        if (!res.ok) {
          return null;
        }

        const data = await res.json();
        const branding: DeArrowBranding = {
          titles: Array.isArray(data.titles) ? data.titles : [],
          thumbnails: Array.isArray(data.thumbnails) ? data.thumbnails : [],
          randomTime: typeof data.randomTime === 'number' ? data.randomTime : null,
          videoDuration: typeof data.videoDuration === 'number' ? data.videoDuration : null,
        };

        // Cache the branding
        brandingCache.set(cleanId, {
          branding,
          timestamp: Date.now(),
        });

        return branding;
      } catch (err) {
        clearTimeout(timeoutId);
        return null;
      } finally {
        inFlightRequests.delete(cleanId);
      }
    })();

    inFlightRequests.set(cleanId, fetchPromise);
    return fetchPromise;
  }

  /**
   * Selects the highest voted/locked community title submitted to DeArrow,
   * falling back to the original title if none are found.
   */
  static selectBestTitle(branding: DeArrowBranding | null, fallbackTitle: string): string {
    if (!branding || !Array.isArray(branding.titles) || branding.titles.length === 0) {
      return fallbackTitle;
    }

    // Filter out original titles and empty strings
    const candidates = branding.titles.filter(
      (t) => !t.original && typeof t.title === 'string' && t.title.trim().length > 0
    );

    if (candidates.length === 0) {
      return fallbackTitle;
    }

    // Sort: Locked entries prioritized first, then highest vote count
    candidates.sort((a, b) => {
      if (a.locked && !b.locked) return -1;
      if (!a.locked && b.locked) return 1;
      return (b.votes || 0) - (a.votes || 0);
    });

    const chosen = candidates[0].title.trim();
    return chosen || fallbackTitle;
  }

  /**
   * Selects the highest voted/locked community thumbnail frame timestamp from DeArrow,
   * constructing the official DeArrow thumbnail service URL.
   */
  static selectBestThumbnailUrl(
    videoId: string,
    branding: DeArrowBranding | null,
    fallbackThumbnail: string
  ): string {
    const cleanId = extractCleanYouTubeId(videoId);
    if (!cleanId || !branding || !Array.isArray(branding.thumbnails) || branding.thumbnails.length === 0) {
      return fallbackThumbnail;
    }

    // Filter out original thumbnail references and items without valid numeric timestamp
    const candidates = branding.thumbnails.filter(
      (t) => !t.original && typeof t.timestamp === 'number' && !isNaN(t.timestamp)
    );

    if (candidates.length === 0) {
      return fallbackThumbnail;
    }

    // Sort: Locked entries prioritized first, then highest vote count
    candidates.sort((a, b) => {
      if (a.locked && !b.locked) return -1;
      if (!a.locked && b.locked) return 1;
      return (b.votes || 0) - (a.votes || 0);
    });

    const selectedTimestamp = candidates[0].timestamp;
    if (typeof selectedTimestamp !== 'number') {
      return fallbackThumbnail;
    }

    return this.getThumbnailUrl(cleanId, selectedTimestamp);
  }

  /**
   * Constructs the official DeArrow thumbnail endpoint URL
   */
  static getThumbnailUrl(videoId: string, timestamp: number): string {
    const cleanId = extractCleanYouTubeId(videoId);
    return `https://dearrow-thumb.ajay.app/api/v1/getThumbnail?videoID=${encodeURIComponent(cleanId)}&time=${timestamp}`;
  }

  /**
   * Clears the in-memory DeArrow cache
   */
  static clearCache(): void {
    brandingCache.clear();
    inFlightRequests.clear();
  }
}
