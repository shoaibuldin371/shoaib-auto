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

  // 2. No links or domains
  const linkRegex = /(https?:\/\/|www\.|\.(com|pk|org|net|io|co|me|ai|app|dev)\b)/i;
  if (linkRegex.test(cleaned)) {
    return { valid: false, hook: genericHook, reason: 'Contains web link or domain' };
  }

  // 3. No prices or currency symbols
  const priceRegex = /(\$|\bpkr\b|\brs\b|\brs\.|\beuros?\b|\bdollars?\b|\bpricing\b|\brates?\b|\bcost\b|\bfee\b)/i;
  if (priceRegex.test(cleaned)) {
    return { valid: false, hook: genericHook, reason: 'Contains pricing or currency' };
  }

  // 4. No numbers, metrics, ROI or client result claims (e.g. 100k, 10x, 50%, 5 clients)
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
 * Only evaluates after at least 20 sent emails!
 * Auto-pauses if bounce rate > 5% (more than 1 bounce in 20).
 */
export function evaluateBounceSafety(recentLogs = []) {
  if (!Array.isArray(recentLogs) || recentLogs.length < 20) {
    return {
      shouldPause: false,
      bounceRate: 0,
      count: recentLogs ? recentLogs.length : 0,
      bounces: 0,
      bouncedEmails: [],
      reason: null,
    };
  }

  const last20 = recentLogs.slice(0, 20);
  const bouncedLogs = last20.filter(log => log.status === 'bounced' || log.bounced);
  const bounces = bouncedLogs.length;
  const bounceRate = bounces / last20.length;
  const bouncedEmails = bouncedLogs.map(l => l.recipient || l.email).filter(Boolean);

  return {
    shouldPause: bounceRate > 0.05,
    bounceRate: Math.round(bounceRate * 100),
    bounces,
    total: last20.length,
    bouncedEmails,
    reason: bounceRate > 0.05
      ? `Bounce rate reached ${Math.round(bounceRate * 100)}% over last ${last20.length} emails (threshold: 5%). Bounced addresses: ${bouncedEmails.join(', ')}`
      : null,
  };
}

/**
 * Checks service requirements before sending.
 * Returns ready: false and specific warnings if required settings fields are empty.
 */
export function checkServiceRequirements(serviceSlug, settings = {}, region = 'pakistan') {
  const warnings = [];

  if (serviceSlug === 'social-media') {
    if (!settings.facebook_url || !settings.facebook_url.trim()) {
      warnings.push('Social Media campaign blocked: facebook_url is required in Settings.');
    }
  } else if (serviceSlug === 'video-editing') {
    if (!settings.video_portfolio_url || !settings.video_portfolio_url.trim()) {
      warnings.push('Video Editing campaign blocked: video_portfolio_url is required in Settings.');
    }
  } else if (serviceSlug === 'ai-video') {
    if (!settings.ai_video_portfolio_url || !settings.ai_video_portfolio_url.trim()) {
      warnings.push('AI Video campaign blocked: ai_video_portfolio_url is required in Settings.');
    }
  } else if (serviceSlug === 'product-manager') {
    if (!settings.pm_case_study_url || !settings.pm_case_study_url.trim()) {
      warnings.push('Product Management campaign blocked: pm_case_study_url is required in Settings.');
    }
  }

  if (region === 'worldwide') {
    const booking = settings.calendly_link || settings.booking_link;
    if (!booking || !booking.trim()) {
      warnings.push('Worldwide campaign blocked: calendly_link is required in Settings.');
    }
  }

  return {
    ready: warnings.length === 0,
    warnings,
  };
}

/**
 * Composes a plain-text email (<120 words, 1 CTA, opt-out line, no tracking in Step 0).
 */
export function composeEmail({
  step = 0,
  lead,
  service,
  settings,
  region = 'pakistan',
}) {
  const firstName = lead.first_name || (lead.contact_name ? lead.contact_name.split(' ')[0] : 'there');
  const businessName = lead.business_name || 'your business';
  const city = lead.city || 'Islamabad';
  const slug = service?.slug || lead.service_id || 'social-media';
  const exp = service?.experience_text || 'several months';

  const validatedHook = validateAiHook(lead.personal_hook, businessName);
  const hook = validatedHook.hook;

  let subject = '';
  let bodyLines = [];

  // Plain portfolio URL for initial email (NO tracking redirect link in Step 0)
  let portfolioUrl = '';
  if (slug === 'video-editing') portfolioUrl = settings.video_portfolio_url || 'https://video-portfolio-572m.vercel.app/';
  else if (slug === 'ai-video') portfolioUrl = settings.ai_video_portfolio_url || 'https://video-portfolio-572m.vercel.app/';
  else if (slug === 'product-manager') portfolioUrl = settings.pm_case_study_url || 'https://github.com/shoaib';
  else portfolioUrl = settings.facebook_url || settings.tiktok_url || 'https://www.tiktok.com/@syed_ali_azzam';

  const optOutLine = "P.S. If you'd rather not hear from me, just reply stop and I won't reach out again.";

  if (step === 0) {
    if (slug === 'social-media') {
      subject = `Quick idea for ${businessName}'s social media in ${city}`;
      bodyLines = [
        `Hi ${firstName},`,
        '',
        hook,
        '',
        `Here is some social media content I have worked on: ${portfolioUrl}`,
        '',
        `Would you be open to me sending 2 custom content concepts for ${businessName} over WhatsApp?`,
        '',
        `Best regards,`,
        `Shoaib ul Din`,
        `03473547036`,
        '',
        optOutLine,
      ];
    } else if (slug === 'video-editing') {
      subject = `Video editing samples for ${businessName}`;
      bodyLines = [
        `Hi ${firstName},`,
        '',
        hook,
        '',
        `I focus on high-retention short-form video editing. My portfolio: ${portfolioUrl}`,
        '',
        `I would love to edit 1 free sample clip from your raw footage so you can review the turnaround. Free to connect on WhatsApp?`,
        '',
        `Regards,`,
        `Shoaib ul Din`,
        `03473547036`,
        '',
        optOutLine,
      ];
    } else if (slug === 'ai-video') {
      subject = `AI video promo for ${businessName}`;
      bodyLines = [
        `Hi ${firstName},`,
        '',
        hook,
        '',
        `I create AI-assisted promotional videos and explainers. Examples: ${portfolioUrl}`,
        '',
        `Can I send you a 15-second custom AI video mockup for ${businessName}?`,
        '',
        `Best regards,`,
        `Shoaib ul Din`,
        `03473547036`,
        '',
        optOutLine,
      ];
    } else {
      // product-manager
      subject = `Sprint coordination support for ${businessName}`;
      bodyLines = [
        `Hi ${firstName},`,
        '',
        hook,
        '',
        `I help engineering teams streamline sprint delivery, write PRDs, and groom backlogs. Work samples: ${portfolioUrl}`,
        '',
        `Open to a brief chat to see if extra product bandwidth could help your team this quarter?`,
        '',
        `Best regards,`,
        `Shoaib ul Din`,
        `03473547036`,
        '',
        optOutLine,
      ];
    }
  } else if (step === 1) {
    // Follow-up 1 (Day 3)
    subject = `Re: Quick idea for ${businessName}`;
    bodyLines = [
      `Hi ${firstName},`,
      '',
      `Following up on my note from earlier. Here is a quick sample link: ${portfolioUrl}`,
      '',
      `Let me know if you would like me to prepare a free concept for ${businessName} this week!`,
      '',
      `Shoaib | 03473547036`,
      '',
      optOutLine,
    ];
  } else {
    // Follow-up 2 (Day 7)
    subject = `Re: Quick idea for ${businessName}`;
    bodyLines = [
      `Hi ${firstName},`,
      '',
      `I won't crowd your inbox further. If you ever want to revamp your content or workflows, feel free to text me on WhatsApp anytime: https://wa.me/923473547036`,
      '',
      `All the best,`,
      `Shoaib ul Din`,
      '',
      optOutLine,
    ];
  }

  const text = bodyLines.join('\n');
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    subject,
    text,
    wordCount,
    isUnder120Words: wordCount <= 120,
    portfolioUrl,
  };
}
