import express from 'express';
import { supabase } from '../config/supabase.js';
import { decrypt } from '../utils/crypto.js';
import { sendOutreachEmail } from '../services/gmail.js';
import { aiProvider } from '../services/ai.js';
import { searchOsmLeads } from '../services/leadSearch.js';
import { calculateLeadScore } from '../services/scoring.js';
import {
  validateAiHook,
  isAllowedBusinessEmail,
  extractDomain,
  evaluateBounceSafety,
  checkServiceRequirements,
  composeEmail,
} from '../utils/guardrails.js';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

const router = express.Router();

// In-memory fallback lock & logs
let cronSendLockUntil = null;
let cronSendLastRunAt = null;
let inMemoryLogs = [];
let inMemoryAutoPaused = false;
let inMemoryAutoPauseReason = '';
let inMemoryBouncedList = [];

// Ring-buffer for execution timing metrics
export const cronDurationsLog = [];

function recordCronExecution(endpoint, durationMs, status = 'success', info = {}) {
  const entry = {
    id: 'exec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    endpoint,
    durationMs,
    status,
    timestamp: new Date().toISOString(),
    isUnder8Sec: durationMs < 8000,
    ...info,
  };
  cronDurationsLog.unshift(entry);
  if (cronDurationsLog.length > 50) cronDurationsLog.pop();

  if (supabase) {
    supabase.from('activity_logs').insert({
      event_type: 'cron_run',
      description: `[CRON ${endpoint}] finished in ${durationMs}ms (${status})`,
      metadata: entry,
    }).then(() => {}, () => {});
  }
}

// Middleware to verify CRON_SECRET or authenticated Admin session
function verifyCronAuth(req, res, next) {
  const secret = process.env.CRON_SECRET || 'reachout-cron-secret-2026';
  const cronHeader = req.headers['x-cron-secret'];
  const querySecret = req.query.secret;
  const authHeader = req.headers['authorization'];

  if (cronHeader === secret || querySecret === secret) {
    return next();
  }

  // Permit Bearer token if it matches secret directly
  if (authHeader && authHeader.replace(/^Bearer\s+/i, '') === secret) {
    return next();
  }

  // Permit authenticated admin session from frontend
  if (authHeader && authHeader.startsWith('Bearer ') && supabase) {
    const jwt = authHeader.split(' ')[1];
    supabase.auth.getUser(jwt).then(({ data: { user }, error }) => {
      const adminEmail = (process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'Mshoaibuldin371@gmail.com').toLowerCase().trim();
      if (!error && user && (user.email || '').toLowerCase().trim() === adminEmail) {
        req.user = user;
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET or session token.' });
    }).catch(() => {
      return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
    });
    return;
  }

  return res.status(401).json({ error: 'Unauthorized: Invalid or missing x-cron-secret header.' });
}

/**
 * Resolve user settings & decrypted credentials
 */
async function resolveSettings() {
  let settings = {
    sender_name: 'Shoaib ul Din',
    sender_email: 'Mshoaibuldin371@gmail.com',
    gmail_address: 'Mshoaibuldin371@gmail.com',
    approval_mode: false,
    pause_all: false,
    auto_paused: inMemoryAutoPaused,
    auto_pause_reason: inMemoryAutoPauseReason,
    bounced_list: inMemoryBouncedList,
    skip_sundays: true,
    warmup_start_limit: 15,
    warmup_step: 5,
    warmup_step_days: 3,
    warmup_max_limit: 40,
    facebook_url: 'https://facebook.com/shoaib.media',
    tiktok_url: 'https://www.tiktok.com/@syed_ali_azzam',
    video_portfolio_url: 'https://video-portfolio-572m.vercel.app/',
    ai_video_portfolio_url: 'https://video-portfolio-572m.vercel.app/',
    pm_case_study_url: 'https://github.com/shoaib',
    calendly_link: '',
  };

  if (supabase) {
    const { data } = await supabase.from('settings').select('*').limit(1).single();
    if (data) settings = { ...settings, ...data };
  }

  let appPassword = '';
  if (settings.gmail_app_password_encrypted) {
    appPassword = decrypt(settings.gmail_app_password_encrypted);
  } else if (process.env.GMAIL_APP_PASSWORD) {
    appPassword = process.env.GMAIL_APP_PASSWORD;
  }

  return { settings, appPassword };
}

/**
 * Send an alert email to Shoaib when an urgent event occurs
 */
async function sendShoaibAlert({ subject, html, text }) {
  try {
    const { settings, appPassword } = await resolveSettings();
    const recipient = settings.gmail_address || process.env.GMAIL_USER || 'Mshoaibuldin371@gmail.com';

    // Telegram Bot notification if configured
    const tgToken = settings.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
    const tgChat = settings.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;
    if (tgToken && tgChat) {
      try {
        await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgChat,
            text: `🚨 *ReachOut Alert*\n\n*${subject}*\n\n${text}`,
            parse_mode: 'Markdown',
          }),
        });
      } catch (tgErr) {
        console.error('[TELEGRAM ALERT FAILED]:', tgErr.message);
      }
    }

    if (!appPassword) return;

    await sendOutreachEmail({
      userEmail: recipient,
      appPassword,
      fromName: 'ReachOut System Alert',
      to: recipient,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error('[ALERT EMAIL FAILED]:', err.message);
  }
}

/**
 * /api/cron/health
 * Daily Supabase keep-alive endpoint (Triggered daily by Vercel Hobby cron)
 */
router.all('/health', verifyCronAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    let dbStatus = 'ok';
    if (supabase) {
      const { data, error } = await supabase.from('settings').select('user_id').limit(1);
      if (error) dbStatus = `warning: ${error.message}`;
    }
    const executionMs = Date.now() - startTime;
    recordCronExecution('/api/cron/health', executionMs, 'success', { dbStatus });
    console.log(`[CRON HEALTH] Executed in ${executionMs}ms. DB: ${dbStatus}`);
    res.json({
      status: 'ok',
      keepAlive: true,
      dbStatus,
      executionMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const executionMs = Date.now() - startTime;
    recordCronExecution('/api/cron/health', executionMs, 'error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

/**
 * Standalone Auto-Discovery Executor
 * Discovers leads via OSM/Overpass, validates AI hooks with Gemini,
 * and saves leads and manual tasks to Supabase.
 */
export async function executeAutoDiscovery({ settings, limit = 10, scope = 'pakistan' }) {
  if (!supabase || !settings?.user_id) {
    return { discoveredCount: 0, reason: 'No Supabase or user_id configured' };
  }

  // 1. Get user services
  const { data: dbServices } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', settings.user_id)
    .eq('active', true);

  const serviceMap = {};
  if (dbServices && dbServices.length > 0) {
    for (const s of dbServices) serviceMap[s.slug] = s;
  }

  const cities = scope === 'worldwide'
    ? ['New York', 'London', 'Dubai', 'San Francisco', 'Toronto']
    : ['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Multan', 'Faisalabad'];
  const randomCity = cities[Math.floor(Math.random() * cities.length)];
  const industries = ['restaurants', 'gyms', 'ecommerce', 'tech'];
  const randomInd = industries[Math.floor(Math.random() * industries.length)];

  const discovered = await searchOsmLeads({
    city: randomCity,
    industry: randomInd,
    scope,
    limit,
  });

  let newEmailLeadsCount = 0;
  let newManualTasksCount = 0;

  for (const item of discovered) {
    let targetSlug = 'social-media';
    const indLower = (item.industry || randomInd).toLowerCase();
    if (indLower.includes('tech') || indLower.includes('software') || indLower.includes('digital')) {
      targetSlug = serviceMap['video-editing'] ? 'video-editing' : 'social-media';
    } else if (indLower.includes('gym') || indLower.includes('fitness')) {
      targetSlug = 'video-editing';
    }

    const serviceObj = serviceMap[targetSlug] || Object.values(serviceMap)[0] || null;
    const serviceId = serviceObj?.id || null;

    const hasEmail = isAllowedBusinessEmail(item.email, 'osm_overpass');
    const hasSocialOrPhone = Boolean(item.phone || (item.socials && Object.keys(item.socials).length > 0));

    let rawHook = '';
    try {
      rawHook = await aiProvider.generatePersonalHook(item, serviceObj?.display_name || 'Social Media Management');
    } catch (e) {
      rawHook = `I came across ${item.business_name} in ${randomCity} and was really impressed by your local presence.`;
    }
    const validated = validateAiHook(rawHook, item.business_name);
    const score = calculateLeadScore(item);

    if (hasEmail) {
      const cleanEmail = item.email.trim().toLowerCase();
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!existing) {
        const { data: insertedLead } = await supabase.from('leads').insert({
          user_id: settings.user_id,
          service_id: serviceId,
          business_name: item.business_name,
          email: cleanEmail,
          phone: item.phone || '',
          website: item.website || '',
          city: item.city || randomCity,
          country: item.country || (scope === 'worldwide' ? 'International' : 'Pakistan'),
          lead_score: score,
          status: 'new',
          personal_hook: validated.hook,
          source: item.source || 'osm_overpass',
        }).select().single();

        if (insertedLead) {
          newEmailLeadsCount++;
          if (item.socials) {
            for (const [platform, url] of Object.entries(item.socials)) {
              if (url) {
                try {
                  await supabase.from('lead_channels').insert({
                    lead_id: insertedLead.id,
                    platform,
                    profile_url: url,
                    status: 'pending',
                  });
                } catch (chErr) {}
              }
            }
          }
        }
      }
    } else if (hasSocialOrPhone) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('business_name', item.business_name)
        .maybeSingle();

      if (!existing) {
        const { data: insertedLead } = await supabase.from('leads').insert({
          user_id: settings.user_id,
          service_id: serviceId,
          business_name: item.business_name,
          email: '',
          phone: item.phone || '',
          website: item.website || '',
          city: item.city || randomCity,
          country: item.country || (scope === 'worldwide' ? 'International' : 'Pakistan'),
          lead_score: score,
          status: 'new',
          personal_hook: validated.hook,
          source: item.source || 'osm_overpass',
        }).select().single();

        if (insertedLead) {
          const platform = item.socials?.instagram ? 'Instagram' : (item.phone ? 'WhatsApp' : 'Social');
          const profileUrl = item.socials?.instagram || (item.phone ? `https://wa.me/${item.phone.replace(/[^0-9]/g, '')}` : '');

          let dmText = '';
          try {
            dmText = await aiProvider.generateManualDm({
              business_name: item.business_name,
              city: item.city || randomCity,
              industry: item.industry || randomInd,
            }, platform);
          } catch (e) {
            dmText = `Salam ${item.business_name}! Loved your presence in ${item.city || randomCity}. Would love to share a couple of short-form content ideas for your brand.`;
          }

          try {
            await supabase.from('manual_tasks').insert({
              user_id: settings.user_id,
              lead_id: insertedLead.id,
              platform,
              profile_url: profileUrl,
              suggested_service: targetSlug,
              dm_message: dmText,
              status: 'pending',
            });
          } catch (mErr) {
            console.error('[MANUAL TASK INSERT ERROR]:', mErr.message);
          }

          newManualTasksCount++;
        }
      }
    }
  }

  return {
    success: true,
    city: randomCity,
    industry: randomInd,
    newEmailLeadsCount,
    newManualTasksCount,
  };
}

/**
 * /api/cron/discover
 * Dedicated trigger to discover new leads and populate manual tasks
 */
router.all('/discover', verifyCronAuth, async (req, res) => {
  try {
    const { settings } = await resolveSettings();
    const scope = req.query.scope || settings.reachout_scope || 'pakistan';
    const limit = parseInt(req.query.limit || '10');
    const result = await executeAutoDiscovery({ settings, limit, scope });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * /api/cron/send
 * Runs every 15-30 minutes. Auto-discovers leads 24/7, dispatches during PKT hours.
 * Supports ?force=1 to test-send immediately.
 * Supports ?dry=1 to generate and preview without sending.
 */
router.all('/send', verifyCronAuth, async (req, res) => {
  const startTime = Date.now();
  const isDryRun = req.query.dry === '1' || req.query.dry === 'true';
  const isForce = req.query.force === '1' || req.query.force === 'true';

  try {
    const now = new Date();
    const pktDate = new Date(now.getTime() + 5 * 3600000);
    const pktHours = pktDate.getUTCHours();
    const pktMinutes = pktDate.getUTCMinutes();
    const pktDay = pktDate.getUTCDay(); // 0 is Sunday

    const { settings, appPassword } = await resolveSettings();

    // =========================================================================
    // DRY RUN MODE (?dry=1) - Generates hooks & emails for all 4 services, sends nothing
    // =========================================================================
    if (isDryRun) {
      const servicesList = [
        { slug: 'social-media', name: 'Social Media Management', exp: '4 months' },
        { slug: 'video-editing', name: 'Video Editing', exp: '3 years' },
        { slug: 'ai-video', name: 'AI Video Creation', exp: '4 months' },
        { slug: 'product-manager', name: 'Product Management', exp: '4 months' },
      ];

      const dryResults = [];
      for (const s of servicesList) {
        const reqCheck = checkServiceRequirements(s.slug, settings, 'pakistan');
        const dummyLead = {
          business_name: `Sample ${s.name} Lead`,
          contact_name: 'Salman Tariq',
          first_name: 'Salman',
          city: 'Islamabad',
          personal_hook: `I came across your business in Islamabad and noticed great engagement on your recent posts.`,
        };

        const emailComposition = composeEmail({
          step: 0,
          lead: dummyLead,
          service: { slug: s.slug, experience_text: s.exp },
          settings,
          region: 'pakistan',
        });

        dryResults.push({
          service: s.name,
          slug: s.slug,
          serviceReady: reqCheck.ready,
          warnings: reqCheck.warnings,
          subject: emailComposition.subject,
          text: emailComposition.text,
          wordCount: emailComposition.wordCount,
          isUnder120Words: emailComposition.isUnder120Words,
          portfolioUrl: emailComposition.portfolioUrl,
        });
      }

      const executionMs = Date.now() - startTime;
      console.log(`[CRON SEND DRY] Finished in ${executionMs}ms`);
      return res.json({
        dryRun: true,
        status: 'success',
        executionMs,
        servicesSampled: dryResults.length,
        emails: dryResults,
      });
    }

    // =========================================================================
    // 1. IDEMPOTENCY & CONCURRENCY LOCK (Prevents duplicate simultaneous sends)
    // =========================================================================
    if (!isForce && cronSendLockUntil && new Date(cronSendLockUntil) > now) {
      console.log('[CRON SEND] Call locked by another active send job.');
      return res.json({
        status: 'locked',
        message: 'Another send cron job is currently executing. Skipping to prevent duplicate sends.',
      });
    }

    if (!isForce && cronSendLastRunAt && (now.getTime() - new Date(cronSendLastRunAt).getTime()) < 15000) {
      console.log('[CRON SEND] Call throttled: ran less than 15s ago.');
      return res.json({
        status: 'skipped_throttled',
        message: 'Job ran less than 15 seconds ago. Skipping duplicate trigger.',
      });
    }

    // Acquire lock for 45 seconds
    cronSendLockUntil = new Date(now.getTime() + 45000).toISOString();
    cronSendLastRunAt = now.toISOString();

    // =========================================================================
    // 2. AUTO-DISCOVERY (Runs 24/7 if fewer than 30 unsent leads in DB)
    // =========================================================================
    let discoveryResult = null;
    let unsentLeadCount = 0;
    if (supabase) {
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
        .neq('email', '');
      unsentLeadCount = count || 0;
    }

    if (unsentLeadCount < 30) {
      try {
        discoveryResult = await executeAutoDiscovery({
          settings,
          limit: 10,
          scope: settings.reachout_scope || 'pakistan',
        });
        console.log('[AUTO DISCOVERY SUCCESS]:', discoveryResult);
      } catch (dErr) {
        console.error('[AUTO DISCOVERY WARNING]:', dErr.message);
      }
    }

    // =========================================================================
    // 3. SAFETY CHECKS (Global Pause, Auto-Pause, Sunday skip, Time Window)
    // =========================================================================
    if (settings.pause_all) {
      cronSendLockUntil = null;
      return res.json({ status: 'paused', message: 'Campaigns are globally paused via Settings.' });
    }

    if (settings.auto_paused) {
      cronSendLockUntil = null;
      return res.json({
        status: 'auto_paused',
        message: `Sending is auto-paused by safety guardrails: ${settings.auto_pause_reason}`,
        bounced_list: settings.bounced_list || inMemoryBouncedList,
      });
    }

    if (!isForce && settings.skip_sundays && pktDay === 0) {
      cronSendLockUntil = null;
      return res.json({ status: 'skipped', message: 'Skipping Sunday as per outreach policy.' });
    }

    if (!isForce && (pktHours < 10 || pktHours >= 18)) {
      cronSendLockUntil = null;
      return res.json({
        status: 'outside_window',
        message: `Current PKT time is ${pktHours}:${pktMinutes}. Sending window is 10:00–18:00 Asia/Karachi. Auto-discovery finished.`,
        discovery: discoveryResult,
      });
    }

    if (!appPassword) {
      cronSendLockUntil = null;
      return res.status(400).json({ status: 'error', message: 'No Gmail App Password configured.' });
    }

    // =========================================================================
    // 4. SERVER-SIDE WARM-UP CALCULATION (Counted strictly from DB)
    // =========================================================================
    const startDate = settings.created_at ? new Date(settings.created_at) : new Date(now.getTime() - 4 * 86400000);
    const daysSinceStart = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
    const startLimit = settings.warmup_start_limit || 15;
    const step = settings.warmup_step || 5;
    const stepDays = settings.warmup_step_days || 3;
    const maxLimit = settings.warmup_max_limit || 40; // Max 40/day

    const dailyLimit = Math.min(maxLimit, startLimit + Math.floor(daysSinceStart / stepDays) * step);

    // Midnight PKT in UTC
    const pktMidnight = new Date(pktDate.getFullYear(), pktDate.getMonth(), pktDate.getDate(), 0, 0, 0);
    const utcMidnight = new Date(pktMidnight.getTime() - 5 * 3600000).toISOString();

    let sentToday = 0;
    let recentLogs = [...inMemoryLogs];

    if (supabase) {
      const { count } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .gte('sent_at', utcMidnight);
      sentToday = count || 0;

      const { data: logsData } = await supabase
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(25);
      if (logsData) recentLogs = logsData;
    }

    if (!isForce && sentToday >= dailyLimit) {
      cronSendLockUntil = null;
      return res.json({
        status: 'daily_limit_reached',
        message: `Daily warm-up limit reached: ${sentToday}/${dailyLimit} sent today.`,
        sentToday,
        dailyLimit,
      });
    }

    // =========================================================================
    // 5. BOUNCE SAFETY GUARDRAIL (Evaluates ONLY after at least 20 sent emails)
    // =========================================================================
    const bounceSafety = evaluateBounceSafety(recentLogs);
    if (bounceSafety.shouldPause) {
      inMemoryAutoPaused = true;
      inMemoryAutoPauseReason = bounceSafety.reason;
      inMemoryBouncedList = bounceSafety.bouncedEmails;

      if (supabase) {
        await supabase.from('settings').update({
          auto_paused: true,
          auto_pause_reason: bounceSafety.reason,
          updated_at: new Date().toISOString(),
        }).eq('user_id', settings.user_id);
      }

      await sendShoaibAlert({
        subject: '🚨 [CRITICAL ALERT] Outreach Auto-Paused Due to Bounce Rate (>5%)',
        text: `Shoaib, your automated outreach has been immediately paused.\n\nReason: ${bounceSafety.reason}\nBounced addresses: ${bounceSafety.bouncedEmails.join(', ')}\n\nPlease review these addresses before resuming.`,
        html: `
          <div style="font-family:sans-serif;padding:20px;border:2px solid #ba1a1a;border-radius:10px;background:#fff8f8;">
            <h2 style="color:#ba1a1a;margin-top:0;">🚨 Outreach Auto-Paused for Safety</h2>
            <p><strong>Reason:</strong> ${bounceSafety.reason}</p>
            <p>Bounced recipients: <strong>${bounceSafety.bouncedEmails.join(', ')}</strong></p>
            <p>Dispatches stopped to protect your Gmail sender reputation.</p>
          </div>
        `
      });

      cronSendLockUntil = null;
      return res.json({
        status: 'auto_paused_triggered',
        error: bounceSafety.reason,
        bounced_list: bounceSafety.bouncedEmails,
      });
    }

    // Small batch: send at most 1-2 emails per call
    const remainingToday = dailyLimit - sentToday;
    const batchSize = isForce ? 1 : Math.min(2, Math.max(1, remainingToday));

    // =========================================================================
    // 6. SELECT 1-2 EMAILS (Follow-ups Day 3 -> Day 7 -> Day 0 Initial)
    // =========================================================================
    const itemsToSend = [];

    if (supabase) {
      // Check follow-ups for leads already contacted
      const { data: contactedLeads } = await supabase
        .from('leads')
        .select('*, services(*)')
        .eq('status', 'contacted')
        .neq('email', '')
        .limit(batchSize);

      if (contactedLeads) {
        for (const clead of contactedLeads) {
          const { data: leadLogs } = await supabase
            .from('email_logs')
            .select('*')
            .eq('lead_id', clead.id)
            .eq('status', 'sent')
            .order('sent_at', { ascending: true });

          const sentCount = leadLogs ? leadLogs.length : 0;
          if (sentCount === 1) {
            const lastSent = new Date(leadLogs[0].sent_at);
            if (now - lastSent >= 3 * 86400000) {
              await supabase.from('leads').update({ status: 'sending' }).eq('id', clead.id);
              itemsToSend.push({
                lead: clead,
                step: 1,
                inReplyTo: leadLogs[0].message_id,
                threadId: leadLogs[0].thread_id || leadLogs[0].message_id,
              });
              if (itemsToSend.length >= batchSize) break;
            }
          } else if (sentCount === 2) {
            const lastSent = new Date(leadLogs[1].sent_at);
            if (now - lastSent >= 4 * 86400000) {
              await supabase.from('leads').update({ status: 'sending' }).eq('id', clead.id);
              itemsToSend.push({
                lead: clead,
                step: 2,
                inReplyTo: leadLogs[1].message_id,
                threadId: leadLogs[1].thread_id || leadLogs[1].message_id,
              });
              if (itemsToSend.length >= batchSize) break;
            }
          }
        }
      }

      // If no follow-ups due, pick top-scored new lead
      if (itemsToSend.length < batchSize) {
        const { data: newLeads } = await supabase
          .from('leads')
          .select('*, services(*)')
          .eq('status', 'new')
          .neq('email', '')
          .order('lead_score', { ascending: false })
          .limit(batchSize - itemsToSend.length);

        if (newLeads) {
          for (const nl of newLeads) {
            await supabase.from('leads').update({ status: 'sending' }).eq('id', nl.id);
            itemsToSend.push({ lead: nl, step: 0 });
          }
        }
      }
    }

    if (itemsToSend.length === 0) {
      cronSendLockUntil = null;
      return res.json({
        status: 'no_leads_ready',
        message: 'No leads currently due for sending.',
        discovery: discoveryResult,
        executionMs: Date.now() - startTime,
      });
    }

    // =========================================================================
    // 7. DISPATCH THE BATCH VIA GMAIL SMTP (Appears in Gmail Sent folder)
    // =========================================================================
    const results = [];
    const sender = settings.gmail_address || process.env.GMAIL_USER || 'Mshoaibuldin371@gmail.com';
    const senderName = settings.sender_name || 'Shoaib ul Din';

    for (const item of itemsToSend) {
      const { lead, step, inReplyTo, threadId } = item;
      const serviceObj = lead.services || null;
      const slug = serviceObj?.slug || 'social-media';

      // Check required URLs for this service
      const reqCheck = checkServiceRequirements(slug, settings, 'pakistan');
      if (!reqCheck.ready) {
        console.warn(`[SERVICE BLOCKED] Skipping lead ${lead.id}: ${reqCheck.warnings.join(', ')}`);
        if (supabase) await supabase.from('leads').update({ status: 'new' }).eq('id', lead.id);
        results.push({ leadId: lead.id, skipped: true, reason: reqCheck.warnings[0] });
        continue;
      }

      // Suppression check
      if (supabase) {
        const { data: suppressed } = await supabase
          .from('suppression_list')
          .select('*')
          .eq('email', lead.email.toLowerCase())
          .limit(1);

        if (suppressed && suppressed.length > 0) {
          await supabase.from('leads').update({ status: 'suppressed' }).eq('id', lead.id);
          results.push({ leadId: lead.id, skipped: true, reason: 'Suppressed email' });
          continue;
        }
      }

      // Compose plain-text email (<120 words, no tracking link in Step 0)
      const composition = composeEmail({
        step,
        lead,
        service: serviceObj || { slug },
        settings,
        region: 'pakistan',
      });

      try {
        const sendRes = await sendOutreachEmail({
          userEmail: sender,
          appPassword,
          fromName: senderName,
          to: lead.email,
          subject: composition.subject,
          text: composition.text,
          inReplyTo: inReplyTo || null,
          references: threadId || null,
        });

        results.push({
          leadId: lead.id,
          recipient: lead.email,
          step,
          messageId: sendRes.messageId,
          wordCount: composition.wordCount,
        });

        inMemoryLogs.unshift({
          recipient: lead.email,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        if (supabase) {
          await supabase.from('email_logs').insert({
            user_id: settings.user_id,
            lead_id: lead.id,
            service_id: serviceObj?.id || lead.service_id || null,
            message_id: sendRes.messageId,
            thread_id: threadId || sendRes.messageId,
            in_reply_to: inReplyTo || null,
            references_header: threadId || null,
            subject: composition.subject,
            recipient: lead.email,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });

          await supabase.from('leads').update({
            status: 'contacted',
            updated_at: new Date().toISOString(),
          }).eq('id', lead.id);
        }
      } catch (smtpErr) {
        console.error(`[SMTP ERROR on ${lead.email}]:`, smtpErr.message);

        // Auto pause on auth or quota error
        if (/auth|quota|limit|credentials|535|454/i.test(smtpErr.message)) {
          inMemoryAutoPaused = true;
          inMemoryAutoPauseReason = `SMTP Error: ${smtpErr.message}`;

          if (supabase) {
            await supabase.from('settings').update({
              auto_paused: true,
              auto_pause_reason: `SMTP Auth/Quota Error: ${smtpErr.message}`,
              updated_at: new Date().toISOString(),
            }).eq('user_id', settings.user_id);
          }

          await sendShoaibAlert({
            subject: '🚨 [CRITICAL ALERT] Outreach Auto-Paused: Gmail SMTP Error',
            text: `Shoaib, outreach paused due to an SMTP error:\n\n${smtpErr.message}\nPlease check your Gmail App Password.`,
          });
        }

        if (supabase) await supabase.from('leads').update({ status: 'new' }).eq('id', lead.id);
        results.push({ leadId: lead.id, recipient: lead.email, error: smtpErr.message });
      }
    }

    cronSendLockUntil = null;
    const executionMs = Date.now() - startTime;
    recordCronExecution('/api/cron/send', executionMs, 'success', {
      sentCount: results.filter(r => !r.error && !r.skipped).length,
    });
    console.log(`[CRON SEND] Executed in ${executionMs}ms. Sent: ${results.filter(r => !r.error && !r.skipped).length}`);

    res.json({
      status: 'success',
      executionMs,
      sentInThisCall: results.filter(r => !r.error && !r.skipped).length,
      sentToday: sentToday + results.filter(r => !r.error && !r.skipped).length,
      dailyLimit,
      results,
      discovery: discoveryResult,
    });
  } catch (err) {
    cronSendLockUntil = null;
    const executionMs = Date.now() - startTime;
    recordCronExecution('/api/cron/send', executionMs, 'error', { error: err.message });
    console.error('[CRON SEND FATAL]:', err);
    res.status(500).json({ status: 'error', error: err.message, executionMs });
  }
});

/**
 * /api/cron/replies
 * Runs every 15 minutes (triggered via cron-job.org).
 * Max 10 messages per invocation to finish in under 8 seconds.
 */
router.all('/replies', verifyCronAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    const { settings, appPassword } = await resolveSettings();
    if (!appPassword) {
      return res.json({ status: 'skipped', message: 'No Gmail App Password available.' });
    }

    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: settings.gmail_address || 'Mshoaibuldin371@gmail.com',
        pass: appPassword.replace(/\s+/g, ''),
      },
      logger: false,
    });

    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    const processedReplies = [];

    try {
      // Process maximum 10 messages per call to ensure <8s execution time
      let count = 0;
      for await (const message of client.fetch({ unseen: true }, { envelope: true, source: true })) {
        if (++count > 10) break;

        const parsed = await simpleParser(message.source);
        const fromEmail = parsed.from?.value?.[0]?.address || '';
        const fromName = parsed.from?.value?.[0]?.name || fromEmail;
        const subject = parsed.subject || '';
        const bodyText = parsed.text || '';

        const isBounce = /mailer-daemon|postmaster|delivery status notification|undelivered/i.test(fromEmail) ||
          /failure notice|delivery status/i.test(subject);

        if (isBounce) {
          processedReplies.push({ type: 'bounce', from: fromEmail, subject });
          inMemoryBouncedList.push(fromEmail.toLowerCase());

          if (supabase && settings.user_id) {
            const { data: exSup } = await supabase.from('suppression_list').select('id').eq('email', fromEmail.toLowerCase()).maybeSingle();
            if (!exSup) {
              await supabase.from('suppression_list').insert({
                user_id: settings.user_id,
                email: fromEmail.toLowerCase(),
                reason: 'bounced',
              });
            }

            await supabase.from('email_logs').update({
              status: 'bounced',
            }).eq('recipient', fromEmail.toLowerCase());
          }
          continue;
        }

        // Classify with Gemini AI
        let classification = 'Question';
        try {
          classification = await aiProvider.classifyReply(subject, bodyText);
        } catch (e) {
          classification = 'Question';
        }

        processedReplies.push({
          type: 'reply',
          from: fromEmail,
          fromName,
          classification,
          subject,
        });

        if (classification === 'Unsubscribe') {
          if (supabase && settings.user_id) {
            const { data: exSup } = await supabase.from('suppression_list').select('id').eq('email', fromEmail.toLowerCase()).maybeSingle();
            if (!exSup) {
              await supabase.from('suppression_list').insert({
                user_id: settings.user_id,
                email: fromEmail.toLowerCase(),
                reason: 'unsubscribed',
              });
            }

            await supabase.from('leads').update({
              status: 'unsubscribed',
              updated_at: new Date().toISOString(),
            }).eq('email', fromEmail.toLowerCase());
          }
          continue;
        }

        if (supabase) {
          await supabase.from('leads').update({
            status: classification === 'Interested' ? 'interested' : 'replied',
            updated_at: new Date().toISOString(),
          }).eq('email', fromEmail.toLowerCase());
        }

        // Send instant alert on EVERY reply (with HOT marking for Interested)
        const isHot = classification === 'Interested';
        const alertBadge = isHot ? '🔥 [HOT LEAD ALERT]' : `📥 [NEW REPLY - ${classification}]`;
        const alertSubject = `${alertBadge} ${fromName} (${fromEmail})`;
        const alertBody = `Assalam o Alaikum Shoaib,\n\n${isHot ? '🔥 HOT INTERESTED LEAD DETECTED!\n\n' : ''}Prospect: ${fromName}\nEmail: ${fromEmail}\nCategory: ${classification}\nSubject: ${subject}\n\nMessage Preview:\n"${bodyText.slice(0, 300)}..."\n\nOpen ReachOut Inbox to review or reply with AI Assistant.`;

        await sendShoaibAlert({
          subject: alertSubject,
          text: alertBody,
        });
      }
    } finally {
      lock.release();
      await client.logout();
    }

    const executionMs = Date.now() - startTime;
    recordCronExecution('/api/cron/replies', executionMs, 'success', {
      processedCount: processedReplies.length,
    });
    console.log(`[CRON REPLIES] Executed in ${executionMs}ms. Processed: ${processedReplies.length}`);

    res.json({
      status: 'success',
      executionMs,
      processedCount: processedReplies.length,
      replies: processedReplies,
    });
  } catch (err) {
    const executionMs = Date.now() - startTime;
    recordCronExecution('/api/cron/replies', executionMs, 'error', { error: err.message });
    console.error('[CRON REPLIES ERROR]:', err);
    res.status(500).json({ error: err.message, executionMs });
  }
});

/**
 * /api/cron/daily-summary
 * Runs at 20:00 Asia/Karachi (15:00 UTC) via GitHub Actions.
 */
router.all('/daily-summary', verifyCronAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    const now = new Date();
    const pktDate = new Date(now.getTime() + 5 * 3600000);
    const pktMidnight = new Date(pktDate.getFullYear(), pktDate.getMonth(), pktDate.getDate(), 0, 0, 0);
    const utcMidnight = new Date(pktMidnight.getTime() - 5 * 3600000).toISOString();

    const { settings } = await resolveSettings();

    let sentCount = 0;
    let bounceCount = 0;
    let replyCount = 0;
    let clickCount = 0;
    let unsentLeads = 0;

    if (supabase) {
      const { count: sCount } = await supabase.from('email_logs').select('*', { count: 'exact', head: true }).gte('sent_at', utcMidnight);
      sentCount = sCount || 0;

      const { count: bCount } = await supabase.from('suppression_list').select('*', { count: 'exact', head: true }).gte('created_at', utcMidnight);
      bounceCount = bCount || 0;

      const { count: rCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).in('status', ['replied', 'interested']).gte('updated_at', utcMidnight);
      replyCount = rCount || 0;

      const { count: cCount } = await supabase.from('link_clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', utcMidnight);
      clickCount = cCount || 0;

      const { count: uCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new').neq('email', '');
      unsentLeads = uCount || 0;
    }

    const summaryHtml = `
      <div style="font-family:sans-serif;max-width:580px;padding:24px;border:1px solid #dae2fd;border-radius:12px;background:#faf8ff;">
        <h2 style="color:#0038b1;margin-top:0;">📊 ReachOut Daily Executive Summary</h2>
        <p style="color:#515f74;font-size:14px;">Summary for ${pktDate.toDateString()} (20:00 Asia/Karachi)</p>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
          <div style="background:#ffffff;padding:12px;border-radius:8px;border:1px solid #eaedff;">
            <span style="font-size:11px;color:#747686;text-transform:uppercase;">Emails Sent Today</span>
            <h3 style="margin:4px 0 0;font-size:22px;color:#131b2e;">${sentCount}</h3>
          </div>
          <div style="background:#ffffff;padding:12px;border-radius:8px;border:1px solid #eaedff;">
            <span style="font-size:11px;color:#747686;text-transform:uppercase;">Replies Received</span>
            <h3 style="margin:4px 0 0;font-size:22px;color:#0038b1;">${replyCount}</h3>
          </div>
          <div style="background:#ffffff;padding:12px;border-radius:8px;border:1px solid #eaedff;">
            <span style="font-size:11px;color:#747686;text-transform:uppercase;">Portfolio Clicks</span>
            <h3 style="margin:4px 0 0;font-size:22px;color:#2d2bbd;">${clickCount}</h3>
          </div>
          <div style="background:#ffffff;padding:12px;border-radius:8px;border:1px solid #eaedff;">
            <span style="font-size:11px;color:#747686;text-transform:uppercase;">Bounces</span>
            <h3 style="margin:4px 0 0;font-size:22px;color:${bounceCount > 0 ? '#ba1a1a' : '#515f74'};">${bounceCount}</h3>
          </div>
        </div>

        <div style="background:#ffffff;padding:14px;border-radius:8px;border:1px solid #eaedff;margin-bottom:16px;">
          <p style="margin:0;font-size:13px;color:#131b2e;"><strong>Unsent Leads in Queue:</strong> ${unsentLeads} prospects ready</p>
          <p style="margin:4px 0 0;font-size:13px;color:#131b2e;"><strong>System Status:</strong> ${settings.auto_paused ? '⚠️ Auto-Paused' : '✅ Active & Healthy'}</p>
        </div>
      </div>
    `;

    await sendShoaibAlert({
      subject: `📊 ReachOut Daily Summary: ${sentCount} sent, ${replyCount} replies, ${clickCount} clicks`,
      text: `Daily Summary (${pktDate.toDateString()}):\n- Sent Today: ${sentCount}\n- Replies: ${replyCount}\n- Portfolio Clicks: ${clickCount}\n- Bounces: ${bounceCount}\n- Leads in Queue: ${unsentLeads}`,
      html: summaryHtml,
    });

    const executionMs = Date.now() - startTime;
    res.json({
      status: 'success',
      executionMs,
      sentCount,
      replyCount,
      bounceCount,
      clickCount,
      unsentLeads,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, executionMs: Date.now() - startTime });
  }
});

/**
 * GET /api/cron/status
 */
router.get('/status', async (req, res) => {
  try {
    const { settings } = await resolveSettings();
    res.json({
      success: true,
      auto_paused: settings.auto_paused,
      auto_pause_reason: settings.auto_pause_reason,
      bounced_list: settings.bounced_list || inMemoryBouncedList,
      pause_all: settings.pause_all,
      approval_mode: settings.approval_mode,
      warmup: {
        start: settings.warmup_start_limit || 15,
        step: settings.warmup_step || 5,
        max: settings.warmup_max_limit || 40,
      },
      serviceWarnings: {
        socialMedia: checkServiceRequirements('social-media', settings).warnings,
        videoEditing: checkServiceRequirements('video-editing', settings).warnings,
        aiVideo: checkServiceRequirements('ai-video', settings).warnings,
        productManager: checkServiceRequirements('product-manager', settings).warnings,
      },
      recentDurations: cronDurationsLog.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/cron/durations
 * Returns recent cron execution durations for System Health monitoring
 */
router.get('/durations', (req, res) => {
  res.json({
    success: true,
    durations: cronDurationsLog.slice(0, 10),
  });
});

export default router;
