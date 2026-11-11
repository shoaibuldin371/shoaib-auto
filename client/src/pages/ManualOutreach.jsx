import React, { useState, useEffect } from 'react';

export default function ManualOutreach() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState('all'); // 'all', 'pakistan', 'worldwide'
  const [completedCount, setCompletedCount] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const dailyGoal = 20;

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch('/api/leads/manual-tasks');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
        const done = data.filter(d => d.status === 'done' || d.status === 'replied').length;
        setCompletedCount(Math.min(done, dailyGoal));
      }
    } catch (err) {
      console.error('Failed to fetch manual tasks:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(taskId, action) {
    if (action === 'done' || action === 'replied') {
      setCompletedCount(prev => Math.min(prev + 1, dailyGoal));
    }
    setLeads(prev => prev.map(l => l.id === taskId ? { ...l, status: action } : l));

    try {
      await fetch(`/api/leads/manual-tasks/${taskId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  }

  function handleCopyDm(id, text) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  const filteredLeads = leads.filter(l => {
    const isPak = (l.country || '').toLowerCase().includes('pakistan');
    if (regionFilter === 'pakistan') return isPak;
    if (regionFilter === 'worldwide') return !isPak;
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-20 space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-space-xs gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
              Social Channels &amp; DMs
            </span>
            <span className="text-outline text-xs">/</span>
            <span className="font-label-md text-label-md text-secondary">No-Email Outreach</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            Manual Social Outreach &amp; DMs
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Connect directly with founders &amp; creators across WhatsApp, Instagram, TikTok, and LinkedIn.
          </p>
        </div>

        {/* Region Toggle */}
        <div className="inline-flex p-1 rounded-xl bg-surface-container-low shadow-sm">
          <button
            onClick={() => setRegionFilter('all')}
            className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all ${
              regionFilter === 'all' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            All Channels
          </button>
          <button
            onClick={() => setRegionFilter('pakistan')}
            className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1 ${
              regionFilter === 'pakistan' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            <span>🇵🇰</span> Pakistan (WhatsApp)
          </button>
          <button
            onClick={() => setRegionFilter('worldwide')}
            className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1 ${
              regionFilter === 'worldwide' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            <span>🌐</span> Worldwide (DMs)
          </button>
        </div>
      </div>

      {/* Daily 20 DMs Goal Progress Widget */}
      <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">flag</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Daily 20 DMs Outreach Goal
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
              <span>5 Day Streak</span>
            </span>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Reach 20 manual contacts daily to maintain a consistent high-ticket freelance client pipeline.
          </p>
        </div>

        <div className="flex items-center gap-4 min-w-[240px]">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs font-bold text-on-surface">
              <span>{completedCount} / {dailyGoal} Sent</span>
              <span>{Math.round((completedCount / dailyGoal) * 100)}%</span>
            </div>
            <div className="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / dailyGoal) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Task Leads List */}
      <div className="space-y-space-md">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 space-y-3">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant">send_to_mobile</span>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">No Pending Manual Tasks</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mx-auto">
              Leads discovered via OpenStreetMap or imported via CSV that only have social media or WhatsApp links instead of public emails will automatically appear here with AI-written DMs.
            </p>
          </div>
        ) : (
          filteredLeads.map(lead => {
          const isPak = (lead.country || '').toLowerCase().includes('pakistan');

          return (
            <div
              key={lead.id}
              className={`p-space-lg rounded-xl bg-surface-container-lowest border shadow-sm transition-all ${
                lead.status === 'done' || lead.status === 'replied'
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-surface-container-high/60'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                
                {/* Left: Lead details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      isPak ? 'bg-emerald-100 text-emerald-800' : 'bg-primary-fixed text-on-primary-fixed'
                    }`}>
                      {isPak ? '🇵🇰 Pakistan Local' : '🌐 Worldwide'}
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {lead.business_name}
                    </h3>
                    <span className="text-outline text-xs">•</span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      Contact: {lead.contact_name} ({lead.city}, {lead.country})
                    </span>
                  </div>

                  {/* AI Generated DM text */}
                  <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container-high/40 relative group">
                    <div className="flex items-center justify-between text-xs font-bold text-secondary mb-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-primary">smart_toy</span>
                        <span>AI-Crafted Short DM (&lt;60 words)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyDm(lead.id, lead.dmText)}
                        className="px-2 py-0.5 rounded bg-surface-container-lowest hover:bg-surface-container text-primary font-semibold flex items-center gap-1 text-[11px] shadow-sm transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {copiedId === lead.id ? 'check' : 'content_copy'}
                        </span>
                        <span>{copiedId === lead.id ? 'Copied!' : 'Copy DM'}</span>
                      </button>
                    </div>
                    <p className="text-body-sm text-on-surface leading-relaxed whitespace-pre-wrap font-sans">
                      {lead.dmText}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col gap-2 min-w-[200px] flex-shrink-0">
                  {/* Platform link */}
                  {(() => {
                    let openUrl = lead.link || lead.profile_url || '';
                    const isWhatsApp = (lead.platform || '').toLowerCase().includes('whatsapp');
                    const isInstagram = (lead.platform || '').toLowerCase().includes('instagram');
                    const isLinkedIn = (lead.platform || '').toLowerCase().includes('linkedin');

                    if (isWhatsApp && openUrl.startsWith('https://wa.me/') && !openUrl.includes('?text=')) {
                      openUrl = `${openUrl}?text=${encodeURIComponent(lead.dmText || '')}`;
                    }

                    return (
                      <a
                        href={openUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`py-2 px-3 rounded-lg font-label-md text-label-md font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                          isWhatsApp
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-primary-container hover:bg-primary text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isWhatsApp
                            ? 'chat'
                            : isInstagram
                            ? 'photo_camera'
                            : isLinkedIn
                            ? 'badge'
                            : 'open_in_new'}
                        </span>
                        <span>Open {lead.platform || 'Platform'}</span>
                      </a>
                    );
                  })()}

                  {/* Quick status transitions */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAction(lead.id, 'done')}
                      className={`py-1.5 rounded text-xs font-semibold transition-all border ${
                        lead.status === 'done'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container-high'
                      }`}
                    >
                      Sent DM
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(lead.id, 'replied')}
                      className={`py-1.5 rounded text-xs font-semibold transition-all border ${
                        lead.status === 'replied'
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container-high'
                      }`}
                    >
                      Replied
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 px-1">
                    <button
                      type="button"
                      onClick={() => handleAction(lead.id, 'snoozed')}
                      className="hover:text-primary transition-colors"
                    >
                      Snooze 24h
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(lead.id, 'skipped')}
                      className="hover:text-error transition-colors"
                    >
                      Skip Lead
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}

