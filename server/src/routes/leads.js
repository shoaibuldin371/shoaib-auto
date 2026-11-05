import express from 'express';
import { supabase } from '../config/supabase.js';
import { searchOsmLeads } from '../services/leadSearch.js';
import { enrichWebsite } from '../services/enricher.js';
import { calculateLeadScore } from '../services/scoring.js';
import { aiProvider } from '../services/ai.js';
import { extractDomain, validateAiHook } from '../utils/guardrails.js';

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
      let query = supabase.from('leads').select('*, lead_channels(*)').order('lead_score', { ascending: false });

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
        return res.json(data);
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

      // Upsert to Supabase if configured
      if (supabase) {
        await supabase.from('leads').upsert({
          business_name: raw.business_name,
          email: raw.email || '',
          phone: raw.phone || '',
          website: raw.website || '',
          city: raw.city,
          address: raw.address,
          rating: raw.rating,
          review_count: raw.review_count,
          lead_score: score,
          source: 'osm_overpass',
        }, { onConflict: 'email' });
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
 * Returns: leadsWithEmail, leadsOnlySocial, pendingManualTasksToday, totalLeads
 */
router.get('/telemetry-stats', async (req, res) => {
  try {
    let leadsWithEmail = 0;
    let leadsOnlySocial = 0;
    let pendingManualTasksToday = 0;
    let totalLeads = 0;

    if (supabase) {
      const { count: withEmail } = await supabase.from('leads').select('*', { count: 'exact', head: true }).neq('email', '');
      leadsWithEmail = withEmail || 0;

      const { count: total } = await supabase.from('leads').select('*', { count: 'exact', head: true });
      totalLeads = total || 0;
      leadsOnlySocial = Math.max(0, totalLeads - leadsWithEmail);

      const { count: tasks } = await supabase.from('manual_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      pendingManualTasksToday = tasks || 0;
    } else {
      totalLeads = localLeads.length;
      leadsWithEmail = localLeads.filter(l => Boolean(l.email)).length;
      leadsOnlySocial = localLeads.filter(l => !l.email && (l.phone || (l.socials && Object.keys(l.socials).length > 0))).length;
      pendingManualTasksToday = 4;
    }

    res.json({
      success: true,
      totalLeads,
      leadsWithEmail,
      leadsOnlySocial,
      pendingManualTasksToday,
    });
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
 * Urdu/Roman Urdu to professional English reply drafter
 */
router.post('/reply-assistant', async (req, res) => {
  try {
    const { urduNotes, originalEmail } = req.body || {};
    if (!urduNotes) {
      return res.status(400).json({ error: 'Urdu notes are required.' });
    }

    const replyText = await aiProvider.translateUrduReply(urduNotes, originalEmail);
    res.json({
      success: true,
      replyText,
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

