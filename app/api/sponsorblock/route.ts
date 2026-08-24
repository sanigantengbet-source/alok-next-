import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy for SponsorBlock API to ensure reliability and bypass any browser CORS restrictions
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoID = searchParams.get('videoID');

  if (!videoID) {
    return NextResponse.json({ error: 'videoID query parameter is required', segments: [] }, { status: 400 });
  }

  try {
    const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(videoID)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'NextTube/2.5.0 (https://nexttube.app)',
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);

    if (res.status === 404) {
      // 404 means no segments exist for this video in the database
      return NextResponse.json({ videoID, segments: [] });
    }

    if (!res.ok) {
      return NextResponse.json({ videoID, segments: [], error: `SponsorBlock HTTP ${res.status}` });
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      const formatted = data.map((item: any) => ({
        category: item.category,
        actionType: item.actionType || 'skip',
        segment: item.segment,
        UUID: item.UUID,
        videoDuration: item.videoDuration,
        votes: item.votes,
        locked: item.locked,
      }));

      return NextResponse.json({ videoID, segments: formatted });
    }

    return NextResponse.json({ videoID, segments: [] });
  } catch (error: any) {
    // Graceful error response: return empty segments without breaking video playback
    return NextResponse.json({
      videoID,
      segments: [],
      error: error?.message || 'Failed to fetch SponsorBlock segments',
    });
  }
}
