# ReachOut — AI Cold-Outreach Automation Dashboard

A full-stack cold-outreach automation system built for **Shoaib ul Din** (Islamabad, Pakistan), featuring multi-channel sequence management, personalized AI hooks via Google Gemini, personal Gmail SMTP/IMAP integration with automatic Sent folder archiving, and deliverability monitoring.

---

## Tech Stack & Architecture

- **Frontend**: React 19, Vite, Tailwind CSS with the **Kinetic Blue SaaS** design tokens extracted from Stitch (`stitch_designs/DESIGN.md`), Inter typography, and Material Symbols.
- **Backend**: Node.js & Express configured for local development and Vercel Serverless Functions (`/api`).
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security enabled on all 14 tables, Supabase Auth).
- **Email Delivery**: Personal Gmail SMTP (`smtp.gmail.com:465` SSL) via `nodemailer`. All sent emails are automatically saved in the user's Gmail "Sent" folder. Threading maintained with `In-Reply-To` and `References` headers.
- **Reply & Bounce Tracking**: Gmail IMAP (`imap.gmail.com:993`) via `imapflow` and `mailparser`.
- **AI Personalization**: Google Gemini API (`@google/generative-ai`) for personalized opening hooks, smart service matching, and reply classification (Interested / Not interested / Question / Out of office / Unsubscribe).
- **Scheduler**: Zero-cost serverless triggers using GitHub Actions scheduled workflows (`.github/workflows/cron-send.yml` and `cron-replies.yml`) calling protected endpoints `/api/cron/send` and `/api/cron/replies`.

---

## The 4 Outreach Services

Each service has its own dedicated campaign pipeline, email templates (initial + 2 follow-ups), and editable experience claims:

1. **Social Media Management**
   - Default Experience: `4 months` (editable in Settings)
   - Mandatory Proof-of-Work: TikTok (`https://www.tiktok.com/@syed_ali_azzam`) and Facebook page URL (`facebook_url` in Settings)
2. **Video Editing (Short-Form & Reels)**
   - Default Experience: `3 years` (editable in Settings)
   - Portfolio: `https://video-portfolio-572m.vercel.app/`
3. **AI Video Creation**
   - Default Experience: `4 months` (editable in Settings)
   - Portfolio: `https://video-portfolio-572m.vercel.app/`
4. **Product Management & Coordination**
   - Default Experience: `4 months` (editable in Settings)
   - Portfolio / Case Study: `https://github.com/shoaib`

---

## Database Migrations (Supabase)

Located in `supabase/migrations/`:
- `20261105000000_initial_schema.sql`: 14 tables with Row Level Security (RLS) policies:
  - `profiles`, `settings`, `services`, `leads`, `lead_channels`, `campaigns`, `templates`, `email_queue`, `email_logs`, `replies`, `manual_tasks`, `link_clicks`, `suppression_list`, `activity_log`.
- `20261105000001_seed_data.sql`: Seeds user setup trigger, the 4 services with exact experience defaults, campaigns, and initial email templates with 3 A/B test subject line variants.

---

## Gmail App Password Setup

1. Enable 2-Step Verification on your Google Account (`Mshoaibuldin371@gmail.com`).
2. Visit [Google App Passwords](https://myaccount.google.com/apppasswords).
3. Create an app named **ReachOut** and copy the 16-character code.
4. Ensure IMAP is enabled in **Gmail Settings > Forwarding and POP/IMAP > Enable IMAP**.
5. In ReachOut Settings, enter your App Password, click **Test Connection**, and click **Send Test Email**.

---

## Deployment & Cron Triggering

- **Vercel**: Deploy the repo to Vercel (`https://vercel.com/mshoaibawan371`).
- **GitHub Secrets**: Set `VERCEL_APP_URL` and `CRON_SECRET` in repo secrets.
  - Morning Run: 10:00 Asia/Karachi (05:00 UTC)
  - Afternoon Run: 16:00 Asia/Karachi (11:00 UTC)
  - IMAP Reply Poller: Every 10 minutes (`*/10 * * * *`)
  - *Note: GitHub Actions cron may have minor queue delays. You can also configure a free monitor on [cron-job.org](https://cron-job.org) hitting `https://<your-domain>/api/cron/send` and `https://<your-domain>/api/cron/replies` with header `x-cron-secret: <CRON_SECRET>`.*

