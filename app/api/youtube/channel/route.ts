import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { INITIAL_CHANNELS } from '@/data/channels';
import { Video, Channel, Playlist } from '@/types';

export const dynamic = 'force-dynamic';

// Helper to recursively extract all video / shorts / playlist renderers from YouTube initial data
function extractChannelContents(ytData: any, defaultChannel: Partial<Channel>) {
  const videos: Video[] = [];
  const shorts: Video[] = [];
  const playlists: Playlist[] = [];
  const seenVideoIds = new Set<string>();
  const seenPlaylistIds = new Set<string>();

  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return;

    // 1. Regular Video Renderer
    if (node.videoRenderer || node.gridVideoRenderer || node.compactVideoRenderer) {
      const v = node.videoRenderer || node.gridVideoRenderer || node.compactVideoRenderer;
      const videoId = v.videoId;
      if (videoId && !seenVideoIds.has(videoId)) {
        seenVideoIds.add(videoId);

        const title =
          v.title?.runs?.[0]?.text ||
          v.title?.simpleText ||
          v.headline?.simpleText ||
          'Video';

        const description =
          v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') ||
          v.descriptionSnippet?.runs?.map((r: any) => r.text).join('') ||
          `Watch "${title}" from ${defaultChannel.title || 'this channel'}.`;

        const viewText =
          v.viewCountText?.simpleText ||
          v.shortViewCountText?.simpleText ||
          v.viewCountText?.runs?.[0]?.text ||
          '10K views';

        const uploadedText =
          v.publishedTimeText?.simpleText ||
          v.publishedTimeText?.runs?.[0]?.text ||
          'Recently';

        const duration =
          v.lengthText?.simpleText ||
          v.lengthText?.runs?.[0]?.text ||
          '10:00';

        const thumbs = v.thumbnail?.thumbnails || [];
        const thumbUrl =
          thumbs[thumbs.length - 1]?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        let numericViews = 25000;
        const lowView = viewText.toLowerCase();
        if (lowView.includes('m')) {
          numericViews = Math.round(parseFloat(lowView) * 1000000);
        } else if (lowView.includes('k')) {
          numericViews = Math.round(parseFloat(lowView) * 1000);
        } else {
          const num = parseInt(viewText.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num) && num > 0) numericViews = num;
        }

        videos.push({
          id: `yt-${videoId}`,
          youtubeId: videoId,
          title,
          description,
          channelTitle: defaultChannel.title || 'Creator',
          channelId: defaultChannel.id || `c-${videoId}`,
          channelAvatar: defaultChannel.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(defaultChannel.title || 'YT')}`,
          subscriberCount: defaultChannel.subscribers || '100K+',
          verified: Boolean(defaultChannel.verified),
          thumbnailUrl: thumbUrl,
          views: numericViews,
          likes: Math.round(numericViews * 0.04) || 800,
          dislikes: 10,
          uploadedAt: uploadedText,
          duration,
          category: 'All',
          tags: [defaultChannel.title || 'Channel', 'Video'],
          commentsCount: Math.round(numericViews * 0.01) || 50,
        });
      }
    }

    // 2. Shorts ViewModel / Reel Item
    if (node.shortsLockupViewModel || node.reelItemRenderer) {
      const s = node.shortsLockupViewModel || node.reelItemRenderer;
      const videoId =
        s.entityId?.replace(/^shorts-lockup-/, '') ||
        s.videoId ||
        s.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId ||
        s.navigationEndpoint?.reelWatchEndpoint?.videoId;

      if (videoId && !seenVideoIds.has(videoId)) {
        seenVideoIds.add(videoId);
        const title =
          s.overlayMetadata?.primaryText?.content ||
          s.headline?.simpleText ||
          s.title?.runs?.[0]?.text ||
          'Shorts';

        const viewText =
          s.overlayMetadata?.secondaryText?.content ||
          s.viewCountText?.simpleText ||
          '50K views';

        const thumbs = s.thumbnail?.sources || s.thumbnail?.thumbnails || [];
        const thumbUrl =
          thumbs[thumbs.length - 1]?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        let numericViews = 45000;
        const lowView = viewText.toLowerCase();
        if (lowView.includes('m')) {
          numericViews = Math.round(parseFloat(lowView) * 1000000);
        } else if (lowView.includes('k')) {
          numericViews = Math.round(parseFloat(lowView) * 1000);
        }

        shorts.push({
          id: `yt-${videoId}`,
          youtubeId: videoId,
          title,
          description: `Shorts video by ${defaultChannel.title}`,
          channelTitle: defaultChannel.title || 'Creator',
          channelId: defaultChannel.id || `c-${videoId}`,
          channelAvatar: defaultChannel.avatar || '',
          subscriberCount: defaultChannel.subscribers || '100K+',
          verified: Boolean(defaultChannel.verified),
          thumbnailUrl: thumbUrl,
          views: numericViews,
          likes: Math.round(numericViews * 0.08) || 1200,
          dislikes: 5,
          uploadedAt: 'Shorts',
          duration: '0:45',
          category: 'Shorts',
          tags: ['Shorts', defaultChannel.title || 'Creator'],
          commentsCount: Math.round(numericViews * 0.01) || 30,
        });
      }
    }

    // 3. Playlist Renderer
    if (node.gridPlaylistRenderer || node.playlistRenderer) {
      const p = node.gridPlaylistRenderer || node.playlistRenderer;
      const playlistId = p.playlistId;
      if (playlistId && !seenPlaylistIds.has(playlistId)) {
        seenPlaylistIds.add(playlistId);
        const title = p.title?.runs?.[0]?.text || p.title?.simpleText || 'Playlist';
        const videoCountStr =
          p.videoCountShortText?.simpleText ||
          p.videoCountText?.runs?.[0]?.text ||
          p.videoCount ||
          '10';
        const videoCount = parseInt(String(videoCountStr).replace(/[^0-9]/g, ''), 10) || 10;
        const thumbs = p.thumbnail?.thumbnails || p.thumbnails?.[0]?.thumbnails || [];
        const thumbUrl = thumbs[thumbs.length - 1]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=640&auto=format&fit=crop&q=80';

        playlists.push({
          id: playlistId,
          title,
          thumbnailUrl: thumbUrl,
          videoCount,
          channelTitle: defaultChannel.title || 'Creator',
          channelId: defaultChannel.id,
          updatedAt: 'Updated recently',
        });
      }
    }

    // Recurse into children
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
    } else {
      for (const key of Object.keys(node)) {
        if (typeof node[key] === 'object' && node[key] !== null) {
          walk(node[key]);
        }
      }
    }
  };

  walk(ytData);

  return { videos, shorts, playlists };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (
    searchParams.get('q') ||
    searchParams.get('id') ||
    searchParams.get('name') ||
    searchParams.get('handle') ||
    searchParams.get('channelId') ||
    ''
  ).trim();

  if (!query) {
    return NextResponse.json({ error: 'Channel identifier required' }, { status: 400 });
  }

  // Check initial static channels database for instant baseline
  const cleanIdOrQuery = query.toLowerCase();
  const matchedInitial = INITIAL_CHANNELS.find(
    (c) =>
      c.id.toLowerCase() === cleanIdOrQuery ||
      c.title.toLowerCase() === cleanIdOrQuery ||
      (c.handle && c.handle.toLowerCase() === cleanIdOrQuery) ||
      (c.handle && c.handle.replace(/^@/, '').toLowerCase() === cleanIdOrQuery.replace(/^@/, ''))
  );

  try {
    const fetchHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    };

    // Determine target URL for YouTube
    let targetHandle = matchedInitial?.handle || query;
    let targetUrl = '';

    if (query.startsWith('UC') && query.length === 24) {
      targetUrl = `https://www.youtube.com/channel/${query}/videos`;
    } else if (targetHandle.startsWith('@')) {
      targetUrl = `https://www.youtube.com/${targetHandle}/videos`;
    } else {
      const cleanQ = targetHandle.replace(/^@/, '').replace(/^c-/, '').replace(/\s+/g, '');
      targetUrl = `https://www.youtube.com/@${cleanQ}/videos`;
    }

    let html = '';
    let res = await fetch(targetUrl, { headers: fetchHeaders, cache: 'no-store' });

    if (res.ok) {
      html = await res.text();
    } else {
      // Try root channel URL
      const rootUrl = targetUrl.replace(/\/videos$/, '');
      const rootRes = await fetch(rootUrl, { headers: fetchHeaders, cache: 'no-store' });
      if (rootRes.ok) {
        html = await rootRes.text();
      } else {
        // Fallback to searching YouTube for channel
        const searchRes = await fetch(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(matchedInitial?.title || query)}&sp=EgIQAg%253D%253D`,
          { headers: fetchHeaders, cache: 'no-store' }
        );
        if (searchRes.ok) {
          const searchHtml = await searchRes.text();
          const channelHandleMatch = searchHtml.match(/\/@([a-zA-Z0-9_\-\.]+)/);
          if (channelHandleMatch) {
            targetHandle = `@${channelHandleMatch[1]}`;
            const directRes = await fetch(`https://www.youtube.com/@${channelHandleMatch[1]}/videos`, {
              headers: fetchHeaders,
              cache: 'no-store',
            });
            if (directRes.ok) html = await directRes.text();
          }
        }
      }
    }

    // Extract ytInitialData
    let ytData: any = null;
    if (html) {
      const jsonMatch =
        html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) ||
        html.match(/ytInitialData = ({[\s\S]*?});/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          ytData = JSON.parse(jsonMatch[1]);
        } catch {
          // JSON parsing failed
        }
      }
    }

    // 1. Extract Profile Header Info
    const header = ytData?.header || {};
    const pageHeaderVM = header?.pageHeaderRenderer?.content?.pageHeaderViewModel;
    const c4Header = header?.c4TabbedHeaderRenderer;

    // Avatar
    let avatar = matchedInitial?.avatar || '';
    const metaAvatarThumbnails = ytData?.metadata?.channelMetadataRenderer?.avatar?.thumbnails;
    if (Array.isArray(metaAvatarThumbnails) && metaAvatarThumbnails.length > 0) {
      avatar = metaAvatarThumbnails[metaAvatarThumbnails.length - 1]?.url || avatar;
    }
    if (!avatar) {
      const avatarSources =
        pageHeaderVM?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources ||
        c4Header?.avatar?.thumbnails;
      if (Array.isArray(avatarSources) && avatarSources.length > 0) {
        avatar = avatarSources[avatarSources.length - 1]?.url || avatar;
      }
    }
    if (avatar && avatar.includes('=s')) {
      avatar = avatar.replace(/=s\d+[^"]*/, '=s900-c-k-c0x00ffffff-no-rj');
    }

    // Banner
    let banner = matchedInitial?.banner || '';
    const bannerSources =
      pageHeaderVM?.banner?.imageBannerViewModel?.image?.sources ||
      c4Header?.banner?.thumbnails ||
      c4Header?.tvBanner?.thumbnails ||
      c4Header?.mobileBanner?.thumbnails;
    if (Array.isArray(bannerSources) && bannerSources.length > 0) {
      banner = bannerSources[bannerSources.length - 1]?.url || banner;
    }
    if (banner && (banner.includes('=w') || banner.includes('=s'))) {
      banner = banner.replace(/=w\d+[^"]*/, '=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj');
    }

    // Title
    const title =
      pageHeaderVM?.title?.dynamicTextViewModel?.text?.content ||
      c4Header?.title ||
      matchedInitial?.title ||
      query.replace(/^@/, '').replace(/^c-/, '');

    // Handle
    let handle =
      pageHeaderVM?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts?.[0]?.text?.content ||
      matchedInitial?.handle ||
      (targetHandle.startsWith('@') ? targetHandle : `@${title.replace(/\s+/g, '')}`);
    if (!handle.startsWith('@')) handle = `@${handle}`;

    // Subscribers & Videos count
    const subText =
      pageHeaderVM?.metadata?.contentMetadataViewModel?.metadataRows?.[1]?.metadataParts?.[0]?.text?.content ||
      c4Header?.subscriberCountText?.simpleText ||
      matchedInitial?.subscribers ||
      '1.2M';

    const videoCountText =
      pageHeaderVM?.metadata?.contentMetadataViewModel?.metadataRows?.[1]?.metadataParts?.[1]?.text?.content ||
      c4Header?.videosCountText?.runs?.[0]?.text ||
      (matchedInitial?.videosCount ? `${matchedInitial.videosCount} videos` : '150 videos');

    const cleanVideosCount =
      parseInt(String(videoCountText).replace(/[^0-9]/g, ''), 10) ||
      matchedInitial?.videosCount ||
      120;

    const description =
      pageHeaderVM?.description?.descriptionPreviewViewModel?.description?.content ||
      ytData?.metadata?.channelMetadataRenderer?.description ||
      matchedInitial?.description ||
      `Official channel for ${title}. Explore high quality videos, tutorials, and exclusive content.`;

    const channelId =
      matchedInitial?.id ||
      ytData?.metadata?.channelMetadataRenderer?.externalId ||
      `c-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    const channel: Channel = {
      id: channelId,
      title,
      avatar:
        avatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title)}&backgroundColor=e11d48,2563eb`,
      banner:
        banner ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=2560&auto=format&fit=crop&q=80',
      handle,
      subscribers: subText.replace(/subscribers?/i, '').trim() || '1.2M',
      verified: matchedInitial ? matchedInitial.verified : true,
      videosCount: cleanVideosCount,
      description,
      joinedDate: matchedInitial?.joinedDate || 'Joined YouTube',
      viewsCount: matchedInitial?.viewsCount || 'Millions of views',
      links: matchedInitial?.links || [
        { title: 'Official Website', url: 'https://youtube.com' },
      ],
    };

    // 2. Extract Videos, Shorts, Playlists from Scraped Data
    let { videos, shorts, playlists } = extractChannelContents(ytData, channel);

    // 3. Fallback / Supplemental Search with youtube-sr if scraped videos are sparse
    if (videos.length < 6) {
      try {
        const searchQuery = `${channel.title} ${channel.handle || ''}`.trim();
        const searchResults = await YouTube.search(searchQuery, {
          limit: 18,
          type: 'video',
          safeSearch: false,
        });

        const supplementalVideos: Video[] = (searchResults || [])
          .filter((v) => v.id && !videos.some((ex) => ex.youtubeId === v.id))
          .map((v) => {
            const isMatchAuthor =
              !v.channel?.name ||
              v.channel.name.toLowerCase().includes(channel.title.toLowerCase()) ||
              channel.title.toLowerCase().includes(v.channel.name.toLowerCase());

            return {
              id: `yt-${v.id}`,
              youtubeId: v.id!,
              title: v.title || 'Channel Video',
              description: v.description || `Watch "${v.title}" from ${channel.title}.`,
              channelTitle: isMatchAuthor ? channel.title : v.channel?.name || channel.title,
              channelId: channel.id,
              channelAvatar: channel.avatar,
              subscriberCount: channel.subscribers,
              verified: channel.verified,
              thumbnailUrl: v.thumbnail?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
              views: v.views || 45000,
              likes: Math.round((v.views || 45000) * 0.05) || 1200,
              dislikes: 12,
              uploadedAt: v.uploadedAt || 'Recent',
              duration: v.durationFormatted || '10:00',
              category: 'All',
              tags: [channel.title, 'Video'],
              commentsCount: Math.round((v.views || 45000) * 0.01) || 45,
            };
          });

        videos = [...videos, ...supplementalVideos];
      } catch (err) {
        console.error('youtube-sr channel search fallback notice:', err);
      }
    }

    // Guarantee all videos have this channel's metadata
    const finalVideos = videos.map((v) => ({
      ...v,
      channelTitle: channel.title,
      channelId: channel.id,
      channelAvatar: channel.avatar,
      subscriberCount: channel.subscribers,
      verified: channel.verified,
    }));

    return NextResponse.json({
      channel,
      videos: finalVideos,
      shorts,
      playlists,
    });
  } catch (error: any) {
    console.error('Channel route error:', error);

    // If fetch fails completely, return fallback from initial channels if found
    if (matchedInitial) {
      return NextResponse.json({
        channel: matchedInitial,
        videos: [],
        shorts: [],
        playlists: [],
      });
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to fetch channel' },
      { status: 500 }
    );
  }
}
