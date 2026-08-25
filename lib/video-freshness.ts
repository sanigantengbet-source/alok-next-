/**
 * Freshness & Viral Quality Filter for Videos
 * Enforces fresh content focusing on recent videos (~1 week ago to ~1 month ago)
 * and strictly eliminates older stale content (months/years old).
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

  // 2. Reject videos with explicit old year markers in the title (e.g., 2016-2023)
  if (/\b(201[0-9]|202[0-3])\b/.test(title)) {
    return false;
  }

  // 3. Reject videos older than 1 month (> 1 month / > 1 bulan lalu)
  const monthsMatch = uploaded.match(/(\d+)\s*(?:months?|bulan|bln|mo)\s*(?:ago|lalu)/i);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1], 10);
    // Allow up to 1 month (1 month ago), reject 2+ months ago
    if (months > 1) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a video falls nicely within the 1 week to 1 month timeframe
 */
export function isWithinTargetFreshnessWindow(uploadedAt?: string): boolean {
  if (!uploadedAt) return true;
  const text = uploadedAt.toLowerCase().trim();

  // Matches 1-4 weeks, 1 month, or recent days
  if (
    /(\d+)\s*(?:weeks?|minggu|wks?|w)\s*(?:ago|lalu)?/i.test(text) ||
    /(?:1|satu)\s*(?:month|bulan|mo)\s*(?:ago|lalu)?/i.test(text) ||
    /(\d+)\s*(?:days?|hari|d)\s*(?:ago|lalu)?/i.test(text) ||
    /kemarin|yesterday|today|hari ini|recently|terbaru/i.test(text)
  ) {
    return true;
  }

  return isFreshAndHotVideo({ uploadedAt });
}

/**
 * Filter an array of videos to keep only fresh & active videos,
 * prioritizing 1 week - 1 month content and eliminating stale content.
 */
export function filterFreshVideos<T extends { title?: string; uploadedAt?: string; views?: number; description?: string }>(
  videos: T[]
): T[] {
  if (!Array.isArray(videos)) return [];
  return videos.filter((v) => isFreshAndHotVideo(v));
}

