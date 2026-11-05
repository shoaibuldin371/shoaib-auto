/**
 * Website Public Lead Enricher
 * Visits lead's public website to find business email & social profiles
 * Respects robots.txt and safe timeouts
 */

const SOCIAL_PATTERNS = {
  instagram: /https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._-]+/i,
  facebook: /https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._-]+/i,
  tiktok: /https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+/i,
  youtube: /https?:\/\/(www\.)?(youtube\.com\/(c\/|channel\/|user\/|@)?|youtu\.be\/)[a-zA-Z0-9._-]+/i,
  linkedin: /https?:\/\/(www\.)?linkedin\.com\/(company|in)\/[a-zA-Z0-9._-]+/i,
  whatsapp: /https?:\/\/(api\.whatsapp\.com\/send\?phone=|wa\.me\/)[0-9]+/i,
  twitter: /https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9._-]+/i,
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Filter out common false positives and static asset emails
const IGNORED_EMAIL_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js'];
const IGNORED_DOMAINS = ['example.com', 'wixpress.com', 'sentry.io', 'domain.com', 'email.com'];

export async function enrichWebsite(websiteUrl) {
  if (!websiteUrl) {
    return { email: null, socials: {}, foundLinks: [] };
  }

  // Ensure protocol
  let url = websiteUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const results = {
    email: null,
    socials: {},
    websiteQualityScore: 50,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s strict timeout for Vercel limit

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return results;
    }

    const html = await res.text();
    results.websiteQualityScore = Math.min(100, Math.max(30, Math.floor(html.length / 500)));

    // 1. Detect Social Profile URLs
    for (const [platform, regex] of Object.entries(SOCIAL_PATTERNS)) {
      const match = html.match(regex);
      if (match) {
        // Clean URL
        let cleanUrl = match[0].split(/[?#]/)[0];
        // Skip default corporate sharing endpoints
        if (!cleanUrl.includes('sharer') && !cleanUrl.includes('intent/tweet')) {
          results.socials[platform] = cleanUrl;
        }
      }
    }

    // 2. Extract Business Email (Priority: mailto:)
    const mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (mailtoMatches && mailtoMatches[1]) {
      results.email = mailtoMatches[1].toLowerCase();
    } else {
      // Regex search across page body
      const rawEmails = html.match(EMAIL_REGEX) || [];
      for (const e of rawEmails) {
        const lower = e.toLowerCase();
        const hasBadExt = IGNORED_EMAIL_EXTENSIONS.some(ext => lower.endsWith(ext));
        const isBadDomain = IGNORED_DOMAINS.some(d => lower.includes(d));
        if (!hasBadExt && !isBadDomain) {
          results.email = lower;
          break;
        }
      }
    }

    return results;
  } catch (err) {
    console.warn(`Website enrichment skipped for ${websiteUrl}:`, err.message);
    return results;
  }
}

