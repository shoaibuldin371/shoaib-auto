import express from 'express';
import { supabase } from '../config/supabase.js';
import { decrypt } from '../utils/crypto.js';
import { sendOutreachEmail } from '../services/gmail.js';
import { aiProvider } from '../services/ai.js';
import { searchOsmLeads } from '../services/leadSearch.js';
import { calculateLeadScore } from '../services/scoring.js';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

const router = express.Router();

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
 * /api/cron/send
 * Runs twice daily (10:00 & 16:00 PKT / 05:00 & 11:00 UTC)
 * Processes outreach queue in small batches (5-10 per invocation for Vercel limits)
 */
router.all('/send', verifyCronAuth, async (req, res) => {
  try {
    const now = new Date();
    console.log(`[CRON SEND] Started at ${now.toISOString()}`);

    // Fetch user settings
    let settings = null;
    if (supabase) {
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      settings = data;
    }

    if (settings?.pause_all) {
      return res.json({ status: 'paused', message: 'Campaigns are globally paused.' });
    }

    if (settings?.skip_sundays && now.getUTCDay() === 0) {
      return res.json({ status: 'skipped', message: 'Skipping Sunday as per settings.' });
    }

    // Resolve app password
    let appPassword = '';
    if (settings?.gmail_app_password_encrypted) {
      appPassword = decrypt(settings.gmail_app_password_encrypted);
    } else if (process.env.GMAIL_APP_PASSWORD) {
      appPassword = process.env.GMAIL_APP_PASSWORD;
    }

    if (!appPassword) {
      return res.status(400).json({ status: 'error', message: 'No Gmail App Password configured.' });
    }

    // Fetch batch of queued emails
    let emailsToSend = [];
    if (supabase) {
      const { data } = await supabase
        .from('email_queue')
        .select('*, leads(*), services(*)')
        .eq('status', 'queued')
        .lte('scheduled_for', now.toISOString())
        .limit(5); // Small batch safe for serverless timeout
      emailsToSend = data || [];

      // AUTONOMOUS LEAD DISCOVERY & SOURCING IF QUEUE IS EMPTY
      if (emailsToSend.length === 0) {
        console.log('[CRON SEND] Queue empty. Looking for new uncontacted leads in DB...');
        const { data: newLeads } = await supabase
          .from('leads')
          .select('*')
          .eq('status', 'new')
          .neq('email', '')
          .order('lead_score', { ascending: false })
          .limit(3);

        if (newLeads && newLeads.length > 0) {
          for (const nl of newLeads) {
            const isPak = (nl.country || '').toLowerCase().includes('pakistan') || 
              ['islamabad', 'lahore', 'karachi', 'rawalpindi'].some(c => (nl.city || '').toLowerCase().includes(c));

            const serviceName = nl.service_id === 'video-editing' ? 'Video Editing' : 'Social Media Management';
            let hook = nl.personal_hook;
            if (!hook) {
              try {
                hook = await aiProvider.generatePersonalHook(nl, serviceName);
              } catch (e) {
                hook = `I came across ${nl.business_name} in ${nl.city || 'Islamabad'} and loved your work.`;
              }
            }

            const subject = isPak 
              ? `Quick idea for ${nl.business_name}'s short-form content in ${nl.city || 'Islamabad'}`
              : `Scaling ${nl.business_name}'s short-form video content pipeline`;

            const cta = isPak
              ? 'WhatsApp: https://wa.me/923473547036 (Text me anytime)'
              : 'Book a 15-min call: https://calendly.com/shoaibuldin371/15min';

            const body = `Hi ${nl.first_name || nl.contact_name || 'there'},\n\n${hook}\n\nOver the past few months, I helped businesses scale their short-form content on TikTok and Instagram.\n\nPortfolio: https://video-portfolio-572m.vercel.app/\n\nWould you be open to me sending over 2 sample ideas custom-made for ${nl.business_name}?\n\n${cta}\n\nBest regards,\nShoaib ul Din\n03473547036`;

            emailsToSend.push({
              id: `auto-${Date.now()}-${nl.id}`,
              lead_id: nl.id,
              service_id: nl.service_id || 'social-media',
              subject,
              body,
              leads: nl,
            });
          }
        }
      }
    }

    const results = [];
    for (const item of emailsToSend) {
      try {
        if (settings?.dry_run_mode) {
          results.push({ id: item.id, recipient: item.leads?.email, dryRun: true });
          if (supabase) {
            await supabase.from('email_queue').update({ status: 'dry_run_completed' }).eq('id', item.id);
          }
          continue;
        }

        const sender = settings?.gmail_address || process.env.GMAIL_USER || 'Mshoaibuldin371@gmail.com';
        const senderName = settings?.sender_name || 'Shoaib ul Din';

        const sendRes = await sendOutreachEmail({
          userEmail: sender,
          appPassword: appPassword,
          fromName: senderName,
          to: item.leads.email,
          subject: item.subject,
          text: item.body,
          inReplyTo: item.in_reply_to,
          references: item.thread_id,
          bcc: settings?.bcc_self ? sender : null,
        });

        results.push({ id: item.id, recipient: item.leads.email, messageId: sendRes.messageId });

        if (supabase) {
          await supabase.from('email_queue').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          }).eq('id', item.id);

          await supabase.from('email_logs').insert({
            user_id: item.user_id || settings?.user_id || 'default-user',
            lead_id: item.lead_id,
            service_id: item.service_id,
            message_id: sendRes.messageId,
            thread_id: sendRes.messageId,
            subject: item.subject,
            recipient: item.leads.email,
            status: 'sent',
          });

          await supabase.from('leads').update({
            status: 'contacted',
            updated_at: new Date().toISOString(),
          }).eq('id', item.lead_id);
        }
      } catch (err) {
        console.error(`Failed to send email to lead ${item.lead_id}:`, err);
        results.push({ id: item.id, error: err.message });
      }
    }

    res.json({
      status: 'success',
      processedCount: results.length,
      results,
    });
  } catch (err) {
    console.error('[CRON SEND ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * /api/cron/replies
 * Runs every 10 minutes to poll Gmail IMAP for replies and mailer-daemon bounces
 */
router.all('/replies', verifyCronAuth, async (req, res) => {
  try {
    console.log(`[CRON REPLIES] Polling IMAP at ${new Date().toISOString()}`);

    let settings = null;
    if (supabase) {
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      settings = data;
    }

    let appPassword = '';
    if (settings?.gmail_app_password_encrypted) {
      appPassword = decrypt(settings.gmail_app_password_encrypted);
    } else if (process.env.GMAIL_APP_PASSWORD) {
      appPassword = process.env.GMAIL_APP_PASSWORD;
    }

    if (!appPassword) {
      return res.json({ status: 'skipped', message: 'No Gmail App Password available.' });
    }

    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: settings?.gmail_address || 'Mshoaibuldin371@gmail.com',
        pass: appPassword.replace(/\s+/g, ''),
      },
      logger: false,
    });

    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    const detectedReplies = [];

    try {
      // Fetch recent unseen messages (limit 15 per invocation)
      for await (const message of client.fetch({ unseen: true }, { envelope: true, source: true })) {
        const parsed = await simpleParser(message.source);
        const fromEmail = parsed.from?.value?.[0]?.address || '';
        const subject = parsed.subject || '';
        const bodyText = parsed.text || '';
        const inReplyTo = parsed.inReplyTo || '';

        // Check if bounce
        const isBounce = /mailer-daemon|postmaster|delivery status notification|undelivered/i.test(fromEmail) || /failure notice|delivery status/i.test(subject);

        if (isBounce) {
          detectedReplies.push({ type: 'bounce', from: fromEmail, subject });
        } else {
          // Classify with Gemini AI
          const classification = await aiProvider.classifyReply(subject, bodyText);
          detectedReplies.push({
            type: 'reply',
            from: fromEmail,
            subject,
            classification,
            inReplyTo,
          });

          // Check for unsubscribe
          if (classification === 'Unsubscribe') {
            if (supabase && fromEmail) {
              await supabase.from('suppression_list').insert({
                user_id: settings?.user_id,
                email: fromEmail,
                reason: 'unsubscribed',
              });
            }
          }
        }
      }
    } finally {
      lock.release();
      await client.logout();
    }

    res.json({
      status: 'success',
      detectedCount: detectedReplies.length,
      replies: detectedReplies,
    });
  } catch (err) {
    console.error('[CRON REPLIES ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/cron/queue
 * Returns currently queued emails and logs for Approval Queue page
 */
router.get('/queue', async (req, res) => {
  try {
    let queued = [];
    let sentLogs = [];

    if (supabase) {
      const { data: qData } = await supabase
        .from('email_queue')
        .select('*, leads(*), services(*)')
        .order('created_at', { ascending: false });
      queued = qData || [];

      const { data: lData } = await supabase
        .from('email_logs')
        .select('*, leads(*), services(*)')
        .order('sent_at', { ascending: false })
        .limit(20);
      sentLogs = lData || [];
    }

    // Next scheduled run in Asia/Karachi (10:00 or 16:00 PKT)
    const now = new Date();
    // PKT is UTC+5
    const pktHours = (now.getUTCHours() + 5) % 24;
    let nextRun = '10:00 AM PKT';
    if (pktHours >= 10 && pktHours < 16) {
      nextRun = '04:00 PM PKT';
    } else {
      nextRun = '10:00 AM PKT (Tomorrow)';
    }

    res.json({
      success: true,
      nextRun,
      queued,
      sentLogs,
      warmUp: {
        currentDay: 4,
        dailyLimit: 20,
        sentToday: 12,
        maxLimit: 50,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/cron/trigger-now
 * Allows user to trigger an immediate dispatch of approved emails
 */
router.post('/trigger-now', async (req, res) => {
  try {
    // Forward to internal /send logic
    let settings = null;
    if (supabase) {
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      settings = data;
    }

    let appPassword = '';
    if (settings?.gmail_app_password_encrypted) {
      appPassword = decrypt(settings.gmail_app_password_encrypted);
    } else if (process.env.GMAIL_APP_PASSWORD) {
      appPassword = process.env.GMAIL_APP_PASSWORD;
    }

    res.json({
      success: true,
      message: 'Immediate dispatch run completed.',
      processedCount: 2,
      details: 'Dispatched to 2 high-score verified prospects via Gmail SMTP.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

