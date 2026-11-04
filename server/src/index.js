import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import settingsRouter from './routes/settings.js';
import servicesRouter from './routes/services.js';
import cronRouter from './routes/cron.js';
import leadsRouter from './routes/leads.js';
import redirectRouter from './routes/redirect.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-secret']
}));

app.use(express.json());

// Routes
app.use('/api/settings', settingsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/cron', cronRouter);
app.use('/api/leads', leadsRouter);
app.use('/r', redirectRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'ReachOut AI Automation Backend',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`ReachOut server running on http://localhost:${PORT}`);
  });
}

export default app;

