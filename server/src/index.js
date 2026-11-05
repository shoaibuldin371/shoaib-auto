import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requireAdminAuth } from './middleware/auth.js';
import settingsRouter from './routes/settings.js';
import servicesRouter from './routes/services.js';
import cronRouter from './routes/cron.js';
import leadsRouter from './routes/leads.js';
import redirectRouter from './routes/redirect.js';

dotenv.config();

const app = express();

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-secret']
}));

app.use(express.json({ limit: '1mb' }));

// Public click tracking redirect
app.use('/r', redirectRouter);

// Public health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'ReachOut AI Automation Backend',
    timestamp: new Date().toISOString()
  });
});

// Cron endpoints (protected by CRON_SECRET or Admin session)
app.use('/api/cron', cronRouter);

// Protected admin endpoints (require valid Supabase JWT for ADMIN_EMAIL)
app.use('/api/settings', requireAdminAuth, settingsRouter);
app.use('/api/services', requireAdminAuth, servicesRouter);
app.use('/api/leads', requireAdminAuth, leadsRouter);

const PORT = process.env.PORT || 5000;

const isDirectRun = Boolean(process.argv[1] && /index\.js$/i.test(process.argv[1]));

if ((process.env.NODE_ENV !== 'production' || !process.env.VERCEL) && isDirectRun) {
  app.listen(PORT, () => {
    console.log(`ReachOut server running on http://localhost:${PORT}`);
  });
}

export default app;

