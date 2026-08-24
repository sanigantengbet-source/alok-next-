/**
 * Helper to accurately extract and parse numerical view counts from YouTube data
 * Handles all YouTube ytInitialData formats (English, Indonesian, compact & full strings, runs, numbers)
 */

export function parseYouTubeViews(
  viewCountText: any,
  shortViewCountText?: any,
  fallbackViews: number = 0
): number {
  if (typeof viewCountText === 'number' && !isNaN(viewCountText) && viewCountText > 0) {
    return Math.round(viewCountText);
  }

  const rawTexts: string[] = [];

  const extractText = (obj: any) => {
    if (!obj) return;
    if (typeof obj === 'string') {
      rawTexts.push(obj);
    } else if (typeof obj === 'number') {
      rawTexts.push(obj.toString());
    } else if (typeof obj === 'object') {
      if (obj.simpleText) rawTexts.push(String(obj.simpleText));
      if (obj.content) rawTexts.push(String(obj.content));
      if (Array.isArray(obj.runs)) {
        const joined = obj.runs.map((r: any) => r?.text || '').join('');
        if (joined) rawTexts.push(joined);
      }
      if (obj.accessibility?.accessibilityData?.label) {
        rawTexts.push(String(obj.accessibility.accessibilityData.label));
      }
    }
  };

  extractText(viewCountText);
  extractText(shortViewCountText);

  for (const text of rawTexts) {
    if (!text || typeof text !== 'string') continue;
    const clean = text.trim();
    if (!clean) continue;

    // Check Billion / Miliar (e.g. "1.2B views", "2,5 Miliar kali ditonton", "1.4B")
    const bMatch = clean.match(/([\d.,]+)\s*(?:b|miliar|milyar|mld|billion)/i);
    if (bMatch) {
      const numStr = bMatch[1].replace(/,/g, '.');
      const num = parseFloat(numStr);
      if (!isNaN(num) && num > 0) return Math.round(num * 1000000000);
    }

    // Check Million / Juta (e.g. "4.8M views", "1,2 jt x ditonton", "12 juta tayangan", "3.5M")
    const mMatch = clean.match(/([\d.,]+)\s*(?:m|jt|juta|million)/i);
    if (mMatch) {
      const numStr = mMatch[1].replace(/,/g, '.');
      const num = parseFloat(numStr);
      if (!isNaN(num) && num > 0) return Math.round(num * 1000000);
    }

    // Check Thousand / Ribu (e.g. "450K views", "850 rb x ditonton", "25 ribu kali ditonton", "12K")
    const kMatch = clean.match(/([\d.,]+)\s*(?:k|rb|ribu|thousand)/i);
    if (kMatch) {
      const numStr = kMatch[1].replace(/,/g, '.');
      const num = parseFloat(numStr);
      if (!isNaN(num) && num > 0) return Math.round(num * 1000);
    }

    // Check full numbers formatted like "1.234.567 x ditonton", "1,234,567 views", "89,450 views"
    // Match consecutive digits with comma or dot thousand separators
    const digitMatch = clean.match(/\b(?:\d{1,3}[.,])+\d{3}\b/);
    if (digitMatch) {
      const digitsOnly = digitMatch[0].replace(/[.,]/g, '');
      const parsed = parseInt(digitsOnly, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    // Match any standard plain integer e.g. "4521 views" or "128 x ditonton"
    const plainMatch = clean.match(/\b\d+\b/);
    if (plainMatch) {
      const parsed = parseInt(plainMatch[0], 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return fallbackViews;
}

/**
 * Format views into a readable compact string (e.g. "1.4M", "850K", "12K", "520")
 */
export function formatCompactViews(views: number): string {
  if (!views || isNaN(views) || views <= 0) return '0';
  if (views >= 1000000000) {
    return (views / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(0) + 'K';
  }
  return views.toLocaleString();
}

/**
 * Format full view count with local number separators (e.g. "1.234.567" or "1,234,567")
 */
export function formatExactViews(views: number): string {
  if (!views || isNaN(views)) return '0';
  return new Intl.NumberFormat().format(views);
}
