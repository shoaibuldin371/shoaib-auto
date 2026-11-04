import express from 'express';
import { supabase } from '../config/supabase.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { testSmtpConnection, testImapConnection, sendOutreachEmail } from '../services/gmail.js';

const router = express.Router();

// Fallback in-memory settings for local testing before Supabase credentials are wired
let localSettings = {
  user_id: 'default-user',
  sender_name: 'Shoaib ul Din',
  sender_email: 'Mshoaibuldin371@gmail.com',
  sender_phone: '03473547036',
  sender_location: 'Islamabad, Pakistan',
  facebook_url: 'https://facebook.com/shoaib.media',
  video_portfolio_url: 'https://video-portfolio-572m.vercel.app/',
  ai_video_portfolio_url: 'https://video-portfolio-572m.vercel.app/',
  pm_case_study_url: 'https://github.com/shoaib',
  calendly_link: '',
  daily_manual_goal: 20,
  warmup_start_limit: 15,
  warmup_step: 5,
  warmup_step_days: 3,
  warmup_max_limit: 50,
  send_window_start: '09:00',
  send_window_end: '18:00',
  send_runs: ['10:00', '16:00'],
  skip_sundays: true,
  min_delay_sec: 45,
  max_delay_sec: 150,
  bcc_self: false,
  dry_run_mode: false,
  approval_mode: true,
  pause_all: false,
  gmail_address: 'Mshoaibuldin371@gmail.com',
  gmail_app_password_encrypted: process.env.GMAIL_APP_PASSWORD ? encrypt(process.env.GMAIL_APP_PASSWORD) : '',
  gmail_is_connected: Boolean(process.env.GMAIL_APP_PASSWORD),
};

/**
 * GET /api/settings
 */
router.get('/', async (req, res) => {
  try {
    let settings = { ...localSettings };

    if (supabase) {
      const { data, error } = await supabase.from('settings').select('*').limit(1).single();
      if (!error && data) {
        settings = { ...data };
      }
    }

    // Never return the raw encrypted password to the frontend, only a masked status
    const hasPassword = Boolean(settings.gmail_app_password_encrypted);
    res.json({
      ...settings,
      has_app_password: hasPassword,
      gmail_app_password_masked: hasPassword ? '••••••••••••••••' : '',
      gmail_app_password_encrypted: undefined, // Strip raw ciphertext
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/settings
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const updates = { ...body };

    // If new app password was provided, encrypt it
    if (updates.gmail_app_password) {
      updates.gmail_app_password_encrypted = encrypt(updates.gmail_app_password.trim());
      delete updates.gmail_app_password;
    } else {
      delete updates.gmail_app_password;
    }

    delete updates.gmail_app_password_masked;
    delete updates.has_app_password;

    localSettings = { ...localSettings, ...updates };

    if (supabase) {
      await supabase.from('settings').upsert({
        user_id: updates.user_id || localSettings.user_id,
        ...updates,
        updated_at: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      settings: {
        ...localSettings,
        has_app_password: Boolean(localSettings.gmail_app_password_encrypted),
        gmail_app_password_masked: localSettings.gmail_app_password_encrypted ? '••••••••••••••••' : '',
        gmail_app_password_encrypted: undefined,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/settings/test-gmail
 * Test SMTP and IMAP connection
 */
router.post('/test-gmail', async (req, res) => {
  try {
    const { email, appPassword } = req.body;
    const targetEmail = email || localSettings.gmail_address || 'Mshoaibuldin371@gmail.com';
    
    // Resolve password: provided in body or decrypted from stored settings
    let pass = appPassword;
    if (!pass && localSettings.gmail_app_password_encrypted) {
      pass = decrypt(localSettings.gmail_app_password_encrypted);
    }

    if (!pass) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a 16-character Gmail App Password.',
      });
    }

    // 1. Test SMTP
    const smtpResult = await testSmtpConnection(targetEmail, pass);
    if (!smtpResult.success) {
      return res.status(400).json({
        success: false,
        step: 'smtp',
        error: `SMTP Error: ${smtpResult.error}`,
      });
    }

    // 2. Test IMAP
    const imapResult = await testImapConnection(targetEmail, pass);
    if (!imapResult.success) {
      return res.status(400).json({
        success: false,
        step: 'imap',
        error: `IMAP Error: ${imapResult.error}. Make sure IMAP is enabled in Gmail Settings > Forwarding and POP/IMAP.`,
      });
    }

    // If both succeed, mark as connected
    localSettings.gmail_is_connected = true;
    localSettings.gmail_address = targetEmail;
    if (appPassword) {
      localSettings.gmail_app_password_encrypted = encrypt(appPassword);
    }

    if (supabase) {
      await supabase.from('settings').upsert({
        user_id: localSettings.user_id,
        gmail_address: targetEmail,
        gmail_app_password_encrypted: localSettings.gmail_app_password_encrypted,
        gmail_is_connected: true,
        updated_at: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: 'Both SMTP and IMAP verified successfully! Emails will be sent from and saved to your Sent folder, and replies will be tracked.',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/settings/send-test-email
 * Sends a live test email via Gmail SMTP
 */
router.post('/send-test-email', async (req, res) => {
  try {
    const { toEmail, customSubject } = req.body;
    const recipient = toEmail || localSettings.sender_email || 'Mshoaibuldin371@gmail.com';
    const senderEmail = localSettings.gmail_address || 'Mshoaibuldin371@gmail.com';

    let pass = '';
    if (localSettings.gmail_app_password_encrypted) {
      pass = decrypt(localSettings.gmail_app_password_encrypted);
    } else if (process.env.GMAIL_APP_PASSWORD) {
      pass = process.env.GMAIL_APP_PASSWORD;
    }

    if (!pass) {
      return res.status(400).json({
        success: false,
        error: 'No Gmail App Password configured. Please enter and save your Gmail App Password first.',
      });
    }

    const subject = customSubject || 'ReachOut Test Email — Cold Outreach System';
    const text = `Hi Shoaib,\n\nThis is a verified test email from your ReachOut AI Automation system.\n\nYour Gmail SMTP is functioning properly. Because this was sent via smtp.gmail.com:465, a copy has been automatically saved into your Gmail "Sent" folder.\n\nBest regards,\nShoaib ul Din\nIslamabad | 03473547036`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #131b2e; max-width: 580px; padding: 24px; border: 1px solid #dae2fd; border-radius: 12px; background: #faf8ff;">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0; color: #0038b1; font-size: 20px;">ReachOut System Test</h2>
        </div>
        <p style="font-size: 15px; line-height: 1.6;">Hi Shoaib,</p>
        <p style="font-size: 15px; line-height: 1.6;">This is a verified test email from your <strong>ReachOut AI Automation</strong> outreach system.</p>
        <div style="background: #ffffff; border: 1px solid #eaedff; border-radius: 8px; padding: 14px; margin: 16px 0;">
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #515f74;"><strong>Verification Details:</strong></p>
          <p style="margin: 0 0 4px 0; font-size: 13px;">Sender: <code>${senderEmail}</code></p>
          <p style="margin: 0 0 4px 0; font-size: 13px;">Recipient: <code>${recipient}</code></p>
          <p style="margin: 0; font-size: 13px;">Sent Folder Copy: <strong>Automatic via Gmail SMTP (465)</strong></p>
        </div>
        <p style="font-size: 14px; color: #515f74; line-height: 1.5;">Best regards,<br/><strong>Shoaib ul Din</strong><br/>Islamabad | 03473547036</p>
      </div>
    `;

    const sendResult = await sendOutreachEmail({
      userEmail: senderEmail,
      appPassword: pass,
      fromName: localSettings.sender_name || 'Shoaib ul Din',
      to: recipient,
      subject: subject,
      text: text,
      html: html,
    });

    res.json({
      success: true,
      message: `Test email dispatched successfully to ${recipient}! Check your inbox and your Gmail "Sent" folder.`,
      details: sendResult,
    });
  } catch (err) {
    console.error('Send test email error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

