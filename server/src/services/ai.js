import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Provider Interface
 * Uses Gemini API (GEMINI_API_KEY) with clean fallback and provider isolation
 */
class GeminiProvider {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  get model() {
    if (!this.genAI && process.env.GEMINI_API_KEY) {
      this.apiKey = process.env.GEMINI_API_KEY;
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
    return this.genAI ? this.genAI.getGenerativeModel({ model: this.modelName }) : null;
  }

  /**
   * Generates a 1-sentence personalized opening hook
   */
  async generatePersonalHook(lead, serviceName) {
    if (!this.model) {
      return `I came across ${lead.business_name} and was really impressed by your local presence.`;
    }

    try {
      const prompt = `You are a cold outreach specialist. Write ONE concise, natural, professional opening sentence for an email to a business named "${lead.business_name}" in industry/category "${lead.target_industry || lead.city || 'local business'}".
Context:
- Business: ${lead.business_name}
- City: ${lead.city || 'Islamabad'}
- Website/Info: ${lead.website || 'N/A'}
- Service pitched: ${serviceName}

RULES:
- Maximum 25 words.
- Sound like a real person, not an AI or marketer.
- Do NOT make up fake client names, case studies, or false statistics.
- Output ONLY the one sentence. No quotes, no preamble.`;

      const result = await this.model.generateContent(prompt);
      return result.response.text().trim().replace(/^["']|["']$/g, '');
    } catch (err) {
      console.error('AI generatePersonalHook error:', err.message);
      return `I noticed ${lead.business_name}'s great work and wanted to connect directly.`;
    }
  }

  /**
   * Match lead to best fitting of the 4 services
   */
  async matchService(lead, services) {
    const serviceList = services.map(s => `${s.slug}: ${s.name} (${s.description})`).join('\n');
    if (!this.model) {
      // Simple heuristic fallback
      const text = `${lead.business_name} ${lead.notes || ''}`.toLowerCase();
      if (text.includes('video') || text.includes('film') || text.includes('youtube')) return 'video-editing';
      if (text.includes('tech') || text.includes('software') || text.includes('app')) return 'product-manager';
      if (text.includes('ai') || text.includes('automation')) return 'ai-video';
      return 'social-media';
    }

    try {
      const prompt = `Given this business:
Name: ${lead.business_name}
City: ${lead.city}
Rating: ${lead.rating} (${lead.review_count} reviews)
Notes: ${lead.notes || 'None'}

Choose the single best matching service slug from these 4 options:
${serviceList}

Respond with ONLY the exact slug (e.g. social-media, video-editing, ai-video, product-manager).`;

      const result = await this.model.generateContent(prompt);
      const chosenSlug = result.response.text().trim().toLowerCase();
      const match = services.find(s => s.slug === chosenSlug);
      return match ? match.slug : services[0].slug;
    } catch (err) {
      console.error('AI matchService error:', err.message);
      return services[0]?.slug || 'social-media';
    }
  }

  /**
   * Classifies an incoming reply
   * Options: Interested, Not interested, Question, Out of office, Unsubscribe
   */
  async classifyReply(subject, bodyText) {
    const normalized = (bodyText + ' ' + subject).toLowerCase();
    
    // Quick rules for common explicit keywords
    if (/stop|unsubscribe|remove me|opt out|do not email/i.test(normalized)) {
      return 'Unsubscribe';
    }
    if (/out of office|auto-reply|automatic reply|on vacation|away from my email/i.test(normalized)) {
      return 'Out of office';
    }

    if (!this.model) {
      if (/interested|call|book|meet|schedule|sounds good|yes/i.test(normalized)) return 'Interested';
      if (/no thanks|not interested|pass|not for us/i.test(normalized)) return 'Not interested';
      if (/\?|how much|cost|pricing|portfolio|samples/i.test(normalized)) return 'Question';
      return 'Question';
    }

    try {
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

      const result = await this.model.generateContent(prompt);
      const classification = result.response.text().trim();
      const validCategories = ['Interested', 'Not interested', 'Question', 'Out of office', 'Unsubscribe'];
      return validCategories.includes(classification) ? classification : 'Question';
    } catch (err) {
      console.error('AI classifyReply error:', err.message);
      return 'Question';
    }
  }
}

export const aiProvider = new GeminiProvider();

