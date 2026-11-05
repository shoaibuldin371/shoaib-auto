import { validateAiHook, validateManualDm } from '../utils/guardrails.js';

/**
 * AI Provider Interface
 * Uses Google Gemini API (gemini-2.5-flash) with clean fallback and provider isolation
 */
class GeminiProvider {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  get key() {
    return process.env.GEMINI_API_KEY || this.apiKey;
  }

  async callGemini(promptText) {
    const apiKey = this.key;
    if (!apiKey) return null;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Gemini API error status:', res.status, errText);
        return null;
      }

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    } catch (err) {
      console.error('Gemini API fetch failed:', err.message);
      return null;
    }
  }

  /**
   * Generates a 1-sentence personalized opening hook
   */
  async generatePersonalHook(lead, serviceName) {
    const isPakistan = lead.scope === 'pakistan' || (lead.country || '').toLowerCase().includes('pakistan');
    const locationContext = isPakistan
      ? `Local Pakistani business in ${lead.city || 'Islamabad'}. Mention their local presence or city vibe.`
      : `International business in ${lead.city || 'global city'}, ${lead.country || 'worldwide'}. Speak with clean global freelance/agency professionalism.`;

    const prompt = `You are an expert cold outreach specialist. Write ONE concise, natural, professional opening sentence for an email to a business named "${lead.business_name}".
Context:
- Business: ${lead.business_name}
- Location: ${locationContext}
- Service pitched: ${serviceName}

RULES:
- Maximum 25 words.
- Sound like a real person, not an AI or marketer.
- Do NOT make up fake client names, case studies, or false statistics.
- Output ONLY the one sentence. No quotes, no preamble.`;

    const aiText = await this.callGemini(prompt);
    if (aiText) {
      return aiText.replace(/^["']|["']$/g, '');
    }

    return `I came across ${lead.business_name} and was really impressed by your local presence.`;
  }

  /**
   * Match lead to best fitting of the 4 services
   */
  async matchService(lead, services) {
    const serviceList = services.map(s => `${s.slug}: ${s.name} (${s.description})`).join('\n');
    const prompt = `Given this business:
Name: ${lead.business_name}
City: ${lead.city || 'Islamabad'}
Rating: ${lead.rating || 0} (${lead.review_count || 0} reviews)
Notes: ${lead.notes || 'None'}

Choose the single best matching service slug from these 4 options:
${serviceList}

Respond with ONLY the exact slug (e.g. social-media, video-editing, ai-video, product-manager).`;

    const chosen = await this.callGemini(prompt);
    if (chosen) {
      const slug = chosen.toLowerCase().trim();
      const match = services.find(s => s.slug === slug);
      if (match) return match.slug;
    }

    // Heuristic fallback
    const text = `${lead.business_name} ${lead.notes || ''}`.toLowerCase();
    if (text.includes('video') || text.includes('film') || text.includes('youtube')) return 'video-editing';
    if (text.includes('tech') || text.includes('software') || text.includes('app')) return 'product-manager';
    if (text.includes('ai') || text.includes('automation')) return 'ai-video';
    return 'social-media';
  }

  /**
   * Classifies an incoming reply
   * Options: Interested, Not interested, Question, Out of office, Unsubscribe
   */
  async classifyReply(subject, bodyText) {
    const normalized = (bodyText + ' ' + subject).toLowerCase();

    // Quick regex checks for high-certainty cases
    if (/stop|unsubscribe|remove me|opt out|do not email/i.test(normalized)) {
      return 'Unsubscribe';
    }
    if (/out of office|auto-reply|automatic reply|on vacation|away from my email/i.test(normalized)) {
      return 'Out of office';
    }

    const prompt = `Classify this email reply into exactly ONE category from:
- Interested
- Not interested
- Question
- Out of office
- Unsubscribe

Subject: ${subject}
Body:
${bodyText}

Output ONLY the category name.`;

    const result = await this.callGemini(prompt);
    if (result) {
      const validCategories = ['Interested', 'Not interested', 'Question', 'Out of office', 'Unsubscribe'];
      const match = validCategories.find(c => result.toLowerCase().includes(c.toLowerCase()));
      if (match) return match;
    }

    if (/interested|call|book|meet|schedule|sounds good|yes/i.test(normalized)) return 'Interested';
    if (/no thanks|not interested|pass|not for us/i.test(normalized)) return 'Not interested';
    return 'Question';
  }

  /**
   * Generates a platform-specific manual DM tailored for Instagram, Facebook, WhatsApp, or TikTok.
   */
  async generateManualDm(lead, platform = 'Instagram') {
    const city = lead.city || 'Islamabad';
    const businessName = lead.business_name || lead.name || 'your business';
    const industry = lead.industry || 'Local Business';

    const prompt = `Write ONE polite, concise direct message (DM) for ${platform} to ${businessName} in ${city} (${industry}).
Service offered: Short-form video editing and social media content creation.

RULES:
- Maximum 45 words.
- Natural, professional tone with polite greeting.
- Strictly use only real collected facts: business name, city, industry.
- NO links, NO prices, NO results, NO claims about past clients or views, NO experience claims.
- Ask if you can share 2 free creative concept ideas for their page.
- Return ONLY the raw DM text. No quotes.`;

    const raw = await this.callGemini(prompt);
    const { dm } = validateManualDm(raw, businessName, platform, city);
    return dm;
  }

  /**
   * Urdu-to-English reply assistant.
   * Converts Urdu notes or rough points from Shoaib into a clean, professional, concise English outreach reply.
   */
  async translateUrduReply(urduNotes, originalEmail = '') {
    const prompt = `You are an executive assistant for Shoaib ul Din, a professional video editor and digital creator based in Islamabad, Pakistan.
Shoaib received this email from a prospective client:
"${originalEmail || 'Inquiry about video editing services'}"

Shoaib wrote these rough notes/reply points in Roman Urdu or Urdu:
"${urduNotes}"

Task: Translate and refine Shoaib's rough notes into a concise, polite, professional English email response.
RULES:
- Keep it under 100 words.
- Natural, professional tone.
- Friendly, humble, and clear.
- Sign off with:
Best regards,
Shoaib ul Din
03473547036

Output ONLY the final email body.`;

    const drafted = await this.callGemini(prompt);
    if (drafted) return drafted.replace(/^["']|["']$/g, '').trim();

    return `Hi,\n\nThank you for reaching out! I would love to assist you. Let me share some custom sample concepts for your review.\n\nBest regards,\nShoaib ul Din\n03473547036`;
  }
}

export const aiProvider = new GeminiProvider();
