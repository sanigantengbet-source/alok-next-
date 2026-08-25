import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { parseYouTubeViews } from '@/lib/youtube-views';
import { isFreshAndHotVideo, filterFreshVideos } from '@/lib/video-freshness';

// Helper to extract YouTube video ID if user searched a URL directly
function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pure 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // URL patterns (standard, shorts, embed, youtu.be)
  const urlPatterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  ];

  for (const pattern of urlPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Fallback HTML scraper parser to extract ytInitialData from youtube.com search
async function searchViaYouTubeHTML(query: string, limit = 20) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
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
    const jsonMatch = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) ||
                      html.match(/window\["ytInitialData"\] = ({[\s\S]*?});<\/script>/);

    if (!jsonMatch || !jsonMatch[1]) return [];

    const data = JSON.parse(jsonMatch[1]);
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

    const results: any[] = [];

    for (const rawItem of (contents as any[])) {
      if (results.length >= limit) break;
      const video: any = rawItem?.videoRenderer;
      if (!video || !video.videoId) continue;

      const title = video.title?.runs?.[0]?.text || 'YouTube Video';
      const channelTitle = video.ownerText?.runs?.[0]?.text || 'YouTube Creator';
      const channelId = video.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || `c-${video.videoId}`;
      const channelAvatar =
        video.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url ||
        `https://picsum.photos/seed/${encodeURIComponent(channelTitle)}/100/100`;

      const uploadedText =
        video.publishedTimeText?.simpleText ||
        (Array.isArray(video.publishedTimeText?.runs) ? video.publishedTimeText.runs.map((r: any) => r.text).join('') : '') ||
        'Recently';
      const duration =
        video.lengthText?.simpleText ||
        (Array.isArray(video.lengthText?.runs) ? video.lengthText.runs.map((r: any) => r.text).join('') : '') ||
        '10:00';
      const thumb =
        video.thumbnail?.thumbnails?.[video.thumbnail.thumbnails.length - 1]?.url ||
        `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;

      const numericViews = parseYouTubeViews(video.viewCountText, video.shortViewCountText, 45000);

      const videoItem = {
        id: `yt-${video.videoId}`,
        youtubeId: video.videoId,
        title,
        description:
          video.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') ||
          `Watch "${title}" on NextTube.`,
        channelTitle,
        channelId,
        channelAvatar,
        subscriberCount: '100K+',
        verified: Boolean(video.ownerBadges?.length),
        thumbnailUrl: thumb,
        views: numericViews,
        likes: Math.round(numericViews * 0.04) || 1200,
        dislikes: 12,
        uploadedAt: uploadedText,
        duration,
        category: 'YouTube Search',
        tags: [channelTitle, 'Video'],
        commentsCount: Math.round(numericViews * 0.002) || 85,
      };

      if (isFreshAndHotVideo(videoItem)) {
        results.push(videoItem);
      }
    }

    return results;
  } catch (err) {
    console.warn('YouTube HTML search fallback error:', err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '24', 10);

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  // 1. Direct YouTube link or video ID detection
  const directVideoId = extractYouTubeVideoId(query);
  if (directVideoId) {
    const directResult = {
      id: `yt-${directVideoId}`,
      youtubeId: directVideoId,
      title: `YouTube Video (${directVideoId})`,
      description: `Watch this video directly on NextTube player with real-time comments, share, and like controls.`,
      channelTitle: 'YouTube Creator',
      channelId: `c-${directVideoId}`,
      channelAvatar: `https://picsum.photos/seed/${directVideoId}/100/100`,
      subscriberCount: '100K',
      verified: true,
      thumbnailUrl: `https://i.ytimg.com/vi/${directVideoId}/hqdefault.jpg`,
      views: 125000,
      likes: 4500,
      dislikes: 20,
      uploadedAt: 'Recently',
      duration: 'YouTube Playback',
      category: 'Direct Video',
      tags: ['YouTube', 'Video', directVideoId],
      commentsCount: 120,
    };

    // Try to enrich with real title if possible
    try {
      const v = await YouTube.getVideo(`https://www.youtube.com/watch?v=${directVideoId}`).catch(() => null);
      if (v) {
        directResult.title = v.title || directResult.title;
        directResult.channelTitle = v.channel?.name || directResult.channelTitle;
        directResult.thumbnailUrl = v.thumbnail?.url || directResult.thumbnailUrl;
        directResult.duration = v.durationFormatted || directResult.duration;
        directResult.views = v.views || directResult.views;
      }
    } catch (e) {
      console.log('Video enrichment notice:', e);
    }

    return NextResponse.json({ results: [directResult] });
  }

  // 2. Primary: Fast HTML Scraping or youtube-sr search
  try {
    const htmlResults = await searchViaYouTubeHTML(query, limit);
    if (htmlResults.length > 0) {
      return NextResponse.json({ results: htmlResults });
    }
  } catch {
    // continue to fallback
  }

  // 3. Fallback: youtube-sr search
  try {
    const searchResults = await YouTube.search(query, {
      limit: Math.min(limit, 30),
      type: 'video',
      safeSearch: false,
    }).catch(() => []);

    if (searchResults && searchResults.length > 0) {
      const formatted = searchResults
        .filter((item) => item && item.id && item.title)
        .map((item) => {
          const thumb =
            item.thumbnail?.url ||
            `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

          return {
            id: `yt-${item.id}`,
            youtubeId: item.id,
            title: item.title,
            description: item.description || `Watch "${item.title}" by ${item.channel?.name || 'creator'} on NextTube.`,
            channelTitle: item.channel?.name || 'YouTube Creator',
            channelId: item.channel?.id || `c-${item.channel?.name?.replace(/\s+/g, '-').toLowerCase() || item.id}`,
            channelAvatar: item.channel?.icon?.url || `https://picsum.photos/seed/${encodeURIComponent(item.channel?.name || item.id || 'creator')}/100/100`,
            subscriberCount: item.channel?.subscribers || '100K+',
            verified: Boolean(item.channel?.verified),
            thumbnailUrl: thumb,
            views: typeof item.views === 'number' ? item.views : 35000,
            likes: Math.floor((item.views || 40000) * 0.04) || 850,
            dislikes: Math.floor((item.views || 40000) * 0.001) || 12,
            uploadedAt: item.uploadedAt || 'Recently',
            duration: item.durationFormatted || '10:00',
            category: 'YouTube Search',
            tags: [item.channel?.name || 'YouTube', 'Video'],
            commentsCount: Math.floor((item.views || 40000) * 0.002) || 45,
          };
        })
        .filter(isFreshAndHotVideo);

      if (formatted.length > 0) {
        return NextResponse.json({ results: formatted });
      }
    }
  } catch {
    // handled gracefully
  }

  // 4. Return empty if nothing found
  return NextResponse.json({ results: [] });
}
