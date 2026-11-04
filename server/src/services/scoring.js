/**
 * Lead Scoring Algorithm (0 - 100)
 * Evaluates business viability, digital presence, and conversion likelihood
 * Higher score = contacted first.
 */

export function calculateLeadScore(lead, enrichment = {}) {
  let score = 20; // Baseline initial score

  // 1. Email Availability (+25 pts)
  const hasEmail = Boolean(lead.email || enrichment.email);
  if (hasEmail) {
    score += 25;
  }

  // 2. Active Social Presence (+20 pts)
  const socials = { ...(lead.socials || {}), ...(enrichment.socials || {}) };
  const socialCount = Object.keys(socials).filter(k => Boolean(socials[k])).length;
  if (socialCount >= 3) {
    score += 20;
  } else if (socialCount >= 1) {
    score += 12;
  }

  // 3. Website Quality & Availability (+15 pts)
  if (lead.website) {
    score += 15;
  }

  // 4. Phone Contact Available (+10 pts)
  if (lead.phone) {
    score += 10;
  }

  // 5. Review Count & Reputation (+15 pts)
  const reviews = parseInt(lead.review_count || 0);
  const rating = parseFloat(lead.rating || 0);
  if (reviews > 100 && rating >= 4.0) {
    score += 15;
  } else if (reviews > 30) {
    score += 10;
  } else if (reviews > 5) {
    score += 5;
  }

  // 6. Poor or Missing Video Content Opportunity (+15 pts)
  // If the business has Instagram or TikTok but no active YouTube or portfolio, high opportunity for video editing/AI video
  const hasShortsOpportunity = (socials.instagram || socials.tiktok) && !socials.youtube;
  if (hasShortsOpportunity) {
    score += 15;
  }

  // Cap between 15 and 99
  return Math.min(99, Math.max(15, score));
}
