import express from 'express';
import { supabase } from '../config/supabase.js';
import { searchOsmLeads } from '../services/leadSearch.js';
import { enrichWebsite } from '../services/enricher.js';
import { calculateLeadScore } from '../services/scoring.js';
import { aiProvider } from '../services/ai.js';
import { extractDomain, validateAiHook } from '../utils/guardrails.js';
import { sendOutreachEmail } from '../services/gmail.js';
import { decrypt } from '../utils/crypto.js';

const router = express.Router();

// Local in-memory fallback leads cache for development
let localLeads = [
  {
    id: 'lead-01',
    business_name: 'Chaaye Khana F-6',
    contact_name: 'Salman Khan',
    first_name: 'Salman',
    email: 'contact@chaayekhana.com',
    phone: '+92 51 8312192',
    website: 'https://chaayekhana.com',
    city: 'Islamabad',
    country: 'Pakistan',
    address: 'Shop 11, Block B, United Bakery Plaza, F-6 Markaz, Islamabad',
    rating: 4.6,
    review_count: 245,
    source: 'osm_overpass',
    status: 'new',
    lead_score: 92,
    service_id: 'social-media',
    personal_hook: 'Loved seeing Chaaye Khana F-6 packed on weekends — your signature tea culture deserves viral short-form reels.',
    socials: {
      instagram: 'https://instagram.com/chaayekhana',
      facebook: 'https://facebook.com/chaayekhana',
    },
  },
  {
    id: 'lead-02',
    business_name: 'FitFusion Elite Gym F-10',
    contact_name: 'Hamza Tariq',
    first_name: 'Hamza',
    email: 'info@fitfusion.pk',
    phone: '+92 300 5551234',
    website: 'https://fitfusion.pk',
    city: 'Islamabad',
    country: 'Pakistan',
    address: 'Plot 14, Main Double Road, F-10 Markaz, Islamabad',
    rating: 4.8,
    review_count: 112,
    source: 'osm_overpass',
    status: 'new',
    lead_score: 88,
    service_id: 'video-editing',
    personal_hook: 'I noticed your high-energy trainer transformations at FitFusion and had an idea for fast-paced workout reels.',
    socials: {
      instagram: 'https://instagram.com/fitfusion.pk',
      tiktok: 'https://tiktok.com/@fitfusion.pk',
    },
  },
  {
    id: 'lead-03',
    business_name: 'The Monal Restaurant',
    contact_name: 'Luqman Ali Afzal',
    first_name: 'Luqman',
    email: 'info@themonal.com',
    phone: '+92 51 2898044',
    website: 'https://themonal.com',
    city: 'Islamabad',
    country: 'Pakistan',
    address: 'Daman-e-Koh, Margalla Hills, Islamabad',
    rating: 4.7,
    review_count: 520,
    source: 'osm_overpass',
    status: 'contacted',
    lead_score: 95,
    service_id: 'social-media',
    personal_hook: 'The sunset view from The Monal is iconic in Islamabad; an AI-assisted video showcase would look stunning for tourists.',
    socials: {
      facebook: 'https://facebook.com/themonalislamabad',
      instagram: 'https://instagram.com/themonalislamabad',
    },
  },
  {
    id: 'lead-04',
    business_name: 'PixelCraft Digital Studio F-7',
    contact_name: 'Zia Rehman',
    first_name: 'Zia',
    email: 'hello@pixelcraft.pk',
    phone: '+92 347 1234567',
    website: 'https://pixelcraft.pk',
    city: 'Islamabad',
    country: 'Pakistan',
    address: 'Jinnah Super Market, F-7 Markaz, Islamabad',
    rating: 4.9,
    review_count: 38,
    source: 'osm_overpass',
    status: 'new',
    lead_score: 84,
    service_id: 'product-manager',
    personal_hook: 'I saw PixelCraft expanding its client roster and wanted to see if your dev team needs sprint coordination support.',
    socials: {
      linkedin: 'https://linkedin.com/company/pixelcraft-pk',
      twitter: 'https://x.com/pixelcraft_pk',
    },
  },
  {
    id: 'lead-05',
    business_name: 'Oxygen Lounge & Cafe',
    contact_name: 'Bilal Ahmed',
    first_name: 'Bilal',
    email: '', // No email -> manual task lead!
    phone: '+92 51 2654321',
    website: '',
    city: 'Islamabad',
    country: 'Pakistan',
    address: 'Beverly Centre, Blue Area, Islamabad',
    rating: 4.3,
    review_count: 67,
    source: 'osm_overpass',
    status: 'new',
    lead_score: 74,
    service_id: 'social-media',
    personal_hook: 'Oxygen Lounge has great evening buzz in Blue Area — your TikTok presence could easily double walk-in visits.',
    socials: {
      instagram: 'https://instagram.com/oxygenloungeisb',
      whatsapp: 'https://wa.me/92512654321',
    },
  },
];

/**
 * GET /api/leads
 */
router.get('/', async (req, res) => {
  try {
    const { search, industry, minScore, status } = req.query;

    if (supabase) {
      let query = supabase.from('leads').select('*, services(slug, name), lead_channels(*)').order('lead_score', { ascending: false });

      if (search) {
        query = query.ilike('business_name', `%${search}%`);
      }
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (minScore) {
        query = query.gte('lead_score', parseInt(minScore));
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const formatted = data.map(l => ({
          ...l,
          service_slug: l.services?.slug || 'social-media',
          service_id: l.services?.slug || l.service_id || 'social-media',
          service_uuid: l.service_id,
        }));
        return res.json(formatted);
      }
    }

    // Filter in-memory leads
    let filtered = [...localLeads];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(l => l.business_name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q));
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(l => l.status === status);
    }
    if (minScore) {
      filtered = filtered.filter(l => l.lead_score >= parseInt(minScore));
    }

    filtered.sort((a, b) => b.lead_score - a.lead_score);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/leads/search-osm
 * Search OpenStreetMap Overpass by city & industry
 */
router.post('/search-osm', async (req, res) => {
  try {
    const { city = 'Islamabad', industry = 'restaurants', scope = 'pakistan', limit = 15 } = req.body;
    const rawLeads = await searchOsmLeads({ city, industry, scope, limit });

    const processed = [];
    for (const raw of rawLeads) {
      const score = calculateLeadScore(raw);
      const leadItem = {
        ...raw,
        lead_score: score,
        status: 'new',
        personal_hook: `I noticed ${raw.business_name}'s strong reputation in ${city} and wanted to reach out directly.`,
      };
      processed.push(leadItem);

      // Add to local state
      if (!localLeads.some(l => l.business_name.toLowerCase() === raw.business_name.toLowerCase())) {
        localLeads.unshift(leadItem);
      }

      // Save to Supabase if configured
      if (supabase) {
        try {
          const { data: set } = await supabase.from('settings').select('user_id').limit(1).single();
          const userId = set?.user_id;

          const { data: s } = await supabase.from('services').select('id, slug').limit(1).single();
          const serviceId = s?.id || null;

          if (userId) {
            let existing = null;
            if (raw.email) {
              const { data: ex } = await supabase.from('leads').select('id').eq('email', raw.email.toLowerCase().trim()).maybeSingle();
              existing = ex;
            } else {
              const { data: ex } = await supabase.from('leads').select('id').eq('business_name', raw.business_name).maybeSingle();
              existing = ex;
            }

            if (!existing) {
              await supabase.from('leads').insert({
                user_id: userId,
                service_id: serviceId,
                business_name: raw.business_name,
                email: raw.email ? raw.email.toLowerCase().trim() : '',
                phone: raw.phone || '',
                website: raw.website || '',
                city: raw.city || city,
                address: raw.address || '',
                rating: raw.rating || 0,
                review_count: raw.review_count || 0,
                lead_score: score,
                status: 'new',
                personal_hook: leadItem.personal_hook,
                source: 'osm_overpass',
              });
            }
          }
        } catch (dbErr) {
          console.error('[OSM SUPABASE INSERT ERROR]:', dbErr.message);
        }
      }
    }

    res.json({
      success: true,
      count: processed.length,
      leads: processed,
    });
  } catch (err) {
    console.error('OSM Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/leads/import-csv
 * Supports columns: name, email, website, instagram, facebook, tiktok, phone, city, industry
 * Enforces duplicate checks (by email and domain) and suppression list checks.
 * If no email but has social/phone, auto-creates a Manual Outreach Task.
 */
router.post('/import-csv', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Invalid rows format. Expected an array of lead objects.' });
    }

    const imported = [];
    const skippedDuplicates = [];
    const skippedSuppressed = [];
    const createdManualTasks = [];

    // Pre-fetch suppression list
    let suppressionSet = new Set();
    if (supabase) {
      const { data: supp } = await supabase.from('suppression_list').select('email');
      if (supp) supp.forEach(s => suppressionSet.add(s.email.toLowerCase()));
    }

    for (const r of rows) {
      const name = r.name || r.business_name || r.Company || 'Imported Business';
      const email = (r.email || r.Email || '').trim().toLowerCase();
      const website = (r.website || r.Website || r.url || '').trim();
      const phone = (r.phone || r.Phone || '').trim();
      const city = r.city || r.City || 'Islamabad';
      const industry = r.industry || r.Industry || 'General';

      const socials = {
        instagram: r.instagram || r.Instagram || '',
        facebook: r.facebook || r.Facebook || '',
        tiktok: r.tiktok || r.TikTok || '',
      };

      // 1. Suppression Check
      if (email && suppressionSet.has(email)) {
        skippedSuppressed.push(email);
        continue;
      }

      // 2. Duplicate Check (Check existing email and domain)
      const domain = extractDomain(email) || extractDomain(website);
      const isDuplicateLocal = localLeads.some(l => 
        (email && l.email && l.email.toLowerCase() === email) ||
        (domain && l.website && extractDomain(l.website) === domain)
      );

      if (isDuplicateLocal) {
        skippedDuplicates.push(email || name);
        continue;
      }

      if (supabase && email) {
        const { data: existing } = await supabase.from('leads').select('id').eq('email', email).limit(1);
        if (existing && existing.length > 0) {
          skippedDuplicates.push(email);
          continue;
        }
      }

      // 3. Lead Object
      const lead = {
        id: `csv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        business_name: name,
        contact_name: r.contact_name || r.Contact || '',
        first_name: (r.contact_name || r.Contact || '').split(' ')[0] || '',
        email,
        phone,
        website,
        city,
        country: 'Pakistan',
        industry,
        rating: parseFloat(r.rating || 4.5),
        review_count: parseInt(r.review_count || 25),
        source: 'csv_import',
        status: 'new',
        lead_score: calculateLeadScore({ email, website, phone, review_count: 25, rating: 4.5 }),
        personal_hook: `I came across ${name} in ${city} and was really impressed by your brand.`,
        socials,
      };

      imported.push(lead);
      localLeads.unshift(lead);

      if (supabase) {
        await supabase.from('leads').insert({
          business_name: lead.business_name,
          contact_name: lead.contact_name,
          first_name: lead.first_name,
          email: lead.email,
          phone: lead.phone,
          website: lead.website,
          city: lead.city,
          lead_score: lead.lead_score,
          source: 'csv_import',
          personal_hook: lead.personal_hook,
        });
      }

      // 4. If lead has NO email but has phone/whatsapp/instagram/tiktok/facebook, create Manual Task!
      const hasSocial = Boolean(socials.instagram || socials.facebook || socials.tiktok || phone);
      if (!email && hasSocial) {
        const platform = socials.instagram ? 'Instagram' : (phone ? 'WhatsApp' : 'Social');
        const dmMessage = await aiProvider.generateManualDm({
          business_name: name,
          city,
          industry,
        }, platform);

        createdManualTasks.push({ name, platform });
        if (supabase) {
          await supabase.from('manual_tasks').insert({
            user_id: 'default-user',
            lead_id: lead.id,
            platform,
            profile_url: socials.instagram || socials.facebook || socials.tiktok || (phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}` : ''),
            suggested_service: 'social-media',
            dm_message: dmMessage,
            status: 'pending',
          });
        }
      }
    }

    res.json({
      success: true,
      importedCount: imported.length,
      skippedDuplicatesCount: skippedDuplicates.length,
      skippedSuppressedCount: skippedSuppressed.length,
      manualTasksCreated: createdManualTasks.length,
      leads: imported,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leads/telemetry-stats
 * Returns live DB statistics: emailsSent, openRate, replyRate, meetingsBooked,
 * leadsWithEmail, leadsOnlySocial, pendingManualTasksToday, activeLeadsPerService.
 */
router.get('/telemetry-stats', async (req, res) => {
  try {
    let leadsWithEmail = 0;
    let leadsOnlySocial = 0;
    let pendingManualTasksToday = 0;
    let totalLeads = 0;
    let emailsSent = 0;
    let emailsSentToday = 0;
    let openedEmails = 0;
    let openRate = 0;
    let repliesCount = 0;
    let replyRate = 0;
    let meetingsBooked = 0;
    let interestedCount = 0;
    const activeLeadsPerService = {
      'social-media': 0,
      'video-editing': 0,
      'ai-video': 0,
      'product-manager': 0,
    };

    if (supabase) {
      // 1. Leads
      const { data: allLeads } = await supabase.from('leads').select('id, email, phone, status, service_id, link_click_count');
      if (allLeads && allLeads.length > 0) {
        totalLeads = allLeads.length;
        leadsWithEmail = allLeads.filter(l => Boolean(l.email && l.email.trim())).length;
        leadsOnlySocial = allLeads.filter(l => !l.email && Boolean(l.phone)).length;
        meetingsBooked = allLeads.filter(l => l.status === 'call_booked' || l.status === 'won').length;
        interestedCount = allLeads.filter(l => l.status === 'interested').length;

        // Map service IDs to slugs
        const { data: dbServices } = await supabase.from('services').select('id, slug');
        const idToSlug = {};
        if (dbServices) {
          for (const s of dbServices) idToSlug[s.id] = s.slug;
        }

        for (const l of allLeads) {
          const sSlug = idToSlug[l.service_id] || l.service_id;
          if (activeLeadsPerService[sSlug] !== undefined) {
            activeLeadsPerService[sSlug]++;
          }
        }
      }

      // 2. Email Logs
      const { data: logs, count: totalSent } = await supabase.from('email_logs').select('*', { count: 'exact' });
      emailsSent = totalSent || (logs ? logs.length : 0);

      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      if (logs) {
        emailsSentToday = logs.filter(lg => new Date(lg.sent_at) >= todayMidnight).length;
      }

      // 3. Link Clicks / Opens
      const { count: clickCount } = await supabase.from('link_clicks').select('*', { count: 'exact', head: true });
      openedEmails = clickCount || 0;
      if (emailsSent > 0) {
        openRate = Math.round((openedEmails / emailsSent) * 100);
      }

      // 4. Replies
      const { count: repCount } = await supabase.from('replies').select('*', { count: 'exact', head: true });
      repliesCount = repCount || 0;
      if (emailsSent > 0) {
        replyRate = Math.round((repliesCount / emailsSent) * 100);
      }

      // 5. Manual Tasks
      const { count: tasks } = await supabase.from('manual_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      pendingManualTasksToday = tasks || 0;
    }

    res.json({
      success: true,
      totalLeads,
      leadsWithEmail,
      leadsOnlySocial,
      pendingManualTasksToday,
      emailsSent,
      emailsSentToday,
      openedEmails,
      openRate,
      repliesCount,
      replyRate,
      meetingsBooked,
      interestedCount,
      activeLeadsPerService,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leads/manual-tasks
 * Returns pending and completed manual outreach tasks with lead details
 */
router.get('/manual-tasks', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('manual_tasks')
        .select('*, leads(*)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted = data.map(t => {
          const l = t.leads || {};
          let targetUrl = t.profile_url || '';
          if (!targetUrl && l.phone) {
            targetUrl = `https://wa.me/${l.phone.replace(/[^0-9]/g, '')}`;
          }
          return {
            id: t.id,
            lead_id: t.lead_id,
            business_name: l.business_name || 'Business Contact',
            contact_name: l.contact_name || l.first_name || 'Founder',
            city: l.city || 'Islamabad',
            country: l.country || 'Pakistan',
            platform: t.platform || 'WhatsApp',
            profile_url: targetUrl,
            link: targetUrl,
            dmText: t.dm_message,
            status: t.status,
            suggested_service: t.suggested_service,
            created_at: t.created_at,
          };
        });
        return res.json(formatted);
      }
    }
    return res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/leads/manual-tasks/:id/status
 * Updates status of a manual outreach task (done, replied, skipped, pending)
 */
router.post('/manual-tasks/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (supabase) {
      await supabase.from('manual_tasks').update({
        status,
        completed_at: status === 'done' || status === 'replied' ? new Date().toISOString() : null,
      }).eq('id', id);
    }
    res.json({ success: true, id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/leads/:id/enrich
 * Scrapes website for public email & social links and recalculates score
 */
router.post('/:id/enrich', async (req, res) => {
  try {
    const { id } = req.params;
    const lead = localLeads.find(l => l.id === id);

    if (!lead || !lead.website) {
      return res.status(400).json({ error: 'Lead not found or has no website to enrich.' });
    }

    const enrichment = await enrichWebsite(lead.website);

    if (enrichment.email && !lead.email) {
      lead.email = enrichment.email;
    }
    lead.socials = { ...(lead.socials || {}), ...enrichment.socials };
    lead.lead_score = calculateLeadScore(lead, enrichment);

    res.json({
      success: true,
      lead,
      enrichment,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/leads/:id/generate-hook
 * Uses Gemini API to craft a 1-line personalized hook and match service
 */
router.post('/:id/generate-hook', async (req, res) => {
  try {
    const { id } = req.params;
    const lead = localLeads.find(l => l.id === id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const services = [
      { slug: 'social-media', name: 'Social Media Management', description: 'TikTok & Instagram content' },
      { slug: 'video-editing', name: 'Video Editing', description: 'Short-form reels & pacing' },
      { slug: 'ai-video', name: 'AI Video Creation', description: 'AI promotional videos' },
      { slug: 'product-manager', name: 'Product Management', description: 'PRDs and sprint delivery' },
    ];

    const matchedService = await aiProvider.matchService(lead, services);
    const serviceName = services.find(s => s.slug === matchedService)?.name || 'Social Media Management';
    const hook = await aiProvider.generatePersonalHook(lead, serviceName);

    lead.service_id = matchedService;
    lead.personal_hook = hook;

    res.json({
      success: true,
      service_id: matchedService,
      personal_hook: hook,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/leads/reply-assistant
 * Urdu/Roman Urdu to professional English reply drafter with Roman Urdu explanation and missing details warning
 */
router.post('/reply-assistant', async (req, res) => {
  try {
    const { urduNotes, originalEmail } = req.body || {};
    if (!urduNotes) {
      return res.status(400).json({ error: 'Urdu notes are required.' });
    }

    const result = await aiProvider.translateUrduReply(urduNotes, originalEmail);
    res.json({
      success: true,
      ...result,
      replyText: result.englishDraft,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/leads/explain-in-urdu
 * Roman Urdu summary + suggested next action for incoming email
 */
router.post('/explain-in-urdu', async (req, res) => {
  try {
    const { emailBody, subject } = req.body || {};
    if (!emailBody) {
      return res.status(400).json({ error: 'Email body is required.' });
    }

    const explanation = await aiProvider.explainInUrdu(emailBody, subject);
    res.json({
      success: true,
      explanation,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/leads/send-thread-reply
 * Sends an email reply via Gmail SMTP in the SAME thread (In-Reply-To + References headers)
 */
router.post('/send-thread-reply', async (req, res) => {
  try {
    const { toEmail, subject, text, inReplyTo, references, leadId } = req.body || {};

    if (!toEmail || !text) {
      return res.status(400).json({ error: 'Recipient email and text are required.' });
    }

    // Resolve credentials from settings
    let appPassword = process.env.GMAIL_APP_PASSWORD || '';
    let senderEmail = process.env.GMAIL_USER || 'Mshoaibuldin371@gmail.com';
    let senderName = 'Shoaib ul Din';

    if (supabase) {
      const { data: set } = await supabase.from('settings').select('*').limit(1).single();
      if (set) {
        if (set.gmail_address) senderEmail = set.gmail_address;
        if (set.sender_name) senderName = set.sender_name;
        if (set.gmail_app_password_encrypted) {
          appPassword = decrypt(set.gmail_app_password_encrypted);
        }
      }
    }

    if (!appPassword) {
      return res.status(400).json({ error: 'Gmail App Password is not configured.' });
    }

    const result = await sendOutreachEmail({
      userEmail: senderEmail,
      appPassword,
      fromName: senderName,
      to: toEmail,
      subject: subject?.startsWith('Re:') ? subject : `Re: ${subject || 'Outreach'}`,
      text,
      inReplyTo,
      references: references || inReplyTo,
    });

    if (supabase && leadId) {
      await supabase.from('email_logs').insert({
        user_id: 'default-user',
        lead_id: leadId,
        recipient: toEmail,
        subject: subject || 'Outreach Reply',
        status: 'sent',
        message_id: result.messageId,
        thread_id: inReplyTo || result.messageId,
        sent_at: new Date().toISOString(),
      }).catch(() => {});
    }

    res.json({
      success: true,
      messageId: result.messageId,
      sentTo: toEmail,
      inThread: Boolean(inReplyTo),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/leads/generate-manual-dm
 * Generates and validates a platform-tailored DM (<60 words)
 */
router.post('/generate-manual-dm', async (req, res) => {
  try {
    const { lead, platform } = req.body || {};
    const dm = await aiProvider.generateManualDm(lead || {}, platform || 'Instagram');
    res.json({
      success: true,
      dm,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

