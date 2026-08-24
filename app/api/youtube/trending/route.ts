import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { parseYouTubeViews } from '@/lib/youtube-views';
import { isFreshAndHotVideo, filterFreshVideos } from '@/lib/video-freshness';

// Scrape YouTube real Trending Feed: https://www.youtube.com/feed/trending
async function scrapeYouTubeTrendingFeed() {
  try {
    const res = await fetch('https://www.youtube.com/feed/trending', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cookie': 'PREF=hl=id&gl=ID;',
      },
      next: { revalidate: 180 }, // Revalidate every 3 minutes
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

    function extractVideo(v: any) {
      if (!v || !v.videoId) return;
      const videoId = v.videoId;
      if (seen.has(videoId)) return;
      seen.add(videoId);

      const title =
        v.title?.runs?.[0]?.text ||
        v.title?.simpleText ||
        v.headline?.simpleText ||
        'Trending Video';

      const channelTitle =
        v.ownerText?.runs?.[0]?.text ||
        v.shortBylineText?.runs?.[0]?.text ||
        v.longBylineText?.runs?.[0]?.text ||
        'YouTube Creator';

      const channelId =
        v.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
        `c-${videoId}`;

      const viewText =
        v.viewCountText?.simpleText ||
        v.shortViewCountText?.simpleText ||
        (Array.isArray(v.viewCountText?.runs) ? v.viewCountText.runs.map((r: any) => r.text).join('') : '') ||
        (Array.isArray(v.shortViewCountText?.runs) ? v.shortViewCountText.runs.map((r: any) => r.text).join('') : '') ||
        v.accessibility?.accessibilityData?.label ||
        '';

      const uploadedAt =
        v.publishedTimeText?.simpleText ||
        (Array.isArray(v.publishedTimeText?.runs) ? v.publishedTimeText.runs.map((r: any) => r.text).join('') : '') ||
        'Trending Today';

      const duration =
        v.lengthText?.simpleText ||
        (Array.isArray(v.lengthText?.runs) ? v.lengthText.runs.map((r: any) => r.text).join('') : '') ||
        '10:00';

      const thumb =
        v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const numericViews = parseYouTubeViews(v.viewCountText, v.shortViewCountText, 450000);

      const item = {
        id: `yt-${videoId}`,
        youtubeId: videoId,
        title,
        description:
          v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') ||
          `Trending video "${title}" on NextTube.`,
        channelTitle,
        channelId,
        channelAvatar:
          v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url ||
          `https://picsum.photos/seed/${encodeURIComponent(channelTitle)}/100/100`,
        subscriberCount: '1M+',
        verified: Boolean(v.ownerBadges?.length || v.badges?.length),
        thumbnailUrl: thumb,
        views: numericViews,
        likes: Math.round(numericViews * 0.05) || 15000,
        dislikes: 20,
        uploadedAt,
        duration,
        category: 'Trending',
        tags: [channelTitle, 'Trending', 'Viral', 'YouTube'],
        commentsCount: Math.round(numericViews * 0.004) || 600,
      };

      if (isFreshAndHotVideo(item)) {
        results.push(item);
      }
    }

    function walk(node: any) {
      if (!node || typeof node !== 'object') return;

      if (node.videoRenderer) {
        extractVideo(node.videoRenderer);
      } else if (node.gridVideoRenderer) {
        extractVideo(node.gridVideoRenderer);
      } else if (node.compactVideoRenderer) {
        extractVideo(node.compactVideoRenderer);
      }

      for (const key of Object.keys(node)) {
        walk(node[key]);
      }
    }

    walk(data);
    return results;
  } catch (err) {
    console.warn('YouTube feed/trending scraper notice:', err);
    return [];
  }
}

// Scrape YouTube Search filtered for this week's most popular viral videos
async function scrapeTrendingSearch(query = 'viral trending indonesia hari ini') {
  try {
    // sp=CAMSAhAB is sorted by view count and uploaded this week on YouTube
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=CAMSAhAB`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 120 },
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

    function extractVideo(v: any) {
      if (!v || !v.videoId) return;
      const videoId = v.videoId;
      if (seen.has(videoId)) return;
      seen.add(videoId);

      const title =
        v.title?.runs?.[0]?.text ||
        v.title?.simpleText ||
        'Trending Video';

      const channelTitle =
        v.ownerText?.runs?.[0]?.text ||
        v.shortBylineText?.runs?.[0]?.text ||
        'YouTube Creator';

      const channelId =
        v.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
        `c-${videoId}`;

      const uploadedAt =
        v.publishedTimeText?.simpleText ||
        (Array.isArray(v.publishedTimeText?.runs) ? v.publishedTimeText.runs.map((r: any) => r.text).join('') : '') ||
        'Hari ini';

      const duration =
        v.lengthText?.simpleText ||
        (Array.isArray(v.lengthText?.runs) ? v.lengthText.runs.map((r: any) => r.text).join('') : '') ||
        '10:00';

      const thumb =
        v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const numericViews = parseYouTubeViews(v.viewCountText, v.shortViewCountText, 350000);

      const item = {
        id: `yt-${videoId}`,
        youtubeId: videoId,
        title,
        description:
          v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') ||
          `Video viral "${title}" di NextTube.`,
        channelTitle,
        channelId,
        channelAvatar:
          v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url ||
          `https://picsum.photos/seed/${encodeURIComponent(channelTitle)}/100/100`,
        subscriberCount: '500K+',
        verified: Boolean(v.ownerBadges?.length || v.badges?.length),
        thumbnailUrl: thumb,
        views: numericViews,
        likes: Math.round(numericViews * 0.05) || 12000,
        dislikes: 15,
        uploadedAt,
        duration,
        category: 'Trending',
        tags: [channelTitle, 'Trending', 'Viral', 'Rame'],
        commentsCount: Math.round(numericViews * 0.003) || 500,
      };

      if (isFreshAndHotVideo(item)) {
        results.push(item);
      }
    }

    function walk(node: any) {
      if (!node || typeof node !== 'object') return;
      if (node.videoRenderer) {
        extractVideo(node.videoRenderer);
      }
      for (const key of Object.keys(node)) {
        walk(node[key]);
      }
    }

    walk(data);
    return results;
  } catch (err) {
    console.warn('HTML trending search notice:', err);
    return [];
  }
}

// Fetch real trending YouTube videos
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  // 1. Primary: Scrape YouTube's official /feed/trending
  const trendingFeed = await scrapeYouTubeTrendingFeed();

  // 2. Fetch recent viral topics in parallel
  const viralQueries = q
    ? [q]
    : [
        'viral tiktok indonesia terbaru hari ini',
        'trending youtube indonesia',
        'video viral yang lagi rame hari ini',
        'musik viral tiktok terbaru',
      ];

  const searchPromises = viralQueries.map((query) => scrapeTrendingSearch(query));
  const searchResultsLists = await Promise.all(searchPromises);

  const combined = [...trendingFeed];
  const uniqueMap = new Map<string, any>();

  // Add official feed first
  for (const v of combined) {
    uniqueMap.set(v.id, v);
  }

  // Add search results
  for (const list of searchResultsLists) {
    for (const v of list) {
      if (!uniqueMap.has(v.id)) {
        uniqueMap.set(v.id, v);
      }
    }
  }

  const finalResults = Array.from(uniqueMap.values());

  if (finalResults.length >= 8) {
    return NextResponse.json({
      results: finalResults,
      count: finalResults.length,
      source: 'live-viral-aggregator',
    });
  }

  // 3. Fallback: youtube-sr library search for latest viral videos
  try {
    const srResults = await YouTube.search('viral tiktok trending indonesia hari ini', {
      limit: 30,
      type: 'video',
    });

    const formatted = (srResults || [])
      .filter((item: any) => item && item.id && item.title)
      .map((item: any) => {
        const videoId = item.id;
        const thumb =
          item.thumbnail?.url ||
          (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 'https://picsum.photos/640/360');

        return {
          id: `yt-${videoId}`,
          youtubeId: videoId,
          title: item.title,
          description: item.description || `Trending YouTube Video: ${item.title}`,
          channelTitle: item.channel?.name || 'YouTube Creator',
          channelId: item.channel?.id || `c-${item.channel?.name?.replace(/\s+/g, '-').toLowerCase() || videoId}`,
          channelAvatar: item.channel?.icon?.url || `https://picsum.photos/seed/${encodeURIComponent(item.channel?.name || videoId || 'creator')}/100/100`,
          subscriberCount: item.channel?.subscribers || '1M+',
          verified: Boolean(item.channel?.verified),
          thumbnailUrl: thumb,
          views: typeof item.views === 'number' ? item.views : 350000,
          likes: Math.floor((item.views || 200000) * 0.05) || 12500,
          dislikes: 12,
          uploadedAt: item.uploadedAt || 'Trending Hari Ini',
          duration: item.durationFormatted || '10:00',
          category: 'Trending',
          tags: ['Trending', item.channel?.name || 'Viral', 'YouTube', 'Rame'],
          commentsCount: Math.floor((item.views || 200000) * 0.003) || 600,
        };
      })
      .filter(isFreshAndHotVideo);

    for (const v of formatted) {
      if (!uniqueMap.has(v.id)) {
        uniqueMap.set(v.id, v);
      }
    }

    const mergedSr = Array.from(uniqueMap.values());
    if (mergedSr.length > 0) {
      return NextResponse.json({ results: mergedSr, count: mergedSr.length, source: 'youtube-sr-aggregator' });
    }
  } catch (error) {
    console.warn('youtube-sr trending search notice:', error);
  }

  // 4. Return whatever feed/search items we found
  return NextResponse.json({ results: finalResults, count: finalResults.length, source: 'fallback' });
}
