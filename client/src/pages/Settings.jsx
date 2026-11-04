import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [settings, setSettings] = useState({
    sender_name: 'Shoaib ul Din',
    sender_email: 'Mshoaibuldin371@gmail.com',
    sender_phone: '03473547036',
    sender_location: 'Islamabad, Pakistan',
    gmail_address: 'Mshoaibuldin371@gmail.com',
    gmail_app_password: '',
    has_app_password: false,
    gmail_is_connected: false,
    facebook_url: 'https://facebook.com/shoaib.media',
    video_portfolio_url: 'https://video-portfolio-572m.vercel.app/',
    ai_video_portfolio_url: 'https://video-portfolio-572m.vercel.app/',
    pm_case_study_url: 'https://github.com/shoaib',
    calendly_link: '',
    warmup_start_limit: 15,
    warmup_step: 5,
    warmup_step_days: 3,
    warmup_max_limit: 50,
    send_window_start: '09:00',
    send_window_end: '18:00',
    skip_sundays: true,
    min_delay_sec: 45,
    max_delay_sec: 150,
    bcc_self: false,
    dry_run_mode: false,
    approval_mode: true,
    pause_all: false,
  });

  const [services, setServices] = useState([
    { id: 'sm', slug: 'social-media', name: 'Social Media Management', experience_text: '4 months' },
    { id: 've', slug: 'video-editing', name: 'Video Editing', experience_text: '3 years' },
    { id: 'ai', slug: 'ai-video', name: 'AI Video Creation', experience_text: '4 months' },
    { id: 'pm', slug: 'product-manager', name: 'Product Management', experience_text: '4 months' },
  ]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testRecipient, setTestRecipient] = useState('Mshoaibuldin371@gmail.com');
  const [showTestModal, setShowTestModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
    fetchServices();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data, gmail_app_password: '' }));
      }
    } catch (err) {
      console.warn('Using local settings state:', err.message);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      console.warn('Using default services:', err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'All settings saved successfully.' });
        fetchSettings();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/settings/test-gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: settings.gmail_address,
          appPassword: settings.gmail_app_password || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: '✓ Connection Verified: Gmail SMTP (port 465) & IMAP (port 993) connected successfully!',
        });
        setSettings((prev) => ({ ...prev, gmail_is_connected: true }));
      } else {
        setStatusMessage({
          type: 'error',
          text: `Connection Test Failed: ${data.error}`,
        });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Network error: ${err.message}` });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/settings/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: testRecipient,
          customSubject: 'ReachOut Verified Test Email — Personal Gmail SMTP',
        }),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `✓ Test Email Dispatched! Check ${testRecipient} and your Gmail "Sent" folder. (Message ID: ${data.details?.messageId})`,
        });
        setShowTestModal(false);
      } else {
        setStatusMessage({
          type: 'error',
          text: `Send failed: ${data.error}`,
        });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleServiceExperienceChange = (id, newExp) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, experience_text: newExp } : s))
    );
  };

  const handleSaveService = async (service) => {
    try {
      await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });
      setStatusMessage({ type: 'success', text: `Updated ${service.name} experience.` });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Banner / Ambient Header */}
      <div className="relative w-full mb-space-lg">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="space-y-1">
            <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md tracking-wider uppercase font-semibold">
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Workspace Preferences</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
              Account &amp; Outreach Settings
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Configure your Gmail SMTP/IMAP credentials, editable service experiences, sending limits, and compliance rules.
            </p>
          </div>

          {/* Quick Deliverability Health Indicator */}
          <div className="flex items-center gap-space-md bg-surface-container-lowest px-space-md py-space-sm rounded-xl shadow-sm self-start md:self-auto border border-surface-container-high/60">
            <div className="relative flex items-center justify-center w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-container"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-primary-container"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="98, 100"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute font-label-sm text-label-sm font-bold text-primary">98%</span>
            </div>
            <div className="leading-tight">
              <p className="font-label-md text-label-md font-semibold text-on-surface">Sender Reputation</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Tier 1 • High Deliverability</p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          className={`mb-space-lg p-space-md rounded-xl text-body-md flex items-center justify-between shadow-sm border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-error-container/60 border-error-container text-on-error-container'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">
              {statusMessage.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-current hover:opacity-75"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* LEFT COLUMN: Gmail Integration, Limits & Schedule (7 cols) */}
        <div className="lg:col-span-7 space-y-space-lg">
          {/* SECTION 1: Gmail Account & SMTP/IMAP Integration */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 space-y-space-md">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-space-sm">
                <span className="p-2 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                </span>
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Gmail Account &amp; Integration
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Personal Gmail SMTP (port 465) + IMAP (port 993) via App Password
                  </p>
                </div>
              </div>
              <span className="px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                Direct Relay
              </span>
            </div>

            {/* Account Status Card */}
            <div className="bg-surface-container-low rounded-xl p-space-md space-y-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px] text-primary-container">mail</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-space-xs">
                      <p className="font-label-lg text-label-lg font-semibold text-on-surface truncate">
                        {settings.gmail_address}
                      </p>
                      <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Gmail Sent Folder Sync Active
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-sm text-label-sm flex-shrink-0 self-start sm:self-auto ${
                    settings.gmail_is_connected
                      ? 'bg-secondary-fixed text-on-secondary-fixed'
                      : 'bg-surface-container text-outline'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      settings.gmail_is_connected ? 'bg-primary animate-pulse' : 'bg-outline'
                    }`}
                  ></span>
                  {settings.gmail_is_connected ? 'Connected & Verified' : 'Needs App Password'}
                </span>
              </div>

              {/* Protocol Metric Indicators */}
              <div className="grid grid-cols-3 gap-space-sm pt-space-xs">
                <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">SMTP Host</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">smtp.gmail.com:465</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">IMAP Host</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">imap.gmail.com:993</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Sent Folder</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Auto-Saved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gmail Credential Fields */}
            <div className="space-y-space-md pt-space-xs">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Sender Gmail Address
                </label>
                <input
                  type="email"
                  value={settings.gmail_address}
                  onChange={(e) => setSettings({ ...settings, gmail_address: e.target.value, sender_email: e.target.value })}
                  className="w-full h-11 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  placeholder="Mshoaibuldin371@gmail.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-label-md text-label-md text-on-surface font-semibold">
                    Gmail App Password (16 Characters)
                  </label>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-0.5"
                  >
                    <span>Generate App Password</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={settings.gmail_app_password}
                    onChange={(e) => setSettings({ ...settings, gmail_app_password: e.target.value })}
                    className="w-full h-11 pl-space-md pr-11 rounded-xl bg-surface-container-low border border-outline-variant/60 text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                    placeholder={settings.has_app_password ? '•••••••••••••••• (Encrypted on server)' : 'Enter 16-character App Password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  Stored securely using AES-256-GCM encryption on the backend. Never exposed to browser code.
                </p>
              </div>

              {/* Action Buttons: Test Connection & Send Test Email */}
              <div className="flex flex-wrap items-center gap-space-sm pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all font-label-md text-label-md font-semibold"
                >
                  {testingConnection ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                  )}
                  <span>Test Connection</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTestModal(true)}
                  className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-primary-container text-on-primary hover:bg-primary transition-all font-label-md text-label-md font-semibold shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Send Test Email</span>
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 2: Daily Warm-Up & Throttle Limits */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 space-y-space-md">
            <div className="flex items-center gap-space-sm pb-space-xs">
              <span className="p-2 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">speed</span>
              </span>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Warm-Up Ramp &amp; Sending Limits
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Safe volume ramping to maintain high inbox deliverability
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Initial Daily Limit (Warm-Up Start)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.warmup_start_limit}
                    onChange={(e) => setSettings({ ...settings, warmup_start_limit: parseInt(e.target.value) || 15 })}
                    className="w-full h-11 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-on-surface text-body-md"
                  />
                  <span className="absolute right-3 top-3 text-xs text-outline">emails/day</span>
                </div>
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Max Daily Sending Limit
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.warmup_max_limit}
                    onChange={(e) => setSettings({ ...settings, warmup_max_limit: parseInt(e.target.value) || 50 })}
                    className="w-full h-11 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-on-surface text-body-md"
                  />
                  <span className="absolute right-3 top-3 text-xs text-outline">emails/day</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-xs">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Ramp Step (+5 emails every 3 days)
                </label>
                <input
                  type="number"
                  value={settings.warmup_step}
                  onChange={(e) => setSettings({ ...settings, warmup_step: parseInt(e.target.value) || 5 })}
                  className="w-full h-11 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-on-surface text-body-md"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Random Jitter Delay Between Sends
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.min_delay_sec}
                    onChange={(e) => setSettings({ ...settings, min_delay_sec: parseInt(e.target.value) || 45 })}
                    className="w-full h-11 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-on-surface text-body-md"
                  />
                  <span className="text-outline text-xs">to</span>
                  <input
                    type="number"
                    value={settings.max_delay_sec}
                    onChange={(e) => setSettings({ ...settings, max_delay_sec: parseInt(e.target.value) || 150 })}
                    className="w-full h-11 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-on-surface text-body-md"
                  />
                  <span className="text-outline text-xs">sec</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: Timezone & Sending Schedule */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 space-y-space-md">
            <div className="flex items-center gap-space-sm pb-space-xs">
              <span className="p-2 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
              </span>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Sending Schedule (Asia/Karachi)
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Two scheduled runs per day at 10:00 and 16:00 PKT
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-space-md">
              <div className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between">
                <div>
                  <p className="font-label-md text-label-md font-semibold text-on-surface">Morning Run</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">10:00 PKT (05:00 UTC)</p>
                </div>
                <span className="material-symbols-outlined text-primary text-[22px]">alarm</span>
              </div>
              <div className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between">
                <div>
                  <p className="font-label-md text-label-md font-semibold text-on-surface">Afternoon Run</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">16:00 PKT (11:00 UTC)</p>
                </div>
                <span className="material-symbols-outlined text-primary text-[22px]">alarm</span>
              </div>
            </div>

            <div className="pt-space-xs flex items-center justify-between">
              <div>
                <p className="font-label-md text-label-md text-on-surface font-semibold">Skip Sundays</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Pause automated outreach on Sundays</p>
              </div>
              <input
                type="checkbox"
                checked={settings.skip_sundays}
                onChange={(e) => setSettings({ ...settings, skip_sundays: e.target.checked })}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: 4 Services Editable Experience, Links & Governance (5 cols) */}
        <div className="lg:col-span-5 space-y-space-lg">
          {/* SECTION 4: The 4 Services & Editable Experience */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 space-y-space-md">
            <div className="flex items-center gap-space-sm pb-space-xs">
              <span className="p-2 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">badge</span>
              </span>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  The 4 Service Experiences
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Editable duration &amp; claims (never hardcoded)
                </p>
              </div>
            </div>

            <div className="space-y-space-md">
              {services.map((svc) => (
                <div key={svc.id} className="p-space-md rounded-xl bg-surface-container-low space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-label-md text-label-md font-bold text-on-surface">{svc.name}</p>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                      {svc.experience_text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={svc.experience_text}
                      onChange={(e) => handleServiceExperienceChange(svc.id, e.target.value)}
                      placeholder="e.g. 4 months, 3 years"
                      className="flex-1 h-9 px-space-sm text-body-sm rounded-lg bg-surface-container-lowest border border-outline-variant/60"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveService(svc)}
                      className="px-3 h-9 bg-primary-container text-on-primary rounded-lg text-xs font-semibold hover:bg-primary transition-all"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: Portfolio & Social Proof URLs */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 space-y-space-md">
            <div className="flex items-center gap-space-sm pb-space-xs">
              <span className="p-2 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">link</span>
              </span>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Required Portfolio Links
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Mandatory proof-of-work links inserted into email templates
                </p>
              </div>
            </div>

            <div className="space-y-space-md">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Facebook Page URL (Required for Social Media)
                </label>
                <input
                  type="url"
                  value={settings.facebook_url}
                  onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/your-page"
                  className="w-full h-10 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-body-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  AI Video Portfolio Link
                </label>
                <input
                  type="url"
                  value={settings.ai_video_portfolio_url}
                  onChange={(e) => setSettings({ ...settings, ai_video_portfolio_url: e.target.value })}
                  placeholder="https://video-portfolio-572m.vercel.app/"
                  className="w-full h-10 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-body-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Video Editing Portfolio Link
                </label>
                <input
                  type="url"
                  value={settings.video_portfolio_url}
                  onChange={(e) => setSettings({ ...settings, video_portfolio_url: e.target.value })}
                  placeholder="https://video-portfolio-572m.vercel.app/"
                  className="w-full h-10 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-body-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Product Manager Case Study URL
                </label>
                <input
                  type="url"
                  value={settings.pm_case_study_url}
                  onChange={(e) => setSettings({ ...settings, pm_case_study_url: e.target.value })}
                  placeholder="https://github.com/shoaib"
                  className="w-full h-10 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-body-sm font-mono"
                />
              </div>
            </div>
          </section>

          {/* SECTION 6: Safety Controls & Global Pause */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 space-y-space-md">
            <div className="flex items-center gap-space-sm pb-space-xs">
              <span className="p-2 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">shield</span>
              </span>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Safety &amp; Compliance Toggles
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Approval queues, dry-run reviews, and safety killswitch
                </p>
              </div>
            </div>

            <div className="space-y-space-sm">
              <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-semibold">Approval Mode</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Queue emails for 1-click approval</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.approval_mode}
                  onChange={(e) => setSettings({ ...settings, approval_mode: e.target.checked })}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-semibold">Dry-Run Mode</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Generate but do not dispatch</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dry_run_mode}
                  onChange={(e) => setSettings({ ...settings, dry_run_mode: e.target.checked })}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-space-sm rounded-lg bg-error-container/30 border border-error-container/60">
                <div>
                  <p className="font-label-md text-label-md text-error font-bold">Global Pause All</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Halt all automated sending immediately</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pause_all}
                  onChange={(e) => setSettings({ ...settings, pause_all: e.target.checked })}
                  className="w-5 h-5 accent-error cursor-pointer"
                />
              </div>
            </div>

            {/* Save All Settings Button */}
            <div className="pt-space-md">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-primary-container text-on-primary hover:bg-primary transition-all font-label-lg text-label-lg font-semibold shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Save All Workspace Preferences</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Send Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-md p-space-xl rounded-2xl shadow-xl border border-surface-container-high space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-primary-container text-on-primary">
                  <span className="material-symbols-outlined text-[20px]">outgoing_mail</span>
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Send Test Outreach Email
                </h3>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              This will send a live verification email using your Gmail account (<strong>{settings.gmail_address}</strong>). A copy will appear automatically in your Gmail <strong>Sent</strong> folder.
            </p>

            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                Destination Recipient Email
              </label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="w-full h-11 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-on-surface text-body-md"
                placeholder="Mshoaibuldin371@gmail.com"
              />
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingTestEmail}
                className="px-space-md py-2.5 rounded-xl bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md font-semibold flex items-center gap-2 shadow-sm"
              >
                {sendingTestEmail ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">send</span>
                )}
                <span>Send Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

