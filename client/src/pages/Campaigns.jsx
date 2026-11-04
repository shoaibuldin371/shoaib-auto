import React, { useState, useEffect } from 'react';

const INITIAL_QUEUE = [
  {
    id: 'q-101',
    lead_name: 'Salman Khan',
    business_name: 'Chaaye Khana F-6',
    email: 'contact@chaayekhana.com',
    city: 'Islamabad',
    region: 'pakistan',
    service: 'Social Media Management',
    subject: 'Quick idea for Chaaye Khana F-6\'s TikTok & Instagram reels',
    scheduled_for: 'Today, 10:00 AM PKT',
    status: 'pending_approval',
    body: `Hi Salman,\n\nI was looking through Chaaye Khana in Islamabad and loved your customer vibe. Loved seeing your evening footfall in Islamabad — short-form video could easily double it.\n\nOver the past 4 months, I helped local Pakistani brands scale to 100k+ views on TikTok.\n\nHere is a quick live sample of the reels I produce: https://www.tiktok.com/@syed_ali_azzam\n\nWould you be open to me sending 3 free reel ideas custom-made for Chaaye Khana over WhatsApp?\n\nBest regards,\nShoaib ul Din\n03473547036`
  },
  {
    id: 'q-102',
    lead_name: 'Hamza Tariq',
    business_name: 'FitFusion Elite Gym F-10',
    email: 'info@fitfusion.pk',
    city: 'Islamabad',
    region: 'pakistan',
    service: 'Video Editing',
    subject: 'Dynamic captions & sound design for FitFusion',
    scheduled_for: 'Today, 10:00 AM PKT',
    status: 'pending_approval',
    body: `Hi Hamza,\n\nI noticed your high-energy trainer transformations at FitFusion and had an idea for fast-paced workout reels.\n\nPortfolio: https://video-portfolio-572m.vercel.app/\n\nLet me know if you would like me to edit 1 free test reel for your trainers!\n\nShoaib ul Din | 03473547036`
  },
  {
    id: 'q-103',
    lead_name: 'Marcus Brody',
    business_name: 'Apex Horizon Studios',
    email: 'marcus@apexhorizon.com',
    city: 'Austin, TX',
    region: 'worldwide',
    service: 'AI Video Creation',
    subject: 'Scaling ad creative with generative AI video for Apex Horizon',
    scheduled_for: 'Today, 04:00 PM PKT',
    status: 'approved',
    body: `Hey Marcus,\n\nCame across Apex Horizon and love what you are building. Cut video production costs by 70% with AI workflows.\n\nPortfolio: https://video-portfolio-572m.vercel.app/\n\nFree for 15-min call this Thursday? https://calendly.com/shoaibuldin371/15min\n\nBest,\nShoaib`
  }
];

export default function Campaigns() {
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [nextRunTime, setNextRunTime] = useState('10:00 AM PKT');
  const [triggering, setTriggering] = useState(false);
  const [executionLog, setExecutionLog] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');

  useEffect(() => {
    fetchCronQueue();
  }, []);

  async function fetchCronQueue() {
    try {
      const res = await fetch('/api/cron/queue');
      if (res.ok) {
        const data = await res.json();
        if (data.nextRun) setNextRunTime(data.nextRun);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleApprove(id) {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'approved' } : q));
  }

  async function handleReject(id) {
    setQueue(prev => prev.filter(q => q.id !== id));
  }

  async function handleTriggerNow() {
    setTriggering(true);
    setExecutionLog('Initiating immediate dispatch via Gmail SMTP (45-150s jitter)...');
    try {
      const res = await fetch('/api/cron/trigger-now', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setExecutionLog(`Success! Dispatched batch. Copies saved in Shoaib's Gmail Sent folder. Details: ${data.details || 'Dispatched 2 emails.'}`);
        setQueue(prev => prev.map(q => ({ ...q, status: 'sent' })));
      } else {
        setExecutionLog(`Failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      setExecutionLog(`Error executing dispatch: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  }

  const filteredQueue = queue.filter(q => {
    if (regionFilter === 'pakistan') return q.region === 'pakistan';
    if (regionFilter === 'worldwide') return q.region === 'worldwide';
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-20 space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-space-xs gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
              Automation Dispatcher
            </span>
            <span className="text-outline text-xs">/</span>
            <span className="font-label-md text-label-md text-secondary">Scheduled Runs</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            Approval Queue &amp; Scheduled Runs
          </h1>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            onClick={handleTriggerNow}
            disabled={triggering}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-semibold transition-all shadow-sm"
          >
            <span className={`material-symbols-outlined text-[18px] ${triggering ? 'animate-spin' : ''}`}>
              rocket_launch
            </span>
            <span>{triggering ? 'Dispatching...' : 'Trigger Dispatch Run Now'}</span>
          </button>
        </div>
      </div>

      {executionLog && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-body-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">info</span>
            <span>{executionLog}</span>
          </div>
          <button onClick={() => setExecutionLog('')}>✕</button>
        </div>
      )}

      {/* Top Telemetry Bento: Pacing & Warm-up */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        
        {/* Card 1: Next Run */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-outline font-semibold">Next Scheduled Run</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            {nextRunTime}
          </h3>
          <p className="text-xs text-on-surface-variant">
            Runs twice daily: 10:00 &amp; 16:00 Asia/Karachi (05:00 &amp; 11:00 UTC).
          </p>
        </div>

        {/* Card 2: Warm-up Progression */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-outline font-semibold">Warm-Up Progression</span>
            <span className="text-xs font-semibold text-primary">Day 4 / 21</span>
          </div>
          <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            20 / day limit
          </h3>
          <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-primary h-full rounded-full" style={{ width: '40%' }}></div>
          </div>
          <p className="text-xs text-on-surface-variant">
            Starts at 15/day, +5 every 3 days up to 50/day max to protect Gmail reputation.
          </p>
        </div>

        {/* Card 3: Anti-Spam Pacing */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-outline font-semibold">Sending Safeguards</span>
            <span className="material-symbols-outlined text-[18px] text-emerald-600">shield</span>
          </div>
          <h3 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            45–150s Delay
          </h3>
          <p className="text-xs text-on-surface-variant">
            Random humanized jitter between dispatches. Respects Sunday skip policy.
          </p>
        </div>

      </div>

      {/* Approval Queue Section */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/50 p-space-lg space-y-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs border-b border-surface-container-high/40">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Pending Outreach Queue ({filteredQueue.length})
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Review and approve emails before automated dispatch.
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
              All
            </button>
            <button
              onClick={() => setRegionFilter('pakistan')}
              className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1 ${
                regionFilter === 'pakistan' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              <span>🇵🇰</span> Pakistan Local
            </button>
            <button
              onClick={() => setRegionFilter('worldwide')}
              className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1 ${
                regionFilter === 'worldwide' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              <span>🌐</span> Worldwide
            </button>
          </div>
        </div>

        {filteredQueue.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[36px] text-outline mb-2">done_all</span>
            <p className="font-medium text-on-surface">Queue is currently clear.</p>
            <p className="text-xs mt-1">Queue leads from the 4 Outreach Modules or the Lead Finder.</p>
          </div>
        ) : (
          <div className="space-y-space-md">
            {filteredQueue.map(item => (
              <div
                key={item.id}
                className="p-space-md rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 space-y-space-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container-high/40">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      item.region === 'pakistan' ? 'bg-emerald-100 text-emerald-800' : 'bg-primary-fixed text-on-primary-fixed'
                    }`}>
                      {item.region === 'pakistan' ? '🇵🇰 PAKISTAN' : '🌐 WORLDWIDE'}
                    </span>
                    <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
                      {item.business_name} ({item.lead_name})
                    </h3>
                    <span className="text-outline text-xs">•</span>
                    <span className="text-xs text-on-surface-variant">{item.email}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    item.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status === 'approved' ? 'Approved for Next Run' : 'Awaiting Approval'}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold text-on-surface mb-1">
                    Subject: {item.subject}
                  </div>
                  <div className="p-3 bg-surface-container-lowest rounded-lg font-code-sm text-xs text-on-surface whitespace-pre-wrap leading-relaxed border border-surface-container-high/40">
                    {item.body}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span>Scheduled for: {item.scheduled_for}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleReject(item.id)}
                      className="px-3 py-1.5 rounded-lg text-error hover:bg-error-container text-xs font-semibold transition-all"
                    >
                      Reject
                    </button>
                    {item.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>Approve Email</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
