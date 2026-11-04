import React, { useState } from 'react';

export default function EmailComposer() {
  const [regionMode, setRegionMode] = useState('pakistan'); // 'pakistan' or 'worldwide'
  const [selectedService, setSelectedService] = useState('social-media');
  const [subject, setSubject] = useState(
    'Quick question regarding {business_name}\'s short-form content in {city}'
  );
  const [body, setBody] = useState(
    `Hi {first_name},\n\nI was reviewing {business_name} and was really impressed by your local reputation in {city}. {personal_hook}\n\nOver the past 4 months, I helped businesses scale their presence using high-retention short-form reels on TikTok and Instagram.\n\nTake a look at some of my recent work here: {portfolio_url}\n\nWould you be open to me sending over 3 custom concepts for your page?\n\n{cta_link}\n\nBest regards,\nShoaib ul Din\nIslamabad, Pakistan | 03473547036`
  );
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' or 'preview'
  const [recipientEmail, setRecipientEmail] = useState('Mshoaibuldin371@gmail.com');
  const [recipientName, setRecipientName] = useState('Ahmed Khan');
  const [businessName, setBusinessName] = useState('Chaaye Khana F-6');
  const [city, setCity] = useState('Islamabad');
  const [personalHook, setPersonalHook] = useState('Loved seeing your evening footfall in Islamabad — short-form video could easily double it.');
  
  const [aiCritique, setAiCritique] = useState(
    'Strong conversational tone. Clear personal hook without sounding salesy. Estimated spam score: 0.1/10 (Safe). Recommendation: Keep call-to-action under 1 sentence.'
  );
  const [generatingAi, setGeneratingAi] = useState(false);
  const [sendStatus, setSendStatus] = useState('');

  // Personalization variable insertion
  function insertVariable(variable) {
    setBody(prev => prev + ` ${variable}`);
  }

  // Calculate live preview
  const portfolioUrl = selectedService === 'product-manager' 
    ? 'https://github.com/shoaib' 
    : 'https://video-portfolio-572m.vercel.app/';

  const ctaLink = regionMode === 'pakistan'
    ? 'WhatsApp: https://wa.me/923473547036 (Text me anytime)'
    : 'Book 15-min call: https://calendly.com/shoaibuldin371/15min';

  const previewSubject = subject
    .replace('{business_name}', businessName)
    .replace('{first_name}', recipientName.split(' ')[0])
    .replace('{city}', city);

  const previewBody = body
    .replace('{first_name}', recipientName.split(' ')[0])
    .replace('{business_name}', businessName)
    .replace('{city}', city)
    .replace('{personal_hook}', personalHook)
    .replace('{portfolio_url}', portfolioUrl)
    .replace('{cta_link}', ctaLink);

  async function handleGenerateAiHook() {
    setGeneratingAi(true);
    setSendStatus('');
    try {
      const res = await fetch('/api/leads/lead-01/generate-hook', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPersonalHook(data.personal_hook);
        setAiCritique(`Gemini AI updated hook for ${businessName}. Tailored specifically for ${selectedService} in ${city}.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingAi(false);
    }
  }

  async function handleSendTestEmail() {
    setSendStatus('Sending test email via your Gmail SMTP...');
    try {
      const res = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setSendStatus(`Test email dispatched! Check ${recipientEmail} and your Gmail Sent folder. Message ID: ${data.messageId}`);
      } else {
        setSendStatus(`Error: ${data.error || 'Failed to send'}`);
      }
    } catch (err) {
      setSendStatus(`Failed to send test email: ${err.message}`);
    }
  }

  return (
    <div className="flex flex-col w-full pb-20 space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-space-xs gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold px-2 py-0.5 rounded-full bg-primary-fixed">
              Outreach Studio
            </span>
            <span className="text-outline-variant">•</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Gemini AI Co-Pilot Active
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
            Email Composer &amp; AI Co-Pilot
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Craft, personalize, and optimize cold outreach with real-time AI critique and variable insertion.
          </p>
        </div>

        {/* REGION SEPARATOR TOGGLE - PAKISTAN VS WORLDWIDE */}
        <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-xl border border-surface-container-high shadow-sm">
          <button
            onClick={() => {
              setRegionMode('pakistan');
              setCity('Islamabad');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-semibold transition-all ${
              regionMode === 'pakistan'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>🇵🇰 Pakistan Mode</span>
            <span className="text-[10px] px-1 bg-emerald-700 rounded text-white">WhatsApp</span>
          </button>

          <button
            onClick={() => {
              setRegionMode('worldwide');
              setCity('New York');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-semibold transition-all ${
              regionMode === 'worldwide'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>🌐 Worldwide Mode</span>
            <span className="text-[10px] px-1 bg-primary-container rounded text-on-primary">Calendly</span>
          </button>
        </div>
      </div>

      {sendStatus && (
        <div className={`p-3 rounded-xl text-body-sm flex items-center justify-between ${
          sendStatus.startsWith('Error') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">{sendStatus.startsWith('Error') ? 'error' : 'check_circle'}</span>
            <span>{sendStatus}</span>
          </div>
          <button onClick={() => setSendStatus('')} className="font-bold">✕</button>
        </div>
      )}

      {/* Main Grid: Composer on Left, AI Co-Pilot on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        
        {/* Left Column: Editor & Variables */}
        <div className="lg:col-span-7 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md border border-surface-container-high/50">
            
            {/* Service & Region Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs border-b border-surface-container-high/40">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">campaign</span>
                <span className="font-label-sm text-label-sm uppercase font-semibold text-secondary">
                  Target Service
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="bg-surface-container-low text-on-surface font-label-md text-label-md px-3 py-1.5 rounded-lg border border-surface-container-high focus:outline-none"
                >
                  <option value="social-media">Social Media Management</option>
                  <option value="video-editing">Video Editing (Short-Form & Reels)</option>
                  <option value="ai-video">AI Video Creation & Automation</option>
                  <option value="product-manager">Product Management & Coordination</option>
                </select>
              </div>
            </div>

            {/* Subject Line Input */}
            <div className="flex flex-col gap-1.5 bg-surface-container-low p-space-md rounded-xl">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md font-semibold text-on-surface">Subject Line</label>
                <div className="flex items-center gap-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {subject.length} chars
                  </span>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Safe Spam Score
                  </span>
                </div>
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface font-body-md rounded-lg px-3 py-2 border border-surface-container-high focus:outline-none focus:border-primary shadow-sm"
              />
            </div>

            {/* Personalization Variable Chips */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase font-semibold text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary">data_object</span>
                  Dynamic Tokens (Click chip to insert)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => insertVariable('{first_name}')}
                  className="font-code-sm text-code-sm px-2.5 py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed hover:bg-primary hover:text-on-primary transition-all shadow-sm"
                >
                  {'{first_name}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('{business_name}')}
                  className="font-code-sm text-code-sm px-2.5 py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed hover:bg-primary hover:text-on-primary transition-all shadow-sm"
                >
                  {'{business_name}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('{city}')}
                  className="font-code-sm text-code-sm px-2.5 py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed hover:bg-primary hover:text-on-primary transition-all shadow-sm"
                >
                  {'{city}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('{personal_hook}')}
                  className="font-code-sm text-code-sm px-2.5 py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed hover:bg-primary hover:text-on-primary transition-all shadow-sm"
                >
                  {'{personal_hook}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('{portfolio_url}')}
                  className="font-code-sm text-code-sm px-2.5 py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed hover:bg-primary hover:text-on-primary transition-all shadow-sm"
                >
                  {'{portfolio_url}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('{cta_link}')}
                  className="font-code-sm text-code-sm px-2.5 py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed hover:bg-primary hover:text-on-primary transition-all shadow-sm"
                >
                  {'{cta_link}'}
                </button>
              </div>
            </div>

            {/* Compose / Preview Tabs */}
            <div className="flex items-center justify-between border-b border-surface-container-high/60 pt-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('compose')}
                  className={`pb-2 px-3 font-label-md text-label-md font-semibold border-b-2 transition-all ${
                    activeTab === 'compose' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                  }`}
                >
                  Email Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`pb-2 px-3 font-label-md text-label-md font-semibold border-b-2 transition-all ${
                    activeTab === 'preview' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                  }`}
                >
                  Rendered Preview
                </button>
              </div>

              <div className="text-xs text-on-surface-variant pb-2">
                CTA Type: <strong className={regionMode === 'pakistan' ? 'text-emerald-700' : 'text-primary'}>
                  {regionMode === 'pakistan' ? 'Pakistan WhatsApp Direct' : 'Global Calendly 15-min'}
                </strong>
              </div>
            </div>

            {/* Editor Body */}
            {activeTab === 'compose' ? (
              <textarea
                rows={11}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full p-space-md rounded-xl bg-surface-container-low font-code-sm text-code-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary leading-relaxed shadow-inner"
              />
            ) : (
              <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high space-y-3 font-body-md text-body-md">
                <div className="pb-2 border-b border-surface-container-high/40 text-xs text-on-surface-variant space-y-1">
                  <div><strong>To:</strong> {recipientName} &lt;{recipientEmail}&gt;</div>
                  <div><strong>Subject:</strong> {previewSubject}</div>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-on-surface font-sans">
                  {previewBody}
                </div>
              </div>
            )}

            {/* Dispatch Action Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-space-xs border-t border-surface-container-high/40">
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Test recipient email"
                  className="h-9 px-3 rounded-lg bg-surface-container-low text-xs border border-surface-container-high w-56"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md font-semibold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Send Test Email</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: AI Co-Pilot & Lead Preview Context */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          {/* AI Co-Pilot Panel */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg border border-surface-container-high/50 space-y-space-md">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">psychology</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Gemini AI Co-Pilot
                </h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Online
              </span>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl text-body-sm text-on-surface leading-relaxed border border-surface-container-high/40">
              <div className="flex items-center gap-1.5 font-semibold text-primary mb-1">
                <span className="material-symbols-outlined text-[16px]">tips_and_updates</span>
                <span>Real-Time Critique</span>
              </div>
              <p>{aiCritique}</p>
            </div>

            {/* Test Prospect Mock Context */}
            <div className="space-y-2 pt-1">
              <label className="font-label-sm text-label-sm uppercase font-semibold text-secondary">
                Simulated Lead Context
              </label>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-on-surface-variant">Business:</span>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full mt-0.5 h-8 px-2 rounded bg-surface-container-low border border-surface-container-high"
                  />
                </div>

                <div>
                  <span className="text-on-surface-variant">Contact Name:</span>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full mt-0.5 h-8 px-2 rounded bg-surface-container-low border border-surface-container-high"
                  />
                </div>

                <div>
                  <span className="text-on-surface-variant">City:</span>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full mt-0.5 h-8 px-2 rounded bg-surface-container-low border border-surface-container-high"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={generatingAi}
                  onClick={handleGenerateAiHook}
                  className="w-full py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                  <span>{generatingAi ? 'Generating...' : 'Regenerate Hook with Gemini'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Regional Tips Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md border border-surface-container-high/50 text-body-sm">
            <h4 className="font-semibold text-on-surface mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
              <span>{regionMode === 'pakistan' ? 'Pakistan Cold Outreach Rules' : 'Global Outreach Rules'}</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-on-surface-variant list-disc pl-4">
              {regionMode === 'pakistan' ? (
                <>
                  <li>Pakistani founders and owners respond best to direct WhatsApp links.</li>
                  <li>Mention Islamabad/Rawalpindi or their local market to build immediate trust.</li>
                  <li>Keep tone respectful and professional with local PKR retainer clarity.</li>
                </>
              ) : (
                <>
                  <li>Keep initial email under 80 words for top US & European executives.</li>
                  <li>Always provide an immediate proof-of-work link ({'{portfolio_url}'}).</li>
                  <li>One clear low-friction call-to-action (15-min discovery call).</li>
                </>
              )}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
