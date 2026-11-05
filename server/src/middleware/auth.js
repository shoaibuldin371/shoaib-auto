import { supabase } from '../config/supabase.js';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'Mshoaibuldin371@gmail.com').toLowerCase().trim();

/**
 * Express middleware to protect all private /api routes.
 * 1. Requires a valid Supabase JWT Bearer token.
 * 2. Verifies that the authenticated user's email === ADMIN_EMAIL.
 * Returns 401 for missing/invalid token, 403 for unauthorized email.
 */
export async function requireAdminAuth(req, res, next) {
  // Public exempt routes:
  // - /r/:id (click tracking redirect)
  // - /api/health (public ping)
  // - /api/cron/* (protected separately by x-cron-secret)
  if (
    req.path.startsWith('/cron') ||
    req.baseUrl.startsWith('/r') ||
    req.path === '/health'
  ) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Authorization Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client is not configured on server.' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid, expired, or revoked Supabase JWT.',
      });
    }

    const userEmail = (user.email || '').toLowerCase().trim();
    if (userEmail !== ADMIN_EMAIL) {
      return res.status(403).json({
        error: `Forbidden: Email ${userEmail} is not authorized. Access restricted to ReachOut administrator (${ADMIN_EMAIL}).`,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: `Auth validation failed: ${err.message}` });
  }
}

