import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_CHANNELS } from '@/data/channels';

export const dynamic = 'force-dynamic';

interface ChannelInfoResponse {
  id: string;
  title: string;
  avatar: string;
  banner: string;
  handle: string;
  subscribers: string;
  verified: boolean;
  videosCount: number;
  description: string;
  joinedDate: string;
  viewsCount: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || searchParams.get('name') || searchParams.get('handle') || '').trim();

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
  }

  const cleanQuery = query.replace(/^@/, '').toLowerCase();
  const matchedInitial = INITIAL_CHANNELS.find(
    (c) =>
      c.id.toLowerCase() === query.toLowerCase() ||
      c.title.toLowerCase() === query.toLowerCase() ||
      c.title.toLowerCase() === cleanQuery ||
      (c.handle && c.handle.toLowerCase() === `@${cleanQuery}`) ||
      (c.handle && c.handle.toLowerCase() === query.toLowerCase())
  );

  try {
    // Determine the URL to fetch
    let targetUrl = '';

    if (query.startsWith('UC') && query.length === 24) {
      targetUrl = `https://www.youtube.com/channel/${query}`;
    } else if (query.startsWith('@')) {
      targetUrl = `https://www.youtube.com/@${cleanQuery}`;
    } else {
      targetUrl = `https://www.youtube.com/@${cleanQuery.replace(/\s+/g, '')}`;
    }

    const fetchHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    };

    let html = '';
    try {
      const res = await fetch(targetUrl, { headers: fetchHeaders, signal: AbortSignal.timeout(4000), cache: 'no-store' });
      if (res.ok) {
        html = await res.text();
      }
    } catch {
      // ignore
    }

    if (!html) {
      // Fallback: search YouTube for channel
      try {
        const searchRes = await fetch(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAg%253D%253D`,
          { headers: fetchHeaders, signal: AbortSignal.timeout(4000), cache: 'no-store' }
        );
        if (searchRes.ok) {
          html = await searchRes.text();
          const channelHandleMatch = html.match(/\/@([a-zA-Z0-9_\-\.]+)/);
          if (channelHandleMatch) {
            const followRes = await fetch(`https://www.youtube.com/@${channelHandleMatch[1]}`, {
              headers: fetchHeaders,
              signal: AbortSignal.timeout(4000),
              cache: 'no-store',
            });
            if (followRes.ok) {
              html = await followRes.text();
            }
          }
        }
      } catch {
        // ignore
      }
    }

    if (!html && matchedInitial) {
      return NextResponse.json({ channel: matchedInitial });
    }

    if (!html) {
      return NextResponse.json({
        channel: {
          id: `c-${query.toLowerCase().replace(/\s+/g, '-')}`,
          title: query,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(query)}&backgroundColor=e11d48,2563eb`,
          banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80',
          handle: `@${query.replace(/\s+/g, '').toLowerCase()}`,
          subscribers: '100K+',
          verified: true,
          videosCount: 50,
          description: `Official NextTube channel for ${query}.`,
          joinedDate: 'Joined YouTube',
          viewsCount: 'Millions of views',
        },
      });
    }

    // Extract ytInitialData
    const jsonMatch = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) || html.match(/ytInitialData = ({[\s\S]*?});/);
    let ytData: any = null;
    if (jsonMatch) {
      try {
        ytData = JSON.parse(jsonMatch[1]);
      } catch {
        // parsing failed
      }
    }

    const header = ytData?.header || {};
    const pageHeaderVM = header?.pageHeaderRenderer?.content?.pageHeaderViewModel;
    const c4Header = header?.c4TabbedHeaderRenderer;

    // 1. Extract Real Avatar
    let avatar = '';
    const metaAvatarThumbnails = ytData?.metadata?.channelMetadataRenderer?.avatar?.thumbnails;
    if (Array.isArray(metaAvatarThumbnails) && metaAvatarThumbnails.length > 0) {
      avatar = metaAvatarThumbnails[metaAvatarThumbnails.length - 1]?.url || '';
    }

    if (!avatar) {
      const avatarSources =
        pageHeaderVM?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources ||
        c4Header?.avatar?.thumbnails;

      if (Array.isArray(avatarSources) && avatarSources.length > 0) {
        avatar = avatarSources[avatarSources.length - 1]?.url || '';
      }
    }

    if (!avatar) {
      const avatarMatch = html.match(
        /https:\/\/yt3\.(?:googleusercontent|ggpht)\.com\/[a-zA-Z0-9_\-=]+/g
      );
      if (avatarMatch && avatarMatch.length > 0) {
        const found = avatarMatch.find(
          (u) => !u.includes('smart_app_banner') && !u.includes('default_user')
        );
        if (found) avatar = found;
      }
    }

    if (avatar && avatar.includes('=s')) {
      avatar = avatar.replace(/=s\d+[^"]*/, '=s900-c-k-c0x00ffffff-no-rj');
    }

    // If avatar extraction yielded nothing or broken, prioritize matchedInitial avatar
    if (!avatar && matchedInitial?.avatar) {
      avatar = matchedInitial.avatar;
    }

    // 2. Extract Real Banner
    let banner = '';
    const bannerSources =
      pageHeaderVM?.banner?.imageBannerViewModel?.image?.sources ||
      c4Header?.banner?.thumbnails ||
      c4Header?.tvBanner?.thumbnails ||
      c4Header?.mobileBanner?.thumbnails;

    if (Array.isArray(bannerSources) && bannerSources.length > 0) {
      banner = bannerSources[bannerSources.length - 1]?.url || '';
    }

    if (banner && (banner.includes('=w') || banner.includes('=s'))) {
      banner = banner.replace(/=w\d+[^"]*/, '=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj');
    }

    if (!banner) {
      const bannerRegex =
        /https:\/\/yt3\.(?:googleusercontent|ggpht)\.com\/[a-zA-Z0-9_\-=]+(?:=w\d+|=s\d+|fcrop64=[^"'\s,]+)*/g;
      const bMatches = html.match(bannerRegex);
      if (bMatches && bMatches.length > 0) {
        const foundBanner = bMatches.find((b) => b.includes('fcrop64') || b.includes('=w'));
        if (foundBanner) banner = foundBanner;
      }
    }

    if (!banner && matchedInitial?.banner) {
      banner = matchedInitial.banner;
    }

    // 3. Title & Handle & Metadata
    const title =
      matchedInitial?.title ||
      pageHeaderVM?.title?.dynamicTextViewModel?.text?.content ||
      c4Header?.title ||
      query.replace(/^@/, '');

    const handleText =
      pageHeaderVM?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts?.[0]?.text?.content ||
      matchedInitial?.handle ||
      `@${query.replace(/\s+/g, '')}`;

    const subText =
      pageHeaderVM?.metadata?.contentMetadataViewModel?.metadataRows?.[1]?.metadataParts?.[0]?.text?.content ||
      c4Header?.subscriberCountText?.simpleText ||
      matchedInitial?.subscribers ||
      '';

    const videoCountText =
      pageHeaderVM?.metadata?.contentMetadataViewModel?.metadataRows?.[1]?.metadataParts?.[1]?.text?.content ||
      '';

    const description =
      pageHeaderVM?.description?.descriptionPreviewViewModel?.description?.content ||
      ytData?.metadata?.channelMetadataRenderer?.description ||
      matchedInitial?.description ||
      `Official channel for ${title}.`;

    const channelResult: ChannelInfoResponse = {
      id: matchedInitial?.id || `c-${title.toLowerCase().replace(/\s+/g, '-')}`,
      title,
      avatar: avatar || matchedInitial?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title)}&backgroundColor=e11d48,2563eb`,
      banner:
        banner ||
        matchedInitial?.banner ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80',
      handle: handleText.startsWith('@') ? handleText : `@${handleText}`,
      subscribers: subText ? subText.replace(/subscribers?/i, '').trim() : (matchedInitial?.subscribers || '120K+'),
      verified: true,
      videosCount: parseInt(videoCountText.replace(/[^0-9]/g, ''), 10) || matchedInitial?.videosCount || 120,
      description,
      joinedDate: matchedInitial?.joinedDate || 'Joined YouTube',
      viewsCount: matchedInitial?.viewsCount || 'Millions of views',
    };

    return NextResponse.json({ channel: channelResult });
  } catch (error: any) {
    if (matchedInitial) {
      return NextResponse.json({ channel: matchedInitial });
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch channel' },
      { status: 500 }
    );
  }
}
