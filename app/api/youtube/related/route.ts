import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { parseYouTubeViews } from '@/lib/youtube-views';

// Helper to clean and sanitize title for search queries
function getSearchKeywords(title: string, channelTitle: string): string {
  if (!title) return channelTitle || 'trending';
  // Remove special characters, brackets, hashtags, boilerplate
  const cleanTitle = title
    .replace(/[\[\]\(\)\{\}\#\|]/g, ' ')
    .replace(/\b(official music video|official video|official audio|full album|video clip|4k|hd|mv|crash course|full course)\b/gi, '')
    .trim();

  const words = cleanTitle.split(/\s+/).filter((w) => w.length > 2);
  const topWords = words.slice(0, 4).join(' ');
  return topWords || cleanTitle;
}

// Scrape YouTube Watch Page for real-time recommendations (secondaryResults)
async function scrapeRelatedFromWatchPage(videoId: string) {
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    const res = await fetch(watchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const html = await res.text();
    const match =
      html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) ||
      html.match(/window\["ytInitialData"\] = ({[\s\S]*?});<\/script>/) ||
      html.match(/ytInitialData\s*=\s*({.+?});/);

    if (!match || !match[1]) return [];

    const data = JSON.parse(match[1]);
    const results: any[] = [];
    const seen = new Set<string>();
    seen.add(videoId);

    function extractVideo(v: any) {
      if (!v || !v.videoId) return;
      const vId = v.videoId;
      if (seen.has(vId)) return;
      seen.add(vId);

      const title =
        v.title?.runs?.[0]?.text ||
        v.title?.simpleText ||
        v.headline?.simpleText ||
        'Related Video';

      const channelTitle =
        v.shortBylineText?.runs?.[0]?.text ||
        v.ownerText?.runs?.[0]?.text ||
        v.longBylineText?.runs?.[0]?.text ||
        'YouTube Creator';

      const channelId =
        v.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
        `c-${vId}`;

      const uploadedAt =
        v.publishedTimeText?.simpleText ||
        (Array.isArray(v.publishedTimeText?.runs) ? v.publishedTimeText.runs.map((r: any) => r.text).join('') : '') ||
        'Recommended';

      const duration =
        v.lengthText?.simpleText ||
        (Array.isArray(v.lengthText?.runs) ? v.lengthText.runs.map((r: any) => r.text).join('') : '') ||
        '10:00';

      const thumb =
        v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url ||
        `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;

      const numericViews = parseYouTubeViews(v.viewCountText, v.shortViewCountText, 85000);

      results.push({
        id: `yt-${vId}`,
        youtubeId: vId,
        title,
        description: `Watch "${title}" by ${channelTitle} on NextTube.`,
        channelTitle,
        channelId,
        channelAvatar:
          v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url ||
          `https://picsum.photos/seed/${encodeURIComponent(channelTitle)}/100/100`,
        subscriberCount: '100K+',
        verified: Boolean(v.ownerBadges?.length || v.badges?.length),
        thumbnailUrl: thumb,
        views: numericViews,
        likes: Math.round(numericViews * 0.04) || 6000,
        dislikes: 10,
        uploadedAt,
        duration,
        category: 'Related',
        tags: [channelTitle, 'Related', 'Recommended'],
        commentsCount: Math.round(numericViews * 0.002) || 200,
      });
    }

    function walk(node: any) {
      if (!node || typeof node !== 'object') return;

      if (node.compactVideoRenderer) {
        extractVideo(node.compactVideoRenderer);
      } else if (node.videoRenderer) {
        extractVideo(node.videoRenderer);
      }

      for (const key of Object.keys(node)) {
        walk(node[key]);
      }
    }

    walk(data?.contents?.twoColumnWatchNextResults?.secondaryResults || data);
    return results;
  } catch (err) {
    console.warn('Watch page recommendation scraper notice:', err);
    return [];
  }
}

// Scrape YouTube HTML search as guaranteed fallback
async function searchRelatedViaHTML(query: string, currentVideoId: string, limit = 16) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const html = await res.text();
    const match =
      html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) ||
      html.match(/window\["ytInitialData"\] = ({[\s\S]*?});<\/script>/) ||
      html.match(/ytInitialData\s*=\s*({.+?});/);

    if (!match || !match[1]) return [];

    const data = JSON.parse(match[1]);
    const results: any[] = [];
    const seen = new Set<string>();
    if (currentVideoId) seen.add(currentVideoId);

    function walk(node: any) {
      if (!node || typeof node !== 'object') return;

      if (node.videoRenderer?.videoId) {
        const v = node.videoRenderer;
        const vId = v.videoId;
        if (vId && !seen.has(vId) && results.length < limit) {
          seen.add(vId);

          const title = v.title?.runs?.[0]?.text || v.title?.simpleText || 'Related Video';
          const channelTitle = v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || 'YouTube Creator';
          const numericViews = parseYouTubeViews(v.viewCountText, v.shortViewCountText, 65000);

          results.push({
            id: `yt-${vId}`,
            youtubeId: vId,
            title,
            description: `Watch "${title}" by ${channelTitle} on NextTube.`,
            channelTitle,
            channelId: v.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || `c-${vId}`,
            channelAvatar:
              v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url ||
              `https://picsum.photos/seed/${encodeURIComponent(channelTitle)}/100/100`,
            subscriberCount: '100K+',
            verified: Boolean(v.ownerBadges?.length),
            thumbnailUrl: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
            views: numericViews,
            likes: Math.round(numericViews * 0.04) || 4000,
            dislikes: 8,
            uploadedAt: v.publishedTimeText?.simpleText || 'Recently',
            duration: v.lengthText?.simpleText || '10:00',
            category: 'Related',
            tags: [channelTitle, 'Related'],
            commentsCount: Math.round(numericViews * 0.002) || 120,
          });
        }
      }

      for (const key of Object.keys(node)) {
        walk(node[key]);
      }
    }

    walk(data);
    return results;
  } catch (e) {
    console.warn('HTML search for related videos notice:', e);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get('videoId') || '';
  const videoId = rawId.replace(/^yt-/, '').trim();
  const title = searchParams.get('title') || '';
  const channelTitle = searchParams.get('channel') || '';
  const limit = parseInt(searchParams.get('limit') || '18', 10);

  // Strategy 1: Real-time YouTube watch page recommendation scraping
  if (videoId && !videoId.startsWith('v-')) {
    const scraped = await scrapeRelatedFromWatchPage(videoId);
    if (scraped && scraped.length >= 4) {
      return NextResponse.json({ results: scraped.slice(0, limit), source: 'watch-next' });
    }
  }

  // Strategy 2: Targeted search by Channel and Title keywords via HTML scraper
  const keywords = getSearchKeywords(title, channelTitle);
  const searchQuery = channelTitle ? `${channelTitle} ${keywords}` : keywords;

  if (searchQuery.trim()) {
    const htmlResults = await searchRelatedViaHTML(searchQuery, videoId, limit);
    if (htmlResults.length >= 3) {
      return NextResponse.json({ results: htmlResults, source: 'html-search' });
    }
  }

  // Strategy 3: Targeted search via youtube-sr
  try {
    const searchResults = await YouTube.search(searchQuery || 'trending video', {
      limit: limit + 5,
      type: 'video',
      safeSearch: false,
    });

    if (searchResults && searchResults.length > 0) {
      const formatted = searchResults
        .filter((item) => item.id && item.title && item.id !== videoId)
        .slice(0, limit)
        .map((item) => {
          const thumb =
            item.thumbnail?.url ||
            `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

          return {
            id: `yt-${item.id}`,
            youtubeId: item.id,
            title: item.title,
            description: item.description || `Watch "${item.title}" by ${item.channel?.name || 'creator'} on NextTube.`,
            channelTitle: item.channel?.name || channelTitle || 'YouTube Creator',
            channelId: item.channel?.id || `c-${item.channel?.name?.replace(/\s+/g, '-').toLowerCase() || item.id}`,
            channelAvatar: item.channel?.icon?.url || `https://picsum.photos/seed/${encodeURIComponent(item.channel?.name || item.id || 'creator')}/100/100`,
            subscriberCount: item.channel?.subscribers || '250K+',
            verified: Boolean(item.channel?.verified),
            thumbnailUrl: thumb,
            views: typeof item.views === 'number' ? item.views : 120000,
            likes: Math.floor((item.views || 100000) * 0.04) || 4500,
            dislikes: 12,
            uploadedAt: item.uploadedAt || 'Recommended',
            duration: item.durationFormatted || '10:00',
            category: 'Related',
            tags: [item.channel?.name || channelTitle, 'Related'],
            commentsCount: Math.floor((item.views || 100000) * 0.002) || 150,
          };
        });

      if (formatted.length > 0) {
        return NextResponse.json({ results: formatted, source: 'youtube-sr' });
      }
    }
  } catch (err) {
    console.warn('Semantic search fallback notice:', err);
  }

  return NextResponse.json({ results: [], source: 'empty' });
}
