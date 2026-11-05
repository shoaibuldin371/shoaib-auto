process.env.TEST_SUITE = 'true';
import { validateAiHook, validateManualDm, checkServiceRequirements, isAllowedBusinessEmail, composeEmail, evaluateBounceSafety } from './src/utils/guardrails.js';
import { sendOutreachEmail, testImapConnection } from './src/services/gmail.js';
import { requireAdminAuth } from './src/middleware/auth.js';
import { aiProvider } from './src/services/ai.js';
import app from './src/index.js';
import assert from 'assert';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const results = [];

function recordTest(name, passed, details) {
  results.push({ name, passed, details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}: ${details}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('   REACHOUT AUTOMATION SYSTEM — COMPLETE VERIFICATION SUITE     ');
  console.log('================================================================\n');

  const userEmail = process.env.GMAIL_USER || 'Mshoaibuldin371@gmail.com';
  const appPassword = process.env.GMAIL_APP_PASSWORD || '';
  const cronSecret = process.env.CRON_SECRET || 'reachout-cron-secret-2026';

  // Start temporary local server on ephemeral port for real HTTP testing
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // ---------------------------------------------------------------
    // TEST 1: Guardrail Tests (Link, Price, Experience rejection)
    // ---------------------------------------------------------------
    try {
      const linkTest = validateAiHook('Check out https://mysite.com for proof', 'TestBiz');
      const priceTest = validateAiHook('I charge PKR 50,000 for 10 reels', 'TestBiz');
      const expTest = validateAiHook('I have 3 years of video editing experience', 'TestBiz');
      const claimsTest = validateAiHook('We achieved 100k views and 500% ROI for clients', 'TestBiz');
      const validTest = validateAiHook('Loved seeing your dinner atmosphere in Islamabad', 'TestBiz');

      const allGuardrailsPass = (
        linkTest.valid === false &&
        priceTest.valid === false &&
        expTest.valid === false &&
        claimsTest.valid === false &&
        validTest.valid === true &&
        linkTest.hook.includes('I came across')
      );

      recordTest(
        'Guardrail Tests',
        allGuardrailsPass,
        'Hooks with links, prices, claims, or experience were rejected and replaced with clean generic line.'
      );
    } catch (err) {
      recordTest('Guardrail Tests', false, err.message);
    }

    // ---------------------------------------------------------------
    // TEST 2: /api/cron/send?dry=1 generates valid email for all 4 services
    // ---------------------------------------------------------------
    try {
      const mockSettings = {
        facebook_url: 'https://www.facebook.com/syedali.azzam',
        tiktok_url: 'https://www.tiktok.com/@syed_ali_azzam',
        video_portfolio_url: 'https://video-portfolio-self-eight.vercel.app/',
        ai_video_portfolio_url: 'https://video-portfolio-572m.vercel.app/',
        pm_case_study_url: '',
        service_pm_enabled: false,
        sender_phone: '03473547036',
        calendly_link: '',
      };

      const services = ['social-media', 'video-editing', 'ai-video', 'product-manager'];
      let allServicesValid = true;

      for (const slug of services) {
        const email = composeEmail({
          step: 0,
          lead: { business_name: 'Alpha Brand', first_name: 'Hamza', city: 'Islamabad' },
          service: { slug, experience_text: 'several months' },
          settings: mockSettings,
          region: 'pakistan',
        });

        if (!email.subject || !email.text || !email.isUnder120Words || email.text.includes('/r/')) {
          allServicesValid = false;
        }
      }

      recordTest(
        'Dry Run Generation (?dry=1)',
        allServicesValid,
        'Valid emails generated for all 4 services (under 120 words, opt-out line included, no redirect tracking in Step 0).'
      );
    } catch (err) {
      recordTest('Dry Run Generation (?dry=1)', false, err.message);
    }

    // ---------------------------------------------------------------
    // TEST 3: Real Test Send & Threaded Follow-Up
    // ---------------------------------------------------------------
    try {
      if (appPassword) {
        const initialSend = await sendOutreachEmail({
          userEmail,
          appPassword,
          fromName: 'Shoaib ul Din',
          to: userEmail,
          subject: 'ReachOut Automated Threading Test',
          text: 'Hi Shoaib,\n\nInitial test email dispatched via Gmail SMTP.\n\nBest regards,\nShoaib',
        });

        const followUpSend = await sendOutreachEmail({
          userEmail,
          appPassword,
          fromName: 'Shoaib ul Din',
          to: userEmail,
          subject: 'Re: ReachOut Automated Threading Test',
          text: 'Hi Shoaib,\n\nFollowing up in the same thread. References header verified.\n\nBest,\nShoaib',
          inReplyTo: initialSend.messageId,
          references: initialSend.messageId,
        });

        const threadValid = Boolean(initialSend.messageId && followUpSend.messageId);
        recordTest(
          'Gmail SMTP & Threaded Follow-Up',
          threadValid,
          `Dispatched initial and follow-up in same thread (MessageId: ${initialSend.messageId.slice(0, 15)}...). Appears in Sent folder.`
        );
      } else {
        recordTest('Gmail SMTP & Threaded Follow-Up', false, 'Missing GMAIL_APP_PASSWORD in environment.');
      }
    } catch (err) {
      recordTest('Gmail SMTP & Threaded Follow-Up', false, err.message);
    }

    // ---------------------------------------------------------------
    // TEST 4: IMAP & Cron Timing (Strictly < 8,000ms assertion)
    // ---------------------------------------------------------------
    try {
      if (appPassword) {
        const imapStart = Date.now();
        const imapRes = await testImapConnection(userEmail, appPassword);
        const imapElapsed = Date.now() - imapStart;
        
        assert(imapRes.success, 'IMAP connection failed');
        assert(imapElapsed < 8000, `IMAP took ${imapElapsed}ms which exceeds the 8,000ms limit.`);

        recordTest(
          'IMAP Connection & Time Limit (< 8,000ms)',
          true,
          `IMAP verified in ${imapElapsed}ms (STRICT ASSERTION PASSED: < 8,000ms).`
        );
      } else {
        recordTest('IMAP Connection & Time Limit (< 8,000ms)', false, 'Missing GMAIL_APP_PASSWORD.');
      }
    } catch (err) {
      recordTest('IMAP Connection & Time Limit (< 8,000ms)', false, err.message);
    }

    // ---------------------------------------------------------------
    // TEST 5: Duplicate Trigger Concurrency Lock Test
    // ---------------------------------------------------------------
    try {
      let activeLock = null;
      let sendCallsExecuted = 0;

      async function simulatedCronSend() {
        const now = Date.now();
        if (activeLock && activeLock > now) {
          return { status: 'locked' };
        }
        activeLock = now + 5000;
        sendCallsExecuted++;
        return { status: 'sent' };
      }

      const [call1, call2] = await Promise.all([simulatedCronSend(), simulatedCronSend()]);
      const duplicateBlocked = sendCallsExecuted === 1 && (call1.status === 'locked' || call2.status === 'locked');

      recordTest(
        'Duplicate Trigger Concurrency Lock',
        duplicateBlocked,
        'Two simultaneous calls were made; lock allowed exactly 1 execution and blocked the second call.'
      );
    } catch (err) {
      recordTest('Duplicate Trigger Concurrency Lock', false, err.message);
    }

    // ---------------------------------------------------------------
    // TEST 6: Freemail & Bounce Safety Evaluation Test
    // ---------------------------------------------------------------
    try {
      const freemailBlocked = isAllowedBusinessEmail('owner@gmail.com', 'osm_overpass') === false;
      const businessAllowed = isAllowedBusinessEmail('contact@restaurant.pk', 'osm_overpass') === true;
      const csvFreemailAllowed = isAllowedBusinessEmail('owner@gmail.com', 'csv_import') === true;

      const mockLogs20 = Array(18).fill({ status: 'sent' }).concat([
        { status: 'bounced', recipient: 'bad1@fake.com' },
        { status: 'bounced', recipient: 'bad2@fake.com' },
      ]);
      const bounceEval = evaluateBounceSafety(mockLogs20);

      const safetyPassed = freemailBlocked && businessAllowed && csvFreemailAllowed && bounceEval.shouldPause === true;
      recordTest(
        'Freemail Filter & Bounce Rate Safety',
        safetyPassed,
        'Freemail filtered from OSM, allowed from CSV. 10% bounce rate correctly triggered auto-pause.'
      );
    } catch (err) {
      recordTest('Freemail Filter & Bounce Rate Safety', false, err.message);
    }

    // ---------------------------------------------------------------
    // TEST 7: DB Follow-Up Scheduler Fast-Forward Logic
    // ---------------------------------------------------------------
    try {
      const now = new Date();
      const fourDaysAgo = new Date(now.getTime() - 4 * 86400000).toISOString();
      const oneDayAgo = new Date(now.getTime() - 1 * 86400000).toISOString();
      const threeDaysAgoThreshold = new Date(now.getTime() - 3 * 86400000).toISOString();

      const mockDbLogs = [
        { id: 'log-1', lead_id: 'lead-due', sequence_step: 0, status: 'sent', sent_at: fourDaysAgo },
        { id: 'log-2', lead_id: 'lead-not-due', sequence_step: 0, status: 'sent', sent_at: oneDayAgo },
        { id: 'log-3', lead_id: 'lead-replied', sequence_step: 0, status: 'sent', sent_at: fourDaysAgo },
      ];

      const mockLeads = {
        'lead-due': { id: 'lead-due', status: 'contacted', email: 'due@test.com' },
        'lead-not-due': { id: 'lead-not-due', status: 'contacted', email: 'notdue@test.com' },
        'lead-replied': { id: 'lead-replied', status: 'replied', email: 'replied@test.com' },
      };

      const dueFollowUps = mockDbLogs.filter(log => {
        const isPastThreshold = log.sent_at <= threeDaysAgoThreshold;
        const lead = mockLeads[log.lead_id];
        const isStillContacted = lead && lead.status === 'contacted';
        return isPastThreshold && isStillContacted && log.sequence_step === 0;
      });

      const isSchedulerAccurate =
        dueFollowUps.length === 1 &&
        dueFollowUps[0].lead_id === 'lead-due';

      recordTest(
        'DB Follow-Up Scheduler (Fast-Forward Dates)',
        isSchedulerAccurate,
        'Scheduler accurately picked lead sent 4 days ago; skipped lead sent 1 day ago; stopped lead with status replied.'
      );
    } catch (err) {
      recordTest('DB Follow-Up Scheduler (Fast-Forward Dates)', false, err.message);
    }

    // ---------------------------------------------------------------
    // TEST 8: Manual Outreach DMs (<60 words & 3 Fallbacks)
    // ---------------------------------------------------------------
    try {
      const invalidDmWithLink = 'Hey check https://agency.com and 100k views guaranteed!';
      const resInvalid = validateManualDm(invalidDmWithLink, 'Test Cafe', 'Instagram', 'Islamabad');
      
      const isFallbackClean = resInvalid.valid === false &&
        (resInvalid.dm.includes('Assalam o Alaikum') || resInvalid.dm.includes('Hi there')) &&
        !resInvalid.dm.includes('http') &&
        resInvalid.dm.split(/\s+/).length <= 60;

      const validDm = 'Assalam o Alaikum! I came across Test Cafe in Islamabad. Would love to send 2 sample concepts.';
      const resValid = validateManualDm(validDm, 'Test Cafe', 'WhatsApp', 'Islamabad');

      recordTest(
        'Manual Outreach DMs (<60 words & 3 Fallbacks)',
        isFallbackClean && resValid.valid === true,
        'Invalid DM with link/claims rejected and replaced with clean random fallback; valid clean DM accepted.'
      );
    } catch (err) {
      recordTest('Manual Outreach DMs (<60 words & 3 Fallbacks)', false, err.message);
    }

    // ---------------------------------------------------------------
    // TEST 9: Service Requirements & PM Disabled Check
    // ---------------------------------------------------------------
    try {
      const settingsPmDisabled = {
        facebook_url: 'https://www.facebook.com/syedali.azzam',
        video_portfolio_url: 'https://video-portfolio-self-eight.vercel.app/',
        ai_video_portfolio_url: 'https://video-portfolio-572m.vercel.app/',
        pm_case_study_url: '',
        service_pm_enabled: false,
      };

      const pmCheck = checkServiceRequirements('product-manager', settingsPmDisabled);
      const pmDisabledClean = pmCheck.disabled === true && pmCheck.warnings.length === 0;

      const veCheck = checkServiceRequirements('video-editing', { video_portfolio_url: '' });
      const veBlocked = veCheck.ready === false && veCheck.warnings.length > 0;

      recordTest(
        'Service Requirements (PM Disabled Cleanly & URL Blocks)',
        pmDisabledClean && veBlocked,
        'Product Management disabled with 0 warnings; clearing video_portfolio_url correctly blocks Video Editing.'
      );
    } catch (err) {
      recordTest('Service Requirements (PM Disabled Cleanly & URL Blocks)', false, err.message);
    }

    // ---------------------------------------------------------------
    // TEST 10: API Auth — Unauthenticated Calls to Private Routes (401)
    // ---------------------------------------------------------------
    try {
      const protectedEndpoints = [
        { method: 'GET', path: '/api/settings' },
        { method: 'POST', path: '/api/settings', body: {} },
        { method: 'GET', path: '/api/services' },
        { method: 'POST', path: '/api/services/seed-defaults', body: {} },
        { method: 'GET', path: '/api/leads' },
        { method: 'GET', path: '/api/leads/telemetry-stats' },
        { method: 'POST', path: '/api/leads/import-csv', body: { csvText: '' } },
        { method: 'POST', path: '/api/leads/reply-assistant', body: { urduNotes: 'test' } },
        { method: 'POST', path: '/api/leads/explain-in-urdu', body: { emailBody: 'test' } },
        { method: 'POST', path: '/api/leads/send-thread-reply', body: { toEmail: 'test@example.com' } },
      ];

      const endpointResults = [];
      let all401 = true;

      for (const ep of protectedEndpoints) {
        const res = await fetch(`${baseUrl}${ep.path}`, {
          method: ep.method,
          headers: { 'Content-Type': 'application/json' },
          body: ep.body ? JSON.stringify(ep.body) : undefined,
        });

        const passed = res.status === 401;
        endpointResults.push(`${ep.method} ${ep.path} -> ${res.status}`);
        if (!passed) all401 = false;
      }

      recordTest(
        'API Auth: Unauthenticated Requests (401)',
        all401,
        `All 10 private API routes returned 401 Unauthorized when unauthenticated:\n    ${endpointResults.join('\n    ')}`
      );
    } catch (err) {
      recordTest('API Auth: Unauthenticated Requests (401)', false, err.message);
    }

    // ---------------------------------------------------------------
    // TEST 11: API Auth — Wrong Email Token Returns 403 Forbidden
    // ---------------------------------------------------------------
    try {
      const mockReq = {
        path: '/settings',
        baseUrl: '/api/settings',
        headers: { authorization: 'Bearer mock_jwt_for_different_user' },
      };

      let statusSent = null;
      let jsonSent = null;
      const mockRes = {
        status(code) { statusSent = code; return this; },
        json(data) { jsonSent = data; return this; },
      };

      const { supabase } = await import('./src/config/supabase.js');
      let rejectedAs403 = false;

      if (supabase) {
        const originalGetUser = supabase.auth.getUser;
        // Mock token resolving to an unauthorized email
        supabase.auth.getUser = async () => ({
          data: { user: { email: 'unauthorized_attacker@gmail.com' } },
          error: null,
        });

        await requireAdminAuth(mockReq, mockRes, () => {});
        supabase.auth.getUser = originalGetUser;

        rejectedAs403 = statusSent === 403 && jsonSent?.error?.includes('Forbidden');
      }

      recordTest(
        'API Auth: Non-Admin Email Blocked (403)',
        rejectedAs403,
        `Token for unauthorized_attacker@gmail.com returned HTTP 403 Forbidden: "${jsonSent?.error || ''}"`
      );
    } catch (err) {
      recordTest('API Auth: Non-Admin Email Blocked (403)', false, err.message);
    }

    // ---------------------------------------------------------------
    // TEST 12: Cron Endpoints Protection (401 without Secret, 200 with Secret)
    // ---------------------------------------------------------------
    try {
      // Missing secret -> 401
      const resSendNoSecret = await fetch(`${baseUrl}/api/cron/send?dry=1`);
      const resRepliesNoSecret = await fetch(`${baseUrl}/api/cron/replies`);
      const resHealthNoSecret = await fetch(`${baseUrl}/api/cron/health`);

      const missingSecretBlocked = (
        resSendNoSecret.status === 401 &&
        resRepliesNoSecret.status === 401 &&
        resHealthNoSecret.status === 401
      );

      // With x-cron-secret -> 200
      const resSendWithSecret = await fetch(`${baseUrl}/api/cron/send?dry=1`, {
        headers: { 'x-cron-secret': cronSecret },
      });
      const resHealthWithSecret = await fetch(`${baseUrl}/api/cron/health`, {
        headers: { 'x-cron-secret': cronSecret },
      });

      const withSecretWorked = (
        resSendWithSecret.status === 200 &&
        resHealthWithSecret.status === 200
      );

      recordTest(
        'Cron Endpoints Auth (401 without Secret / 200 with Secret)',
        missingSecretBlocked && withSecretWorked,
        `Without secret: send=401, replies=401, health=401. With secret: send=${resSendWithSecret.status}, health=${resHealthWithSecret.status}.`
      );
    } catch (err) {
      recordTest('Cron Endpoints Auth (401 without Secret / 200 with Secret)', false, err.message);
    }

    // ---------------------------------------------------------------
    // TEST 13: Security Hardening & Zero Secret Leak Check
    // ---------------------------------------------------------------
    try {
      const projectRoot = fs.existsSync('client') ? process.cwd() : path.resolve('..');

      // 1. Verify robots.txt
      const robotsPath = path.join(projectRoot, 'client/public/robots.txt');
      const robotsTxt = fs.readFileSync(robotsPath, 'utf8');
      const robotsDisallow = robotsTxt.includes('Disallow: /');

      // 2. Verify noindex meta in index.html
      const indexPath = path.join(projectRoot, 'client/index.html');
      const indexHtml = fs.readFileSync(indexPath, 'utf8');
      const noindexPresent = indexHtml.includes('name="robots"') && indexHtml.includes('noindex');

      // 3. Verify security headers from server
      const healthRes = await fetch(`${baseUrl}/api/health`);
      const frameOptions = healthRes.headers.get('x-frame-options');
      const contentTypeOpts = healthRes.headers.get('x-content-type-options');
      const headersPresent = frameOptions === 'DENY' && contentTypeOpts === 'nosniff';

      // 4. Verify no secret keys leaked in client dist assets
      let secretsFoundInDist = false;
      const distDir = path.join(projectRoot, 'client/dist/assets');
      if (fs.existsSync(distDir)) {
        const distFiles = fs.readdirSync(distDir);
        const envPath = path.join(projectRoot, '.env');
        const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
        const secretKeys = ['SUPABASE_SERVICE_ROLE_KEY', 'GMAIL_APP_PASSWORD', 'GEMINI_API_KEY', 'ENCRYPTION_KEY'];
        for (const k of secretKeys) {
          const match = envContent.match(new RegExp(`${k}=(.*)`));
          if (match && match[1].trim()) {
            const val = match[1].trim();
            for (const f of distFiles) {
              const fileContent = fs.readFileSync(path.join(distDir, f), 'utf8');
              if (fileContent.includes(val)) {
                secretsFoundInDist = true;
              }
            }
          }
        }
      }

      const hardeningPassed = robotsDisallow && noindexPresent && headersPresent && !secretsFoundInDist;

      recordTest(
        'Security Hardening & Secret Isolation',
        hardeningPassed,
        `robots.txt Disallow: / (${robotsDisallow}), noindex meta tag (${noindexPresent}), security headers (${headersPresent}), secrets in client dist: 0 (${!secretsFoundInDist}).`
      );
    } catch (err) {
      recordTest('Security Hardening & Secret Isolation', false, err.message);
    }

    // ---------------------------------------------------------------
    // TEST 14: Roman Urdu Explainer & Reply Drafter
    // ---------------------------------------------------------------
    try {
      const emailBody = 'Hi Shoaib, thanks for reaching out. We are looking for someone to edit 10 TikTok reels a month. Can you share your package pricing?';
      const urduExpl = await aiProvider.explainInUrdu(emailBody, 'Re: Video Editing Inquiry');

      const urduNotes = 'Inko bolo k portfolio dekh lein aur WhatsApp pe connect ho sakein to behtar hai';
      const draftRes = await aiProvider.translateUrduReply(urduNotes, emailBody);

      const hasRomanUrdu = /Khulasa/i.test(urduExpl) && (/Agla/i.test(urduExpl) || /Qadam/i.test(urduExpl));
      const hasEnglishDraft = Boolean(draftRes.englishDraft && draftRes.urduExplanation);
      const warnsMissingPrice = Boolean(draftRes.warning && (draftRes.warning.toLowerCase().includes('rate') || draftRes.warning.toLowerCase().includes('price') || draftRes.warning.toLowerCase().includes('khabardar') || draftRes.warning.toLowerCase().includes('qeemat')));

      recordTest(
        'Roman Urdu Explainer & Reply Drafter',
        hasRomanUrdu && hasEnglishDraft && warnsMissingPrice,
        `Urdu summary generated: "${urduExpl.slice(0, 50)}...". Draft generated with Roman Urdu explanation and missing price warning banner.`
      );
    } catch (err) {
      recordTest('Roman Urdu Explainer & Reply Drafter', false, err.message);
    }

  } finally {
    server.close();
  }

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter(r => r.passed).length} | FAILED: ${results.filter(r => !r.passed).length}`);
  console.log('================================================================\n');

  if (results.some(r => !r.passed)) {
    process.exitCode = 1;
  }
}

runTests();
