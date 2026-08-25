import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { parseYouTubeViews } from '@/lib/youtube-views';

// Scrape YouTube HTML search for live streams & live replays for a channel
async function searchLiveReplaysViaHTML(query: string, limit = 20) {
  try {
    // sp=EgJAAQ%253D%253D is YouTube's filter for live / live content
    const searchQueries = [
      `${query} live stream replay`,
      `${query} live stream`,
      `${query} live`,
    ];

    const results: any[] = [];
    const seenIds = new Set<string>();

    for (const q of searchQueries) {
      if (results.length >= limit) break;

      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        },
        cache: 'no-store',
      });

      if (!res.ok) continue;

      const html = await res.text();
      const jsonMatch =
        html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) ||
        html.match(/window\["ytInitialData"\] = ({[\s\S]*?});<\/script>/);

      if (!jsonMatch || !jsonMatch[1]) continue;

      const data = JSON.parse(jsonMatch[1]);
      const contents =
        data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
          ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

      for (const item of contents) {
        if (results.length >= limit) break;
        const video = item.videoRenderer;
        if (!video || !video.videoId) continue;
        if (seenIds.has(video.videoId)) continue;

        const title = video.title?.runs?.[0]?.text || 'Live Stream Replay';
        const channelTitle = video.ownerText?.runs?.[0]?.text || query;
        const channelId =
          video.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
          `c-${video.videoId}`;
        const channelAvatar =
          video.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail
            ?.thumbnails?.[0]?.url ||
          `https://picsum.photos/seed/${encodeURIComponent(channelTitle)}/100/100`;

        const badges = video.badges?.map((b: any) => b?.metadataBadgeRenderer?.label?.toLowerCase() || '') || [];
        const isLiveNow = badges.includes('live') || badges.includes('live now');

        const uploadedText =
          video.publishedTimeText?.simpleText ||
          (Array.isArray(video.publishedTimeText?.runs)
            ? video.publishedTimeText.runs.map((r: any) => r.text).join('')
            : '') ||
          (isLiveNow ? 'Streaming Sekarang' : 'Streamed previously');

        const duration =
          video.lengthText?.simpleText ||
          (Array.isArray(video.lengthText?.runs)
            ? video.lengthText.runs.map((r: any) => r.text).join('')
            : '') ||
          (isLiveNow ? 'LIVE' : '1:24:30');

        const thumb =
          video.thumbnail?.thumbnails?.[video.thumbnail.thumbnails.length - 1]?.url ||
          `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;

        const numericViews = parseYouTubeViews(video.viewCountText, video.shortViewCountText, 68000);

        seenIds.add(video.videoId);
        results.push({
          id: `yt-${video.videoId}`,
          youtubeId: video.videoId,
          title,
          description:
            video.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') ||
            `Replay siaran langsung "${title}" di NextTube.`,
          channelTitle,
          channelId,
          channelAvatar,
          subscriberCount: '150K+',
          verified: Boolean(video.ownerBadges?.length),
          thumbnailUrl: thumb,
          views: numericViews,
          likes: Math.round(numericViews * 0.05) || 2400,
          dislikes: 18,
          uploadedAt: uploadedText,
          duration,
          category: 'Live Replay',
          tags: [channelTitle, 'Live', 'Replay', 'Stream'],
          commentsCount: Math.round(numericViews * 0.003) || 150,
          isLive: isLiveNow,
        });
      }
    }

    return results;
  } catch (err) {
    console.warn('Live Replay search error:', err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get('channel') || searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  if (!channel.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    // 1. Try search via youtube-sr
    const query = `${channel} live stream`;
    let srResults: any[] = [];

    try {
      const searchRes = await YouTube.search(query, {
        limit: Math.min(limit, 25),
        type: 'video',
        safeSearch: false,
      });

      if (Array.isArray(searchRes) && searchRes.length > 0) {
        srResults = searchRes
          .filter((v) => v && v.id)
          .map((v) => ({
            id: `yt-${v.id}`,
            youtubeId: v.id!,
            title: v.title || 'Live Stream Replay',
            description: v.description || `Replay siaran langsung ${v.title} di NextTube.`,
            channelTitle: v.channel?.name || channel,
            channelId: v.channel?.id || `c-${v.id}`,
            channelAvatar:
              v.channel?.icon?.url ||
              `https://picsum.photos/seed/${encodeURIComponent(v.channel?.name || channel)}/100/100`,
            subscriberCount: '200K+',
            verified: true,
            thumbnailUrl: v.thumbnail?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
            views: v.views || 45000,
            likes: Math.round((v.views || 45000) * 0.04) || 1800,
            dislikes: 10,
            uploadedAt: v.uploadedAt || 'Streamed',
            duration: v.durationFormatted || (v.live ? 'LIVE' : '1:15:00'),
            category: 'Live Replay',
            tags: [channel, 'Live Stream', 'Replay'],
            commentsCount: 180,
            isLive: Boolean(v.live),
          }));
      }
    } catch (e) {
      console.warn('youtube-sr live stream query failed:', e);
    }

    if (srResults.length >= 4) {
      return NextResponse.json({
        results: srResults,
        source: 'youtube-sr',
        channel,
      });
    }

    // 2. Fallback to scraping
    const htmlResults = await searchLiveReplaysViaHTML(channel, limit);
    const combined = [...srResults];
    const seen = new Set(srResults.map((r) => r.youtubeId));

    for (const item of htmlResults) {
      if (!seen.has(item.youtubeId)) {
        combined.push(item);
        seen.add(item.youtubeId);
      }
    }

    return NextResponse.json({
      results: combined,
      source: 'scraper-fallback',
      channel,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch live replays', results: [] },
      { status: 500 }
    );
  }
}
