import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { parseYouTubeViews } from '@/lib/youtube-views';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get('videoId') || searchParams.get('id') || '';
  const videoId = rawId.replace(/^yt-/, '').trim();

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  // 1. Primary: Scrape YouTube Watch Page for exact live data
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    const res = await fetch(watchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const html = await res.text();

      // Extract player response
      const playerMatch =
        html.match(/var ytInitialPlayerResponse = ({[\s\S]*?});<\/script>/) ||
        html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);

      let videoDetails: any = null;
      let microformat: any = null;

      if (playerMatch && playerMatch[1]) {
        try {
          const parsedPlayer = JSON.parse(playerMatch[1]);
          videoDetails = parsedPlayer.videoDetails;
          microformat = parsedPlayer.microformat?.playerMicroformatRenderer;
        } catch {}
      }

      // Extract initial data for extra details
      const dataMatch =
        html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) ||
        html.match(/window\["ytInitialData"\] = ({[\s\S]*?});<\/script>/);

      let ytData: any = null;
      if (dataMatch && dataMatch[1]) {
        try {
          ytData = JSON.parse(dataMatch[1]);
        } catch {}
      }

      if (videoDetails) {
        const rawViews =
          videoDetails.viewCount ||
          microformat?.viewCount ||
          '';

        const numericViews = parseInt(String(rawViews).replace(/[^0-9]/g, ''), 10) ||
          parseYouTubeViews(rawViews, null, 100000);

        const title = videoDetails.title || microformat?.title?.simpleText || 'YouTube Video';
        const channelTitle = videoDetails.author || 'YouTube Creator';
        const channelId = videoDetails.channelId || `c-${videoId}`;
        const description = videoDetails.shortDescription || microformat?.description?.simpleText || '';
        const durationSec = parseInt(videoDetails.lengthSeconds || '0', 10);
        
        let durationFormatted = '10:00';
        if (durationSec > 0) {
          const mins = Math.floor(durationSec / 60);
          const secs = durationSec % 60;
          durationFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        const publishedTime =
          microformat?.publishDate ||
          microformat?.uploadDate ||
          'Recently';

        // Format nice upload date
        let uploadedAt = 'Recently';
        if (publishedTime && publishedTime !== 'Recently') {
          try {
            const dateObj = new Date(publishedTime);
            if (!isNaN(dateObj.getTime())) {
              uploadedAt = new Intl.DateTimeFormat('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }).format(dateObj);
            }
          } catch {}
        }

        // Try to extract exact likes
        let likes = Math.round(numericViews * 0.04) || 2500;
        let subscriberCount = '100K+';

        // Check primary info renderer
        if (ytData) {
          const findLike = (node: any) => {
            if (!node || typeof node !== 'object') return;
            if (node.segmentedLikeDislikeButtonViewModel?.likeButtonViewModel?.likeButtonViewModel?.toggleButtonViewModel?.toggleButtonViewModel?.defaultButtonViewModel?.buttonViewModel?.title) {
              const text = node.segmentedLikeDislikeButtonViewModel.likeButtonViewModel.likeButtonViewModel.toggleButtonViewModel.toggleButtonViewModel.defaultButtonViewModel.buttonViewModel.title;
              const parsedLikes = parseYouTubeViews(text, null, 0);
              if (parsedLikes > 0) likes = parsedLikes;
            }
            if (node.videoOwnerRenderer?.subscriberCountText?.simpleText) {
              subscriberCount = node.videoOwnerRenderer.subscriberCountText.simpleText;
            } else if (Array.isArray(node.videoOwnerRenderer?.subscriberCountText?.runs)) {
              subscriberCount = node.videoOwnerRenderer.subscriberCountText.runs.map((r: any) => r.text).join('');
            }
            for (const k of Object.keys(node)) {
              findLike(node[k]);
            }
          };
          findLike(ytData);
        }

        const thumbnail =
          videoDetails.thumbnail?.thumbnails?.[videoDetails.thumbnail.thumbnails.length - 1]?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return NextResponse.json({
          video: {
            id: `yt-${videoId}`,
            youtubeId: videoId,
            title,
            description,
            channelTitle,
            channelId,
            channelAvatar: `https://picsum.photos/seed/${encodeURIComponent(channelTitle)}/100/100`,
            subscriberCount,
            verified: true,
            thumbnailUrl: thumbnail,
            views: numericViews,
            likes,
            dislikes: 10,
            uploadedAt,
            duration: durationFormatted,
            category: 'YouTube',
            tags: Array.isArray(videoDetails.keywords) ? videoDetails.keywords : [channelTitle, 'YouTube'],
            commentsCount: Math.round(numericViews * 0.003) || 120,
          },
          source: 'watch-page-scrape',
        });
      }
    }
  } catch (err) {
    console.warn('Scraping watch page details notice:', err);
  }

  // 2. Fallback: youtube-sr getVideo
  try {
    const v = await YouTube.getVideo(`https://www.youtube.com/watch?v=${videoId}`);
    if (v) {
      return NextResponse.json({
        video: {
          id: `yt-${videoId}`,
          youtubeId: videoId,
          title: v.title || 'YouTube Video',
          description: v.description || '',
          channelTitle: v.channel?.name || 'YouTube Creator',
          channelId: v.channel?.id || `c-${videoId}`,
          channelAvatar: v.channel?.icon?.url || `https://picsum.photos/seed/${encodeURIComponent(v.channel?.name || videoId)}/100/100`,
          subscriberCount: v.channel?.subscribers || '100K+',
          verified: Boolean(v.channel?.verified),
          thumbnailUrl: v.thumbnail?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          views: typeof v.views === 'number' ? v.views : 150000,
          likes: typeof v.likes === 'number' ? v.likes : Math.round((v.views || 100000) * 0.04),
          dislikes: 10,
          uploadedAt: v.uploadedAt || 'Recently',
          duration: v.durationFormatted || '10:00',
          category: 'YouTube',
          tags: Array.isArray(v.tags) ? v.tags : [v.channel?.name || 'YouTube'],
          commentsCount: Math.round((v.views || 100000) * 0.003) || 100,
        },
        source: 'youtube-sr',
      });
    }
  } catch (err) {
    console.warn('youtube-sr getVideo notice:', err);
  }

  return NextResponse.json({ error: 'Video details not found' }, { status: 404 });
}
