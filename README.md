# ReachOut — Autonomous AI Cold-Outreach System

A full-stack cold-outreach automation system built for **Shoaib ul Din** (Islamabad, Pakistan), designed to operate **100% autonomously in the cloud** without requiring an open laptop or local execution.

---

## 1. Cloud Architecture & Zero-Cost Scheduling

The platform runs completely on cloud serverless infrastructure:

```
[cron-job.org] (Every 15m) ──► /api/cron/replies  (IMAP reply & bounce tracker)
[GitHub Actions] (Every 30m) ──► /api/cron/send     (Dispatches 1-2 emails, 10-18 PKT)
[GitHub Actions] (Daily 20:00) ──► /api/cron/daily-summary (Summary email to Shoaib)
[Vercel Crons] (Daily 04:00) ──► /api/cron/health   (Supabase keep-alive ping)
```

- **Vercel Hobby Plan Compliance**: Vercel Hobby strictly enforces daily-only crons. Therefore, `vercel.json` contains only one daily cron (`/api/cron/health` at `0 4 * * *`) to keep your free Supabase instance active.
- **GitHub Actions Usage**: Scheduled in `.github/workflows/cron-send.yml` (`*/30 5-13 * * 1-6` PKT 10:00–18:00 Mon–Sat) and `.github/workflows/cron-summary.yml`. Total monthly execution is ~120 minutes, well within the 2,000 free minutes/month limit.
- **cron-job.org Setup (for IMAP Replies)**:
  1. Create a free account at [cron-job.org](https://cron-job.org).
  2. Click **Create Cronjob**.
  3. **Title**: `ReachOut IMAP Replies`
  4. **URL**: `https://<YOUR_VERCEL_DOMAIN>/api/cron/replies`
  5. **Schedule**: Every 15 minutes (`*/15 * * * *`).
  6. Under **Advanced / Headers**, add:
     - Header Name: `x-cron-secret`
     - Header Value: `<YOUR_CRON_SECRET>`
  7. Save. This polls Gmail IMAP every 15 minutes, classifies incoming responses with Gemini AI, halts follow-ups, and alerts you instantly for hot leads.

---

## 2. Server-Side Safety Guardrails

- **Approval Mode OFF by Default**: Outreach operates autonomously. Manual approval remains available as an optional toggle in Settings.
- **AI Hook Validation**: Opening lines are strictly limited to 25 words with no URLs, no prices/currency (`$`, `PKR`, `Rs`), no client/result claims (`100k`, `10x`, `ROI`), and no hardcoded experience claims. If any check fails, the clean generic opener is used.
- **Freemail Filter**: Skips `@gmail.com`, `@yahoo.com`, `@hotmail.com`, etc., and only reaches public business domain emails (unless imported via CSV).
- **Bounce Rate Auto-Pause**: Evaluated after at least 20 sent emails. If bounce rate exceeds 5% (>1 bounce in 20) or if SMTP returns an authentication/quota error:
  - All automated sending is halted immediately.
  - An emergency alert email is sent to your inbox.
  - A red alert banner displaying the exact bounced addresses appears in the Dashboard.
- **Warm-Up Pacing**: Server-side enforced using database logs (15 emails/day, +5 every 3 days, max 40/day). Each cron invocation sends at most 1–2 emails to keep execution times under 8 seconds.
- **Deliverability**:
  - The first email in any sequence contains **NO tracking redirect links**. The plain portfolio URL is used directly.
  - Plain-text format, under 120 words, 1 clear call-to-action, and a standard `List-Unsubscribe` header.

---

## 3. Required Environment Variables

### In Vercel (`Project Settings > Environment Variables`):

| Variable | Description |
| :--- | :--- |
| `GMAIL_USER` | Your sending Gmail address (e.g. `Mshoaibuldin371@gmail.com`) |
| `GMAIL_APP_PASSWORD` | 16-character Google App Password (e.g. `<YOUR_APP_PASSWORD>`) |
| `GEMINI_API_KEY` | Google AI Studio developer API key (`<YOUR_GEMINI_API_KEY>`) |
| `SUPABASE_URL` | Supabase project URL (`https://<YOUR_PROJECT_REF>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key (`sb_secret_<YOUR_SECRET_KEY>`) |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256 encryption. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CRON_SECRET` | Secret token used to protect cron endpoints (e.g. `<YOUR_CRON_SECRET>`) |

### In GitHub (`Repo Settings > Secrets and variables > Actions`):

| Secret Name | Value |
| :--- | :--- |
| `VERCEL_APP_URL` | `https://<YOUR_PROJECT_NAME>.vercel.app` (without trailing slash) |
| `CRON_SECRET` | Matches the `CRON_SECRET` set in Vercel |

---

## 4. CSV Import Format

Upload a CSV file in **Lead Finder** with the following standard column headers:
```csv
name,email,website,instagram,facebook,tiktok,phone,city,industry
The Monal,info@themonal.com,https://themonal.com,,https://facebook.com/themonal,,0512898044,Islamabad,Hospitality
```
Leads without an email address but containing a social link or phone number are automatically converted into **Manual Outreach Tasks** with an AI-crafted platform DM (<60 words).
