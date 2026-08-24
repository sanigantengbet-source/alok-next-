import { SponsorCategory, SponsorSegment, SponsorBlockSettings } from '@/types';

export const DEFAULT_SPONSORBLOCK_SETTINGS: SponsorBlockSettings = {
  enabled: true,
  categories: {
    sponsor: true,
    intro: true,
    outro: true,
    selfpromo: false,
    interaction: false,
    music_offtopic: false,
    preview: false,
    filler: false,
  },
  showSkipNotice: true,
  autoSkip: true,
};

export const CATEGORY_LABELS: Record<SponsorCategory, { label: string; idLabel: string; color: string; desc: string }> = {
  sponsor: {
    label: 'Sponsors',
    idLabel: 'Sponsor',
    color: '#00d482',
    desc: 'Paid promotions, sponsorships, and paid endorsements',
  },
  intro: {
    label: 'Intro / Intermission',
    idLabel: 'Intro',
    color: '#00ffff',
    desc: 'Interval / intro / intermission animation sequences',
  },
  outro: {
    label: 'Outro / Credits',
    idLabel: 'Outro / End Cards',
    color: '#0202ed',
    desc: 'Credits, end cards, or wrapping up before video ends',
  },
  selfpromo: {
    label: 'Self Promotion',
    idLabel: 'Self Promo',
    color: '#ffff00',
    desc: 'Promoting creator merch, subscriptions, or social media',
  },
  interaction: {
    label: 'Interaction Reminder',
    idLabel: 'Interaction (Like/Sub)',
    color: '#cc00ff',
    desc: 'Asking viewers to like, subscribe, or ring the bell',
  },
  music_offtopic: {
    label: 'Music / Offtopic',
    idLabel: 'Offtopic Section',
    color: '#ff9900',
    desc: 'Non-music section in music videos or unrelated tangents',
  },
  preview: {
    label: 'Preview / Recap',
    idLabel: 'Preview',
    color: '#008fd6',
    desc: 'Showcasing clips of what is coming up later in the video',
  },
  filler: {
    label: 'Filler Tangent',
    idLabel: 'Filler',
    color: '#7300ff',
    desc: 'Tangents or jokes added only for filler length',
  },
};

// In-Memory Segment Cache: Map<videoId, SponsorSegment[]>
const segmentCache = new Map<string, { segments: SponsorSegment[]; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

export class SponsorBlockService {
  /**
   * Get cached segments synchronously if available and not expired
   */
  static getCachedSegments(videoId: string): SponsorSegment[] | null {
    if (!videoId) return null;
    const entry = segmentCache.get(videoId);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      segmentCache.delete(videoId);
      return null;
    }
    return entry.segments;
  }

  /**
   * Fetch SponsorBlock skip segments for a given YouTube Video ID.
   * Uses in-memory cache first, then tries Next.js internal proxy, with direct SponsorBlock API fallback.
   */
  static async getSegments(videoId: string): Promise<SponsorSegment[]> {
    if (!videoId || typeof videoId !== 'string') return [];

    // Check cache
    const cached = this.getCachedSegments(videoId);
    if (cached !== null) {
      return cached;
    }

    try {
      // 1. First attempt: call local server proxy route
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const localRes = await fetch(`/api/sponsorblock?videoID=${encodeURIComponent(videoId)}`, {
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (localRes && localRes.ok) {
        const data = await localRes.json();
        if (Array.isArray(data.segments)) {
          segmentCache.set(videoId, { segments: data.segments, timestamp: Date.now() });
          return data.segments;
        }
      }

      // 2. Direct fallback to official SponsorBlock API
      const directUrl = `https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(videoId)}`;
      const directController = new AbortController();
      const directTimeout = setTimeout(() => directController.abort(), 6000);

      const directRes = await fetch(directUrl, {
        signal: directController.signal,
      }).catch(() => null);

      clearTimeout(directTimeout);

      if (directRes && directRes.ok) {
        const rawSegments = await directRes.json();
        if (Array.isArray(rawSegments)) {
          const parsed: SponsorSegment[] = rawSegments.map((item: any) => ({
            category: item.category as SponsorCategory,
            actionType: item.actionType || 'skip',
            segment: item.segment as [number, number],
            UUID: item.UUID || `uuid-${Math.random()}`,
            videoDuration: item.videoDuration,
            votes: item.votes,
            locked: item.locked,
          }));

          segmentCache.set(videoId, { segments: parsed, timestamp: Date.now() });
          return parsed;
        }
      }

      // If 404 (no segments found on SponsorBlock) or error, cache empty array to prevent hammering
      segmentCache.set(videoId, { segments: [], timestamp: Date.now() });
      return [];
    } catch {
      // Return empty array on any failure without interrupting video playback
      segmentCache.set(videoId, { segments: [], timestamp: Date.now() });
      return [];
    }
  }

  /**
   * Evaluates if current playback position falls into an active SponsorBlock segment.
   * Returns the segment to skip, or null if no skip is needed.
   */
  static shouldSkip(
    currentTime: number,
    segments: SponsorSegment[],
    settings: SponsorBlockSettings,
    lastSkippedUUID?: string | null
  ): SponsorSegment | null {
    if (!settings.enabled || !settings.autoSkip || !segments || segments.length === 0) {
      return null;
    }

    for (const seg of segments) {
      if (!seg || !Array.isArray(seg.segment) || seg.segment.length < 2) continue;

      const [start, end] = seg.segment;
      const category = seg.category;

      // Check if this category is enabled in user settings
      const isCatEnabled = settings.categories[category] ?? false;
      if (!isCatEnabled) continue;

      // Duplicate skip protection: ignore if we just skipped this exact segment
      if (lastSkippedUUID && lastSkippedUUID === seg.UUID) {
        // If user is currently beyond the segment, don't re-trigger
        if (currentTime >= end - 0.5) continue;
      }

      // Check if current playback time is inside [start, end)
      // We give a small 0.1s margin to ensure smooth skip detection
      if (currentTime >= start && currentTime < end - 0.25) {
        return seg;
      }
    }

    return null;
  }

  /**
   * Clear in-memory segment cache
   */
  static clearCache(): void {
    segmentCache.clear();
  }

  /**
   * Get human readable category label
   */
  static getCategoryLabel(category: SponsorCategory): string {
    return CATEGORY_LABELS[category]?.idLabel || category;
  }
}
