import express from 'express';
import { supabase } from '../config/supabase.js';
import { decrypt } from '../utils/crypto.js';
import { sendOutreachEmail } from '../services/gmail.js';
import { aiProvider } from '../services/ai.js';
import { searchOsmLeads } from '../services/leadSearch.js';
import { calculateLeadScore } from '../services/scoring.js';
import { validateAiHook, isAllowedBusinessEmail, extractDomain, evaluateBounceSafety } from '../utils/guardrails.js';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

const router = express.Router();

// Fallback in-memory state for local testing
let inMemoryLogs = [];
let inMemoryAutoPaused = false;
let inMemoryAutoPauseReason = '';

// Middleware to verify CRON_SECRET
function verifyCronAuth(req, res, next) {
  const secret = process.env.CRON_SECRET || 'reachout-cron-secret-2026';
  const authHeader = req.headers['authorization'];
  const cronHeader = req.headers['x-cron-secret'];
  const querySecret = req.query.secret;

  const token = authHeader?.replace(/^Bearer\s+/i, '') || cronHeader || querySecret;

  if (process.env.NODE_ENV === 'production' && token !== secret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
  }
  next();
}

/**
 * Helper to get user settings and decrypted app password
 */
async function resolveSettings() {
  let settings = {
    sender_name: 'Shoaib ul Din',
    gmail_address: 'Mshoaibuldin371@gmail.com',
    approval_mode: false, // OFF by default
    pause_all: false,
    auto_paused: inMemoryAutoPaused,
    auto_pause_reason: inMemoryAutoPauseReason,
    skip_sundays: true,
    warmup_start_limit: 15,
    warmup_step: 5,
    warmup_step_days: 3,
    warmup_max_limit: 40,
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
 * Send an alert email to Shoaib when an urgent event occurs (pause, bounce rate, hot lead)
 */
async function sendShoaibAlert({ subject, html, text }) {
  try {
    const { settings, appPassword } = await resolveSettings();
    const recipient = settings.gmail_address || process.env.GMAIL_USER || 'Mshoaibuldin371@gmail.com';
    if (!appPassword) return;

    await sendOutreachEmail({
      userEmail: recipient,
      appPassword,
      fromName: 'ReachOut Safety Guardrails',
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
 * /api/cron/send
 * Runs every 30 minutes between 10:00 and 18:00 Asia/Karachi (05:00 to 13:00 UTC), Mon-Sat.
 * Sends at most 1-2 emails per call with automatic safety guardrails & auto-discovery.
 */
router.all('/send', verifyCronAuth, async (req, res) => {
  try {
    const now = new Date();
    // Asia/Karachi is UTC+5
    const pktDate = new Date(now.getTime() + 5 * 3600000);
    const pktHours = pktDate.getUTCHours();
    const pktMinutes = pktDate.getUTCMinutes();
    const pktDay = pktDate.getUTCDay(); // 0 is Sunday

    console.log(`[CRON SEND] Started at ${now.toISOString()} (PKT: ${pktHours}:${pktMinutes}, Day: ${pktDay})`);

    const { settings, appPassword } = await resolveSettings();

    // 1. Check Global Pause & Auto-Pause Guardrails
    if (settings.pause_all) {
      return res.json({ status: 'paused', message: 'Campaigns are globally paused via Settings.' });
    }

    if (settings.auto_paused) {
      return res.json({
        status: 'auto_paused',
        message: `Sending is auto-paused by safety guardrails: ${settings.auto_pause_reason}`,
      });
    }

    // 2. Check Sunday Skip Policy
    if (settings.skip_sundays && pktDay === 0) {
      return res.json({ status: 'skipped', message: 'Skipping Sunday as per outreach policy.' });
    }

    // 3. Check PKT Operating Hours (10:00 to 18:00 Asia/Karachi)
    if (pktHours < 10 || pktHours >= 18) {
      return res.json({
        status: 'outside_window',
        message: `Current PKT time is ${pktHours}:${pktMinutes}. Sending window is 10:00–18:00 Asia/Karachi.`,
      });
    }

    if (!appPassword) {
      return res.status(400).json({ status: 'error', message: 'No Gmail App Password configured.' });
    }

    // 4. Calculate Warm-Up Limit and Daily Quota
    const startDate = settings.created_at ? new Date(settings.created_at) : new Date(now.getTime() - 4 * 86400000);
    const daysSinceStart = Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
    const startLimit = settings.warmup_start_limit || 15;
    const step = settings.warmup_step || 5;
    const stepDays = settings.warmup_step_days || 3;
    const maxLimit = settings.warmup_max_limit || 40; // Max 40/day

    const dailyLimit = Math.min(maxLimit, startLimit + Math.floor(daysSinceStart / stepDays) * step);

    // Count emails sent today (from 00:00 PKT)
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
        .limit(20);
      if (logsData) recentLogs = logsData;
    }

    if (sentToday >= dailyLimit) {
      return res.json({
        status: 'daily_limit_reached',
        message: `Daily warm-up limit reached: ${sentToday}/${dailyLimit} sent today.`,
        sentToday,
        dailyLimit,
      });
    }

    // 5. Evaluate Bounce Safety Guardrail (> 5% bounce rate over last 20 emails)
    const bounceSafety = evaluateBounceSafety(recentLogs);
    if (bounceSafety.shouldPause) {
      inMemoryAutoPaused = true;
      inMemoryAutoPauseReason = bounceSafety.reason;

      if (supabase) {
        await supabase.from('settings').update({
          auto_paused: true,
          auto_pause_reason: bounceSafety.reason,
          updated_at: new Date().toISOString(),
        }).eq('user_id', settings.user_id);
      }

      // Send immediate alert email to Shoaib
      await sendShoaibAlert({
        subject: '🚨 [CRITICAL ALERT] Outreach Auto-Paused Due to Bounce Rate (>5%)',
        text: `Shoaib, your automated outreach has been immediately paused.\n\nReason: ${bounceSafety.reason}\nTotal Bounces: ${bounceSafety.bounces} out of last ${bounceSafety.total} emails.\n\nPlease check your suppression list and email quality before unpausing.`,
        html: `
          <div style="font-family:sans-serif;padding:20px;border:2px solid #ba1a1a;border-radius:10px;background:#fff8f8;">
            <h2 style="color:#ba1a1a;margin-top:0;">🚨 Outreach Auto-Paused for Safety</h2>
            <p><strong>Reason:</strong> ${bounceSafety.reason}</p>
            <p>Bounces detected: <strong>${bounceSafety.bounces} / ${bounceSafety.total}</strong> (exceeds 5% safe threshold).</p>
            <p>All scheduled dispatches are stopped to protect your Gmail sender reputation.</p>
          </div>
        `
      });

      return res.json({
        status: 'auto_paused_triggered',
        error: bounceSafety.reason,
      });
    }

    // Max 1-2 emails per 30-min run so sending spreads gradually across the day
    const remainingToday = dailyLimit - sentToday;
    const batchSize = Math.min(2, Math.max(1, remainingToday));

    // 6. Auto-Discovery: If fewer than 30 new unsent leads, find more automatically
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
      console.log(`[AUTO DISCOVERY] Only ${unsentLeadCount} unsent leads left. Discovering new Pakistan leads...`);
      const cities = ['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Multan', 'Faisalabad'];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      const industries = ['restaurants', 'gyms', 'ecommerce', 'tech'];
      const randomInd = industries[Math.floor(Math.random() * industries.length)];

      try {
        const discovered = await searchOsmLeads({
          city: randomCity,
          industry: randomInd,
          scope: 'pakistan',
          limit: 15,
        });

        for (const item of discovered) {
          // Guardrail: Skip freemail unless CSV
          if (!isAllowedBusinessEmail(item.email, 'osm_overpass')) continue;

          // Guardrail: AI hook validation (max 25 words, no links, prices, numbers, claims)
          let rawHook = '';
          try {
            rawHook = await aiProvider.generatePersonalHook(item, 'Social Media Management');
          } catch (e) {
            rawHook = `I came across ${item.business_name} in ${randomCity} and was impressed by your presence.`;
          }

          const validated = validateAiHook(rawHook, item.business_name);
          const score = calculateLeadScore(item);

          if (supabase) {
            await supabase.from('leads').upsert({
              business_name: item.business_name,
              email: item.email,
              phone: item.phone || '',
              website: item.website || '',
              city: item.city || randomCity,
              country: 'Pakistan',
              lead_score: score,
              service_id: 'social-media',
              status: 'new',
              personal_hook: validated.hook,
              source: 'osm_overpass',
            }, { onConflict: 'email' });
          }
        }
      } catch (err) {
        console.error('[AUTO DISCOVERY ERROR]:', err.message);
      }
    }

    // 7. Select up to 1-2 leads to send: Priority: Day 3 Follow-up -> Day 7 Follow-up -> Day 0 New Lead
    const leadsToSend = [];

    if (supabase) {
      // Check for Day 3 Follow-ups (Contacted >= 3 days ago, no follow-up 1 sent, still 'contacted')
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();
      const { data: followUpsDay3 } = await supabase
        .from('email_logs')
        .select('*, leads(*)')
        .eq('status', 'sent')
        .eq('sequence_step', 0)
        .lte('sent_at', threeDaysAgo)
        .limit(batchSize);

      if (followUpsDay3) {
        for (const log of followUpsDay3) {
          if (log.leads && log.leads.status === 'contacted') {
            leadsToSend.push({
              lead: log.leads,
              step: 1, // Day 3
              inReplyTo: log.message_id,
              threadId: log.thread_id || log.message_id,
            });
            if (leadsToSend.length >= batchSize) break;
          }
        }
      }

      // Check for Day 7 Follow-ups (Follow-up 1 sent >= 4 days ago, still 'contacted')
      if (leadsToSend.length < batchSize) {
        const fourDaysAgo = new Date(now.getTime() - 4 * 86400000).toISOString();
        const { data: followUpsDay7 } = await supabase
          .from('email_logs')
          .select('*, leads(*)')
          .eq('status', 'sent')
          .eq('sequence_step', 1)
          .lte('sent_at', fourDaysAgo)
          .limit(batchSize - leadsToSend.length);

        if (followUpsDay7) {
          for (const log of followUpsDay7) {
            if (log.leads && log.leads.status === 'contacted') {
              leadsToSend.push({
                lead: log.leads,
                step: 2, // Day 7
                inReplyTo: log.message_id,
                threadId: log.thread_id || log.message_id,
              });
              if (leadsToSend.length >= batchSize) break;
            }
          }
        }
      }

      // If no follow-ups due, select top-score unsent Day 0 lead
      if (leadsToSend.length < batchSize) {
        const { data: newLeads } = await supabase
          .from('leads')
          .select('*')
          .eq('status', 'new')
          .neq('email', '')
          .order('lead_score', { ascending: false })
          .limit(batchSize - leadsToSend.length);

        if (newLeads) {
          for (const nl of newLeads) {
            leadsToSend.push({ lead: nl, step: 0 });
          }
        }
      }
    }

    if (leadsToSend.length === 0) {
      return res.json({
        status: 'no_leads_ready',
        message: 'No leads currently ready for dispatch.',
      });
    }

    // 8. Dispatch the Batch (1-2 emails) via Gmail SMTP
    const results = [];
    const sender = settings.gmail_address || process.env.GMAIL_USER || 'Mshoaibuldin371@gmail.com';
    const senderName = settings.sender_name || 'Shoaib ul Din';

    for (const item of leadsToSend) {
      const { lead, step, inReplyTo, threadId } = item;

      // Guardrail: Skip freemail unless CSV
      if (!isAllowedBusinessEmail(lead.email, lead.source)) {
        if (supabase) await supabase.from('leads').update({ status: 'skipped_freemail' }).eq('id', lead.id);
        continue;
      }

      // Guardrail: Suppression check
      if (supabase) {
        const { data: suppressed } = await supabase
          .from('suppression_list')
          .select('*')
          .eq('email', lead.email.toLowerCase())
          .limit(1);
        if (suppressed && suppressed.length > 0) {
          await supabase.from('leads').update({ status: 'suppressed' }).eq('id', lead.id);
          continue;
        }
      }

      // Guardrail: Validate AI opening line
      const validatedHook = validateAiHook(lead.personal_hook, lead.business_name);

      // Compose Sequence Pitch
      let subject = `Quick idea for ${lead.business_name}'s short-form content in ${lead.city || 'Islamabad'}`;
      let text = `Hi ${lead.first_name || lead.contact_name || 'there'},\n\n${validatedHook.hook}\n\nOver the past few months, I helped businesses scale their short-form content on TikTok and Instagram.\n\nPortfolio: https://video-portfolio-572m.vercel.app/\n\nWould you be open to me sending over 2 sample ideas custom-made for ${lead.business_name}?\n\nWhatsApp: https://wa.me/923473547036 (Text me anytime)\n\nBest regards,\nShoaib ul Din\n03473547036`;

      if (step === 1) {
        subject = `Re: Quick idea for ${lead.business_name}'s short-form content`;
        text = `Hi ${lead.first_name || 'there'},\n\nJust bumping this with a quick live sample: https://video-portfolio-572m.vercel.app/\n\nLet me know if you would like 1 free sample reel for ${lead.business_name} this week!\n\nShoaib | 03473547036`;
      } else if (step === 2) {
        subject = `Re: Quick idea for ${lead.business_name}'s short-form content`;
        text = `Hi ${lead.first_name || 'there'},\n\nI won't crowd your inbox further. If you ever want to revamp your reels or social growth, feel free to text me on WhatsApp anytime: https://wa.me/923473547036\n\nAll the best,\nShoaib ul Din`;
      }

      try {
        const sendRes = await sendOutreachEmail({
          userEmail: sender,
          appPassword,
          fromName: senderName,
          to: lead.email,
          subject,
          text,
          inReplyTo: inReplyTo || null,
          references: threadId || null,
        });

        results.push({
          leadId: lead.id,
          recipient: lead.email,
          step,
          messageId: sendRes.messageId,
        });

        // Record in Database
        if (supabase) {
          await supabase.from('email_logs').insert({
            user_id: settings.user_id || 'default-user',
            lead_id: lead.id,
            service_id: lead.service_id || 'social-media',
            message_id: sendRes.messageId,
            thread_id: threadId || sendRes.messageId,
            sequence_step: step,
            subject,
            recipient: lead.email,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });

          await supabase.from('leads').update({
            status: 'contacted',
            updated_at: new Date().toISOString(),
          }).eq('id', lead.id);
        }
      } catch (sendErr) {
        console.error(`[SMTP ERROR on ${lead.email}]:`, sendErr.message);

        // Check for SMTP Authentication or Rate Limit Error -> Auto Pause Immediately
        if (/auth|quota|limit|credentials|535|454/i.test(sendErr.message)) {
          inMemoryAutoPaused = true;
          inMemoryAutoPauseReason = `SMTP Error: ${sendErr.message}`;

          if (supabase) {
            await supabase.from('settings').update({
              auto_paused: true,
              auto_pause_reason: `SMTP Auth/Quota Error: ${sendErr.message}`,
              updated_at: new Date().toISOString(),
            }).eq('user_id', settings.user_id);
          }

          await sendShoaibAlert({
            subject: '🚨 [CRITICAL ALERT] Outreach Auto-Paused: Gmail SMTP Error',
            text: `Shoaib, your automated outreach was paused due to an SMTP error:\n\n${sendErr.message}\n\nPlease check your Gmail App Password and quota.`,
            html: `<p>SMTP Error: <strong>${sendErr.message}</strong>. Sending is paused.</p>`,
          });

          return res.status(500).json({ status: 'auto_paused_smtp_error', error: sendErr.message });
        }

        results.push({ leadId: lead.id, recipient: lead.email, error: sendErr.message });
      }
    }

    res.json({
      status: 'success',
      sentInThisCall: results.filter(r => !r.error).length,
      sentToday: sentToday + results.filter(r => !r.error).length,
      dailyLimit,
      results,
    });
  } catch (err) {
    console.error('[CRON SEND FATAL]:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * /api/cron/replies
 * Runs every 15 minutes to poll Gmail IMAP for replies, bounces, and unsubscribes.
 * Immediately alerts Shoaib for "Interested" replies and stops follow-ups.
 */
router.all('/replies', verifyCronAuth, async (req, res) => {
  try {
    console.log(`[CRON REPLIES] Polling IMAP at ${new Date().toISOString()}`);

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
      for await (const message of client.fetch({ unseen: true }, { envelope: true, source: true })) {
        const parsed = await simpleParser(message.source);
        const fromEmail = parsed.from?.value?.[0]?.address || '';
        const fromName = parsed.from?.value?.[0]?.name || fromEmail;
        const subject = parsed.subject || '';
        const bodyText = parsed.text || '';
        const inReplyTo = parsed.inReplyTo || '';

        // 1. Detect Bounces
        const isBounce = /mailer-daemon|postmaster|delivery status notification|undelivered/i.test(fromEmail) ||
          /failure notice|delivery status/i.test(subject);

        if (isBounce) {
          processedReplies.push({ type: 'bounce', from: fromEmail, subject });

          if (supabase) {
            await supabase.from('suppression_list').upsert({
              user_id: settings.user_id || 'default-user',
              email: fromEmail.toLowerCase(),
              reason: 'bounced',
            }, { onConflict: 'email' });

            await supabase.from('email_logs').update({
              status: 'bounced',
            }).eq('recipient', fromEmail.toLowerCase());
          }
          continue;
        }

        // 2. Classify with Gemini AI
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

        // 3. Stop Sequence & Handle Unsubscribes
        if (classification === 'Unsubscribe') {
          if (supabase) {
            await supabase.from('suppression_list').upsert({
              user_id: settings.user_id || 'default-user',
              email: fromEmail.toLowerCase(),
              reason: 'unsubscribed',
            }, { onConflict: 'email' });

            await supabase.from('leads').update({
              status: 'unsubscribed',
              updated_at: new Date().toISOString(),
            }).eq('email', fromEmail.toLowerCase());
          }
          continue;
        }

        // 4. Update Lead Status
        if (supabase) {
          await supabase.from('leads').update({
            status: classification === 'Interested' ? 'interested' : 'replied',
            updated_at: new Date().toISOString(),
          }).eq('email', fromEmail.toLowerCase());
        }

        // 5. Send Immediate Alert for "Interested" Leads
        if (classification === 'Interested') {
          await sendShoaibAlert({
            subject: `🔥 [HOT LEAD ALERT] ${fromName} replied "Interested" to your outreach!`,
            text: `Assalam o Alaikum Shoaib,\n\n${fromName} (${fromEmail}) just responded with interest!\n\nSubject: ${subject}\n\nMessage:\n${bodyText.slice(0, 400)}\n\nQuick reply via Gmail or text them on WhatsApp!\n\nReachOut AI Automation`,
            html: `
              <div style="font-family:sans-serif;padding:20px;border:2px solid #0038b1;border-radius:10px;background:#f0f4ff;">
                <h2 style="color:#0038b1;margin-top:0;">🔥 HOT LEAD ALERT: Interested Prospect!</h2>
                <p><strong>From:</strong> ${fromName} (${fromEmail})</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <div style="background:#ffffff;padding:12px;border-radius:8px;border:1px solid #dae2fd;margin:12px 0;">
                  <p style="margin:0;font-style:italic;">"${bodyText.slice(0, 400)}..."</p>
                </div>
                <p>Log in to your ReachOut Inbox to respond, or reply directly from your Gmail.</p>
              </div>
            `,
          });
        }
      }
    } finally {
      lock.release();
      await client.logout();
    }

    res.json({
      status: 'success',
      processedCount: processedReplies.length,
      replies: processedReplies,
    });
  } catch (err) {
    console.error('[CRON REPLIES ERROR]:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * /api/cron/daily-summary
 * Runs every day at 20:00 Asia/Karachi (15:00 UTC).
 * Sends an executive telemetry email to Shoaib: sent, replies, bounces, clicks, errors, leads left.
 */
router.all('/daily-summary', verifyCronAuth, async (req, res) => {
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
      const { count: sCount } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .gte('sent_at', utcMidnight);
      sentCount = sCount || 0;

      const { count: bCount } = await supabase
        .from('suppression_list')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', utcMidnight);
      bounceCount = bCount || 0;

      const { count: rCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('status', ['replied', 'interested'])
        .gte('updated_at', utcMidnight);
      replyCount = rCount || 0;

      const { count: cCount } = await supabase
        .from('link_clicks')
        .select('*', { count: 'exact', head: true })
        .gte('clicked_at', utcMidnight);
      clickCount = cCount || 0;

      const { count: uCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
        .neq('email', '');
      unsentLeads = uCount || 0;
    }

    const summaryHtml = `
      <div style="font-family:sans-serif;max-width:580px;padding:24px;border:1px solid #dae2fd;border-radius:12px;background:#faf8ff;">
        <h2 style="color:#0038b1;margin-top:0;">📊 ReachOut Daily Executive Summary</h2>
        <p style="color:#515f74;font-size:14px;">Telemetry report for ${pktDate.toDateString()} (20:00 Asia/Karachi)</p>
        
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
            <span style="font-size:11px;color:#747686;text-transform:uppercase;">Bounces Today</span>
            <h3 style="margin:4px 0 0;font-size:22px;color:${bounceCount > 0 ? '#ba1a1a' : '#515f74'};">${bounceCount}</h3>
          </div>
        </div>

        <div style="background:#ffffff;padding:14px;border-radius:8px;border:1px solid #eaedff;margin-bottom:16px;">
          <p style="margin:0;font-size:13px;color:#131b2e;"><strong>Unsent Leads in Queue:</strong> ${unsentLeads} prospects ready</p>
          <p style="margin:4px 0 0;font-size:13px;color:#131b2e;"><strong>System Status:</strong> ${settings.auto_paused ? '⚠️ Auto-Paused' : '✅ Active & Healthy'}</p>
        </div>

        <p style="font-size:12px;color:#747686;margin-bottom:0;">Automated 24/7 report from ReachOut Cloud Engine.</p>
      </div>
    `;

    await sendShoaibAlert({
      subject: `📊 ReachOut Daily Summary: ${sentCount} sent, ${replyCount} replies, ${clickCount} clicks`,
      text: `Daily Summary (${pktDate.toDateString()}):\n- Sent Today: ${sentCount}\n- Replies: ${replyCount}\n- Portfolio Clicks: ${clickCount}\n- Bounces: ${bounceCount}\n- Leads Left in Queue: ${unsentLeads}\n- System Status: ${settings.auto_paused ? 'Auto-Paused' : 'Active'}`,
      html: summaryHtml,
    });

    res.json({
      status: 'success',
      sentCount,
      replyCount,
      bounceCount,
      clickCount,
      unsentLeads,
    });
  } catch (err) {
    console.error('[DAILY SUMMARY ERROR]:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/cron/status
 * Returns system health, warm-up status, auto-pause banner status
 */
router.get('/status', async (req, res) => {
  try {
    const { settings } = await resolveSettings();
    res.json({
      success: true,
      auto_paused: settings.auto_paused,
      auto_pause_reason: settings.auto_pause_reason,
      pause_all: settings.pause_all,
      approval_mode: settings.approval_mode,
      warmup: {
        start: settings.warmup_start_limit || 15,
        step: settings.warmup_step || 5,
        max: settings.warmup_max_limit || 40,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
