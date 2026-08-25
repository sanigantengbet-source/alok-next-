import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { parseYouTubeViews } from '@/lib/youtube-views';
import { isFreshAndHotVideo } from '@/lib/video-freshness';

// Diverse topic pools for dynamic and ever-fresh YouTube Home Feed recommendations
const MASTER_TOPIC_POOLS: Record<string, string[]> = {
  Viral: [
    'video viral indonesia terbaru minggu ini',
    'berita viral dan trending terkini indonesia',
    'kejadian unik viral media sosial indonesia',
    'top trending youtube indonesia hari ini',
    'momen heboh paling rame dibahas netizen',
    'fenomena viral terbaru tiktok youtube',
  ],
  Music: [
    'lagu hits viral tiktok indonesia 2026',
    'top hits music indonesia viral terbaru',
    'lagu pop akustik santai indonesia playlist',
    'lagu galau akustik trending 2026',
    'cover lagu merdu viral indonesia terbaru',
    'official music video indonesia trending',
  ],
  Gaming: [
    'windah basudara game seru terbaru',
    'gameplay seru streamer gamer indonesia',
    'momen lucu kocak gaming streamer indonesia',
    'game horror viral streamer indonesia',
    'highlight turnamen mobile legends valorant indonesia',
    'gameplay game baru grafis memukau',
  ],
  Tech: [
    'review gadget smartphone terbaru gadgetin',
    'gadget review teknologi terbaru indonesia',
    'smartphone flagship review unboxing 2026',
    'tips rahasia gadget canggih bermanfaat',
    'setup ruang kerja idaman dan gadget unik',
    'unboxing teknologi futuristik tercanggih',
  ],
  Podcasts: [
    'podcast seru viral indonesia bintang tamu heboh',
    'vindes podcast obrolan seru terbaru',
    'podcast inspiratif cerita pengalaman hidup',
    'podcast komedi obrolan kocak santai',
    'podcast misteri horor kisah nyata viral',
    'curhat obrolan mendalam podcast trending',
  ],
  Entertainment: [
    'reaksi lucu video trending bikin ngakak',
    'trailer film bioskop indonesia review terbaru',
    'short movie seru indonesia viral karya kreator',
    'sketsa komedi video viral indonesia',
    'stand up comedy indonesia terlucu',
    'eksperimen seru dan kreasi unik memukau',
  ],
  Food: [
    'kuliner viral street food indonesia tanboy kun',
    'resep masak praktis viral tiktok enak',
    'review makanan viral paling enak nex carlos',
    'kuliner malam legendaris bikin ngiler',
  ],
  Travel: [
    'vlog petualangan hidden gem wisata indonesia',
    'vlog liburan jalan jalan seru kuliner daerah',
    'keindahan alam indonesia cinematic 4k vlog',
  ],
};

function getRandomQueries(explicitCategory?: string, page: number = 1): { category: string; query: string }[] {
  if (explicitCategory && explicitCategory.toLowerCase() !== 'all') {
    const catPool = MASTER_TOPIC_POOLS[explicitCategory] || [];
    if (catPool.length > 0) {
      // Pick 3-4 shuffled queries from category pool
      const shuffled = [...catPool].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 4).map((q) => ({ category: explicitCategory, query: q }));
    }
    return [
      { category: explicitCategory, query: `${explicitCategory} viral indonesia terbaru 2026` },
      { category: explicitCategory, query: `${explicitCategory} trending populer minggu ini` },
      { category: explicitCategory, query: `${explicitCategory} terbaik dan paling rame` },
    ];
  }

  // For 'All' feed: pick 1-2 random queries from each distinct category to create high variety
  const queries: { category: string; query: string }[] = [];
  const categories = Object.keys(MASTER_TOPIC_POOLS);
  // Shuffle category order
  const shuffledCats = [...categories].sort(() => 0.5 - Math.random());

  for (const cat of shuffledCats) {
    const pool = MASTER_TOPIC_POOLS[cat];
    const randomIndex = Math.floor(Math.random() * pool.length);
    queries.push({ category: cat, query: pool[randomIndex] });
  }

  // Randomize query order so different category types appear in different order
  return queries.sort(() => 0.5 - Math.random());
}

// Helper to scrape HTML for fast results
async function searchHtmlScraper(query: string, category: string, limit = 8): Promise<any[]> {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=CAI%253D`; // sp=CAI%3D sorts by upload date/relevance
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
    const items: any[] = [];
    const seen = new Set<string>();

    function extractVideo(v: any) {
      if (!v || !v.videoId || items.length >= limit) return;
      const videoId = v.videoId;
      if (seen.has(videoId)) return;
      seen.add(videoId);

      const title =
        v.title?.runs?.[0]?.text ||
        v.title?.simpleText ||
        '';
      if (!title || title.length < 3) return;

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
        '1 minggu yang lalu';

      const duration =
        v.lengthText?.simpleText ||
        (Array.isArray(v.lengthText?.runs) ? v.lengthText.runs.map((r: any) => r.text).join('') : '') ||
        '10:00';

      const thumb =
        v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const numericViews = parseYouTubeViews(v.viewCountText, v.shortViewCountText, 250000);

      const item = {
        id: `yt-${videoId}`,
        youtubeId: videoId,
        title,
        description:
          v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') ||
          `Rekomendasi video "${title}" di NextTube.`,
        channelTitle,
        channelId,
        channelAvatar:
          v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url ||
          `https://picsum.photos/seed/${encodeURIComponent(channelTitle)}/100/100`,
        subscriberCount: '500K+',
        verified: Boolean(v.ownerBadges?.length || v.badges?.length),
        thumbnailUrl: thumb,
        views: numericViews,
        likes: Math.round(numericViews * 0.045) || 12000,
        dislikes: 10,
        uploadedAt,
        duration,
        category: category || 'Trending',
        tags: [category, channelTitle, 'Trending', 'Viral', 'Rekomendasi'],
        commentsCount: Math.round(numericViews * 0.003) || 450,
      };

      if (isFreshAndHotVideo(item)) {
        items.push(item);
      }
    }

    function walk(node: any) {
      if (!node || typeof node !== 'object' || items.length >= limit) return;
      if (node.videoRenderer) {
        extractVideo(node.videoRenderer);
      }
      for (const key of Object.keys(node)) {
        walk(node[key]);
      }
    }

    walk(data);
    return items;
  } catch {
    return [];
  }
}

// In-memory short cache to prevent redundant simultaneous requests while keeping feed fresh
const homeCache = new Map<string, { timestamp: number; videos: any[] }>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const explicitCategory = searchParams.get('category') || '';
  const dateParam = searchParams.get('date') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const refreshParam = searchParams.get('refresh') === 'true';

  const now = new Date();
  const todayKey = dateParam || `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

  const cacheKey = `cat_${explicitCategory || 'all'}_page_${pageParam}`;
  const cached = homeCache.get(cacheKey);

  // Return cached result if valid (cached for 2 minutes only, or bypass if refresh requested)
  if (!refreshParam && cached && Date.now() - cached.timestamp < 2 * 60 * 1000 && cached.videos.length >= 12) {
    // Shuffle the cached list slightly on each serve so order feels organic
    const randomized = [...cached.videos].sort(() => 0.5 - Math.random());
    return NextResponse.json({
      results: randomized,
      count: randomized.length,
      page: pageParam,
      source: 'memory-cache',
      dayKey: todayKey,
    });
  }

  try {
    const activeQueries = getRandomQueries(explicitCategory, pageParam);

    // Parallel fetch from all topic queries to construct a 40-60+ video recommendations feed
    const queryPromises = activeQueries.map(async ({ category, query }) => {
      // 1. First try fast HTML scraper
      const scraped = await searchHtmlScraper(query, category, 8);
      if (scraped.length >= 4) {
        return scraped;
      }

      // 2. Supplement or fallback with youtube-sr
      try {
        const srList = await YouTube.search(query, {
          limit: 10,
          type: 'video',
          safeSearch: false,
        });

        const formatted = (srList || [])
          .filter((item) => item && item.id && item.title)
          .map((item) => {
            const videoId = item.id!;
            const thumb =
              item.thumbnail?.url ||
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            const uploaded = item.uploadedAt || '1 minggu yang lalu';
            const views = typeof item.views === 'number' ? item.views : 350000;

            return {
              id: `yt-${videoId}`,
              youtubeId: videoId,
              title: item.title || 'YouTube Video',
              description: item.description || `Tonton "${item.title}" oleh ${item.channel?.name || 'Kreator'}.`,
              channelTitle: item.channel?.name || 'YouTube Creator',
              channelId: item.channel?.id || `c-${videoId}`,
              channelAvatar:
                item.channel?.icon?.url ||
                `https://picsum.photos/seed/${encodeURIComponent(item.channel?.name || videoId)}/100/100`,
              subscriberCount: item.channel?.subscribers || '1M+',
              verified: Boolean(item.channel?.verified),
              thumbnailUrl: thumb,
              views: views,
              likes: Math.round(views * 0.045) || 12000,
              dislikes: 12,
              uploadedAt: uploaded,
              duration: item.durationFormatted || '10:00',
              category: category || 'Trending',
              tags: [category, item.channel?.name || 'Kreator', 'Trending', 'Viral', 'YouTube'],
              commentsCount: Math.round(views * 0.003) || 450,
            };
          })
          .filter(isFreshAndHotVideo);

        const combined = [...scraped];
        const seen = new Set(combined.map((v) => v.id));
        for (const v of formatted) {
          if (!seen.has(v.id)) {
            seen.add(v.id);
            combined.push(v);
          }
        }
        return combined;
      } catch (err) {
        console.warn(`Error querying topic "${query}":`, err);
        return scraped;
      }
    });

    const resultsByTopic = await Promise.all(queryPromises);

    // Interleave topic results evenly to create a rich, diverse, magazine-style YouTube Home Feed
    const interleaved: any[] = [];
    const seenIds = new Set<string>();
    let maxLen = 0;
    for (const list of resultsByTopic) {
      if (list.length > maxLen) maxLen = list.length;
    }

    for (let i = 0; i < maxLen; i++) {
      for (const topicList of resultsByTopic) {
        if (topicList[i]) {
          const video = topicList[i];
          if (!seenIds.has(video.id)) {
            seenIds.add(video.id);
            interleaved.push(video);
          }
        }
      }
    }

    // If still sparse, add general trending fallback
    if (interleaved.length < 15) {
      try {
        const extraSr = await YouTube.search('trending viral indonesia terkini', { limit: 25, type: 'video' });
        for (const item of extraSr) {
          if (!item || !item.id) continue;
          const id = `yt-${item.id}`;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            interleaved.push({
              id,
              youtubeId: item.id,
              title: item.title || 'Trending Video',
              description: item.description || 'Rekomendasi video viral di NextTube',
              channelTitle: item.channel?.name || 'YouTube Creator',
              channelId: item.channel?.id || `c-${item.id}`,
              channelAvatar: item.channel?.icon?.url || `https://picsum.photos/seed/${encodeURIComponent(item.channel?.name || item.id)}/100/100`,
              subscriberCount: item.channel?.subscribers || '500K+',
              verified: Boolean(item.channel?.verified),
              thumbnailUrl: item.thumbnail?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
              views: typeof item.views === 'number' ? item.views : 250000,
              likes: Math.round((item.views || 250000) * 0.04) || 8000,
              dislikes: 15,
              uploadedAt: item.uploadedAt || '2 minggu yang lalu',
              duration: item.durationFormatted || '12:00',
              category: 'Trending',
              tags: ['Trending', 'Viral', 'YouTube'],
              commentsCount: 320,
            });
          }
        }
      } catch (err) {
        console.warn('Fallback trending query notice:', err);
      }
    }

    if (interleaved.length > 0) {
      homeCache.set(cacheKey, {
        timestamp: Date.now(),
        videos: interleaved,
      });
    }

    return NextResponse.json({
      results: interleaved,
      count: interleaved.length,
      page: pageParam,
      dayKey: todayKey,
      source: 'live-multi-category-engine',
    });
  } catch (error) {
    console.error('Fatal trending fetch error:', error);
    return NextResponse.json({
      results: [],
      count: 0,
      error: 'Failed to generate recommendations',
    });
  }
}
