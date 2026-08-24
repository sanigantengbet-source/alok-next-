/**
 * Freshness & Viral Quality Filter for Videos
 * Excludes stale videos (1-5+ years old) and prioritizes fresh, high-velocity trending content
 */

export function isFreshAndHotVideo(item: {
  title?: string;
  uploadedAt?: string;
  views?: number;
  description?: string;
}): boolean {
  if (!item) return false;

  const title = (item.title || '').toLowerCase();
  const uploaded = (item.uploadedAt || '').toLowerCase().trim();

  // 1. Strict rejection of any video indicating years of age (1 - 10+ years ago / tahun lalu)
  const oldYearPatterns = [
    /\b(\d+)\s*(?:years?|yrs?)\s*ago\b/i,
    /\b(\d+)\s*(?:tahun|thn|th)\s*(?:yang\s*)?lalu\b/i,
    /\b(\d+)\s*y\s*ago\b/i,
    /year\s*ago/i,
    /tahun\s*(?:yang\s*)?lalu/i,
  ];

  for (const pattern of oldYearPatterns) {
    if (pattern.test(uploaded)) {
      return false;
    }
  }

  // 2. Reject videos with explicit old year markers in the title (e.g., 2016, 2017, 2018, 2019, 2020, 2021, 2022)
  if (/\b(201[0-9]|202[0-3])\b/.test(title)) {
    return false;
  }

  // 3. Reject old months (e.g. > 5 months ago) if specified
  const monthsMatch = uploaded.match(/(\d+)\s*(?:months?|bulan|bln)\s*(?:ago|lalu)/i);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1], 10);
    if (months > 4) {
      return false;
    }
  }

  return true;
}

/**
 * Filter an array of videos to keep only fresh & active videos,
 * preserving viral/trending velocity and eliminating 1-5 year old stale content.
 */
export function filterFreshVideos<T extends { title?: string; uploadedAt?: string; views?: number }>(
  videos: T[]
): T[] {
  if (!Array.isArray(videos)) return [];
  return videos.filter((v) => isFreshAndHotVideo(v));
}
