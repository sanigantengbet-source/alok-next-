import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { INITIAL_SHORTS } from '@/data/shorts';
import { parseYouTubeViews } from '@/lib/youtube-views';

// Helper to scrape shorts directly from YouTube HTML ytInitialData
async function scrapeShortsFromYouTube(query = 'shorts viral trending') {
  try {
    const searchUrl = query.startsWith('http')
      ? query
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
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

    const parsed = JSON.parse(match[1]);
    const results: any[] = [];
    const seen = new Set<string>();

    function walk(node: any) {
      if (!node || typeof node !== 'object') return;

      // 1. Modern shortsLockupViewModel
      if (node.shortsLockupViewModel?.entityId) {
        const s = node.shortsLockupViewModel;
        const rawId = s.entityId.replace('shorts-shelf-item-', '').trim();
        const videoId = rawId.length === 11 ? rawId : (rawId.match(/[a-zA-Z0-9_-]{11}/)?.[0] || '');

        if (videoId && !seen.has(videoId)) {
          seen.add(videoId);
          const accessibilityText = s.accessibilityText || '';
          const parts = accessibilityText.split(',');
          const title = parts[0]?.trim() || s.overlayMetadata?.primaryText?.content || 'Viral Trending YouTube Short';
          const viewsText = parts[1]?.replace('– play Short', '').trim() || s.overlayMetadata?.secondaryText?.content || '850K views';

          const numericViews = parseYouTubeViews(parts[1] || s.overlayMetadata?.secondaryText?.content || accessibilityText, null, 750000);

          results.push({
            id: `short-yt-${videoId}`,
            youtubeId: videoId,
            title: title,
            description: `Trending YouTube Short: ${title}`,
            channelTitle: 'Trending Creator',
            channelId: `c-${videoId}`,
            channelAvatar: `https://picsum.photos/seed/${videoId}/100/100`,
            subscriberCount: '500K+',
            verified: true,
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            views: numericViews,
            likes: Math.floor(numericViews * 0.08) || 48000,
            dislikes: 35,
            uploadedAt: 'Trending',
            duration: '0:50',
            category: 'Shorts',
            tags: ['Shorts', 'Viral', 'Trending'],
            commentsCount: Math.floor(numericViews * 0.003) || 980,
          });
        }
      }

      // 2. reelItemRenderer (Classic Shorts)
      if (node.reelItemRenderer?.videoId) {
        const r = node.reelItemRenderer;
        const videoId = r.videoId;
        if (videoId && !seen.has(videoId)) {
          seen.add(videoId);
          const title = r.headline?.simpleText || r.headline?.runs?.[0]?.text || 'Trending Short';
          const numericViews = parseYouTubeViews(r.viewCountText, null, 620000);
          results.push({
            id: `short-yt-${videoId}`,
            youtubeId: videoId,
            title,
            description: `YouTube Short: ${title}`,
            channelTitle: r.ownerText?.runs?.[0]?.text || 'Trending Creator',
            channelId: `c-${videoId}`,
            channelAvatar: `https://picsum.photos/seed/${videoId}/100/100`,
            subscriberCount: '500K',
            verified: true,
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            views: numericViews,
            likes: Math.floor(numericViews * 0.07) || 40000,
            dislikes: 18,
            uploadedAt: 'Trending',
            duration: '0:45',
            category: 'Shorts',
            tags: ['Shorts', 'Viral', 'Trending'],
            commentsCount: Math.floor(numericViews * 0.002) || 450,
          });
        }
      }

      // 3. videoRenderer if tagged with shorts
      if (node.videoRenderer?.videoId) {
        const v = node.videoRenderer;
        const videoId = v.videoId;
        const title = v.title?.runs?.[0]?.text || v.title?.simpleText || '';
        const duration = v.lengthText?.simpleText || '';
        const isShortDuration = duration.startsWith('0:') || duration === '1:00' || title.toLowerCase().includes('#short');

        if (videoId && isShortDuration && !seen.has(videoId)) {
          seen.add(videoId);
          const numericViews = parseYouTubeViews(v.viewCountText, v.shortViewCountText, 450000);
          results.push({
            id: `short-yt-${videoId}`,
            youtubeId: videoId,
            title: title || 'Trending Short',
            description: `Trending Short: ${title}`,
            channelTitle: v.ownerText?.runs?.[0]?.text || 'Creator',
            channelId: `c-${videoId}`,
            channelAvatar:
              v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url ||
              `https://picsum.photos/seed/${videoId}/100/100`,
            subscriberCount: '250K+',
            verified: Boolean(v.ownerBadges?.length),
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            views: numericViews,
            likes: Math.floor(numericViews * 0.07) || 30000,
            dislikes: 12,
            uploadedAt: v.publishedTimeText?.simpleText || 'Trending Now',
            duration: duration || '0:50',
            category: 'Shorts',
            tags: ['Shorts', 'Viral', 'Trending'],
            commentsCount: Math.floor(numericViews * 0.002) || 300,
          });
        }
      }

      for (const key of Object.keys(node)) {
        walk(node[key]);
      }
    }

    walk(parsed);
    return results;
  } catch (err) {
    console.warn('YouTube HTML scraper notice:', err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '#shorts trending viral';

  // 1. Primary: Scrape YouTube search for trending shorts
  try {
    const scraped = await scrapeShortsFromYouTube(q);
    if (scraped && scraped.length > 0) {
      return NextResponse.json({ results: scraped, count: scraped.length });
    }
  } catch (e) {
    console.warn('Scraping error:', e);
  }

  // 1b. Try Trending Feed directly
  try {
    const trendingScraped = await scrapeShortsFromYouTube('https://www.youtube.com/feed/trending');
    if (trendingScraped && trendingScraped.length > 0) {
      return NextResponse.json({ results: trendingScraped, count: trendingScraped.length });
    }
  } catch (e) {
    console.warn('Trending feed scraping notice:', e);
  }

  // 2. Secondary fallback: youtube-sr search for trending shorts
  try {
    const results = await YouTube.search(`${q} #shorts`, {
      limit: 25,
      type: 'video',
    });

    const formatted = (results || [])
      .filter((item: any) => item && item.id && item.title)
      .map((item: any) => {
        const videoId = item.id;
        const thumb =
          item.thumbnail?.url ||
          (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 'https://picsum.photos/480/854');

        return {
          id: `short-yt-${videoId}`,
          youtubeId: videoId,
          title: item.title,
          description: item.description || `Trending Short: ${item.title}`,
          channelTitle: item.channel?.name || 'Trending Creator',
          channelId: item.channel?.id || `c-${item.channel?.name?.replace(/\s+/g, '-').toLowerCase() || videoId}`,
          channelAvatar:
            item.channel?.icon?.url ||
            `https://picsum.photos/seed/${encodeURIComponent(item.channel?.name || videoId || 'shortcreator')}/100/100`,
          subscriberCount: item.channel?.subscribers || '750K',
          verified: Boolean(item.channel?.verified),
          thumbnailUrl: thumb,
          views: typeof item.views === 'number' ? item.views : 650000,
          likes: Math.floor((item.views || 250000) * 0.08) || 24000,
          dislikes: 24,
          uploadedAt: item.uploadedAt || 'Trending',
          duration: item.durationFormatted || '0:50',
          category: 'Shorts',
          tags: ['Shorts', 'Viral', 'Trending'],
          commentsCount: Math.floor((item.views || 250000) * 0.005) || 750,
        };
      });

    if (formatted.length > 0) {
      return NextResponse.json({ results: formatted, count: formatted.length });
    }
  } catch (error) {
    console.warn('youtube-sr fallback search notice:', error);
  }

  // 3. Guaranteed Fallback: Curated active Shorts dataset
  return NextResponse.json({ results: INITIAL_SHORTS, count: INITIAL_SHORTS.length });
}
