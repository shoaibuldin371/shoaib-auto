import express from 'express';
import { supabase } from '../config/supabase.js';
import { decrypt } from '../utils/crypto.js';
import { sendOutreachEmail } from '../services/gmail.js';
import { aiProvider } from '../services/ai.js';
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

        const sendRes = await sendOutreachEmail({
          userEmail: settings.gmail_address || 'Mshoaibuldin371@gmail.com',
          appPassword: appPassword,
          fromName: settings.sender_name || 'Shoaib ul Din',
          to: item.leads.email,
          subject: item.subject,
          text: item.body,
          inReplyTo: item.in_reply_to,
          references: item.thread_id,
          bcc: settings.bcc_self ? settings.gmail_address : null,
        });

        results.push({ id: item.id, recipient: item.leads.email, messageId: sendRes.messageId });

        if (supabase) {
          await supabase.from('email_queue').update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          }).eq('id', item.id);

          await supabase.from('email_logs').insert({
            user_id: item.user_id,
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

export default router;

