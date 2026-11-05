/**
 * Safety Guardrails for Autonomous Cold Outreach
 */

const FREEMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'live.com',
  'mail.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'yandex.com',
  'zoho.com',
]);

/**
 * Validates the AI-generated opening line (personal_hook):
 * - Max 25 words
 * - No links (http, https, www, .com, etc.)
 * - No prices ($, PKR, Rs, dollar, etc.)
 * - No numbers or claims about results/clients (100k, 10x, 500%, clients)
 * - No experience claims (3 years, 4 months, etc.)
 * 
 * If it fails any check, returns valid: false and provides the safe generic line.
 */
export function validateAiHook(hookText, businessName = 'your business') {
  const genericHook = `I came across ${businessName} and was really impressed by your work and reputation.`;

  if (!hookText || typeof hookText !== 'string') {
    return { valid: false, hook: genericHook, reason: 'Empty hook' };
  }

  const cleaned = hookText.trim().replace(/^["']|["']$/g, '');
  const words = cleaned.split(/\s+/).filter(Boolean);

  // 1. Max 25 words
  if (words.length > 25) {
    return { valid: false, hook: genericHook, reason: `Exceeds 25 words (${words.length} words)` };
  }

  // 2. No links
  const linkRegex = /(https?:\/\/|www\.|\.(com|pk|org|net|io|co|me|ai)\b)/i;
  if (linkRegex.test(cleaned)) {
    return { valid: false, hook: genericHook, reason: 'Contains web link or domain' };
  }

  // 3. No prices or currency symbols
  const priceRegex = /(\$|\bpkr\b|\brs\b|\brs\.|\beuros?\b|\bdollars?\b|\bpricing\b|\brates?\b|\bcost\b)/i;
  if (priceRegex.test(cleaned)) {
    return { valid: false, hook: genericHook, reason: 'Contains pricing or currency' };
  }

  // 4. No numbers, ROI or client result claims (e.g. 100k, 10x, 50%, 5 clients)
  const resultsRegex = /(\b\d+([kKmM%]|x|X)?\b|\bresults?\b|\bguarantee\b|\broi\b|\bclients?\b|\bviews\b|\bscaled\b)/i;
  if (resultsRegex.test(cleaned)) {
    return { valid: false, hook: genericHook, reason: 'Contains numbers, metrics, or client result claims' };
  }

  // 5. No experience claims (e.g. 3 years, 4 months, experience)
  const expRegex = /(\b\d+\s*(years?|months?|yrs?|mos?)\b|\bexperience\b|\byears\b|\bmonths\b)/i;
  if (expRegex.test(cleaned)) {
    return { valid: false, hook: genericHook, reason: 'Contains experience claim' };
  }

  return { valid: true, hook: cleaned };
}

/**
 * Checks if the email is a valid public business domain email.
 * Skips freemail addresses (gmail, yahoo, etc.) UNLESS from CSV import.
 */
export function isAllowedBusinessEmail(email, source = 'osm_overpass') {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();

  // Basic syntax check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return false;
  }

  const domain = extractDomain(trimmed);

  // If CSV import, user explicitly provided the lead, so freemail is allowed
  if (source === 'csv_import') {
    return true;
  }

  // Otherwise, must be a real business domain (no gmail, yahoo, hotmail, etc.)
  return !FREEMAIL_DOMAINS.has(domain);
}

/**
 * Extracts lowercase domain from email
 */
export function extractDomain(email) {
  if (!email || !email.includes('@')) return '';
  return email.split('@')[1].toLowerCase().trim();
}

/**
 * Calculates recent bounce rate over the last 20 emails.
 * Auto-pauses if bounce rate > 5% (more than 1 bounce in 20).
 */
export function evaluateBounceSafety(recentLogs = []) {
  const last20 = recentLogs.slice(0, 20);
  if (last20.length < 5) {
    return { shouldPause: false, bounceRate: 0, count: last20.length };
  }

  const bounces = last20.filter(log => log.status === 'bounced' || log.bounced).length;
  const bounceRate = bounces / last20.length;

  return {
    shouldPause: bounceRate > 0.05,
    bounceRate: Math.round(bounceRate * 100),
    bounces,
    total: last20.length,
    reason: bounceRate > 0.05 ? `Bounce rate reached ${Math.round(bounceRate * 100)}% over last ${last20.length} emails (limit 5%)` : null,
  };
}
