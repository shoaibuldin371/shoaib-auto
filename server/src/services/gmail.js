import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';

/**
 * Creates an SMTP transporter configured for Gmail
 */
export function createSmtpTransporter(userEmail, appPassword) {
  // Normalize app password (remove spaces if user entered them with spaces)
  const cleanPassword = (appPassword || '').replace(/\s+/g, '');
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for port 465
    auth: {
      user: userEmail,
      pass: cleanPassword,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });
}

/**
 * Test SMTP connection and credentials
 */
export async function testSmtpConnection(userEmail, appPassword) {
  try {
    const transporter = createSmtpTransporter(userEmail, appPassword);
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully' };
  } catch (err) {
    console.error('SMTP test error:', err);
    return { success: false, error: err.message || 'Failed to authenticate with Gmail SMTP' };
  }
}

/**
 * Test IMAP connection and credentials
 */
export async function testImapConnection(userEmail, appPassword) {
  const cleanPassword = (appPassword || '').replace(/\s+/g, '');
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: userEmail,
      pass: cleanPassword,
    },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      // Verify inbox access
      await client.status('INBOX', { messages: true });
    } finally {
      lock.release();
    }
    await client.logout();
    return { success: true, message: 'IMAP connection verified successfully' };
  } catch (err) {
    console.error('IMAP test error:', err);
    return { success: false, error: err.message || 'Failed to authenticate with Gmail IMAP' };
  }
}

/**
 * Send an email through user's Gmail SMTP.
 * Note: Gmail SMTP automatically saves a copy in the user's "Sent" folder.
 */
export async function sendOutreachEmail({
  userEmail,
  appPassword,
  fromName = 'Shoaib ul Din',
  to,
  subject,
  html,
  text,
  inReplyTo = null,
  references = null,
  bcc = null,
}) {
  const transporter = createSmtpTransporter(userEmail, appPassword);

  const mailOptions = {
    from: `"${fromName}" <${userEmail}>`,
    to: to,
    subject: subject,
    text: text,
    html: html,
    headers: {},
  };

  if (inReplyTo) {
    mailOptions.inReplyTo = inReplyTo;
    mailOptions.headers['In-Reply-To'] = inReplyTo;
  }

  if (references) {
    mailOptions.references = references;
    mailOptions.headers['References'] = references;
  }

  if (bcc) {
    mailOptions.bcc = bcc;
  }

  const result = await transporter.sendMail(mailOptions);
  return {
    success: true,
    messageId: result.messageId,
    response: result.response,
    accepted: result.accepted,
  };
}
