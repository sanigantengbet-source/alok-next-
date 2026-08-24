import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoID') || searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoID parameter', titles: [], thumbnails: [] }, { status: 400 });
  }

  // Clean video ID
  const cleanId = videoId.replace(/^yt-/, '').trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(`https://sponsor.ajay.app/api/branding?videoID=${encodeURIComponent(cleanId)}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NextTube/2.5.0 (DeArrow-Client)',
      },
      next: { revalidate: 300 }, // Cache on server for 5 minutes
    });

    clearTimeout(timeoutId);

    if (res.status === 404) {
      return NextResponse.json({ titles: [], thumbnails: [], randomTime: null, videoDuration: null }, { status: 200 });
    }

    if (!res.ok) {
      return NextResponse.json(
        { titles: [], thumbnails: [], error: `DeArrow upstream returned status ${res.status}` },
        { status: 200 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { titles: [], thumbnails: [], error: 'Failed to contact DeArrow API' },
      { status: 200 }
    );
  }
}
