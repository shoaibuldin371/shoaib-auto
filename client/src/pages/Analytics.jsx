import React, { useState } from 'react';

const TOP_SUBJECTS = [
  {
    subject: 'Loved your video on "{last_video_title}" — edited 2 sample clips for you',
    service: 'Video Editing',
    region: 'Worldwide',
    sent: 142,
    openRate: '78.2%',
    replyRate: '31.4%',
    badge: 'Winner'
  },
  {
    subject: 'Quick idea for {business_name}\'s TikTok & Instagram reels',
    service: 'Social Media',
    region: 'Pakistan',
    sent: 198,
    openRate: '74.5%',
    replyRate: '28.6%',
    badge: 'Top Local'
  },
  {
    subject: 'Cut video production costs by 70% with AI workflows for {business_name}',
    service: 'AI Video',
    region: 'Worldwide',
    sent: 110,
    openRate: '69.1%',
    replyRate: '22.0%',
    badge: 'High-Ticket'
  },
  {
    subject: 'Streamlining sprint delivery for {business_name}\'s dev team',
    service: 'Product Management',
    region: 'Pakistan',
    sent: 85,
    openRate: '64.7%',
    replyRate: '18.8%',
    badge: 'Steady'
  }
];

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('30d');

  return (
    <div className="flex flex-col w-full pb-20 space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-xs">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">
            <span>ReachOut Engine</span>
            <span>/</span>
            <span className="text-primary font-semibold">Intelligence Hub</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            Outreach Analytics &amp; Conversion Telemetry
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Real-time engagement telemetry across active Pakistan &amp; Worldwide client acquisition funnels.
          </p>
        </div>

        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-surface-container-lowest text-on-surface font-label-md text-label-md px-3 py-2 rounded-xl border border-surface-container-high shadow-sm focus:outline-none"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          <button
            type="button"
            onClick={() => alert('Exporting full outreach telemetry CSV...')}
            className="flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high text-on-surface hover:bg-surface-container-low transition-all font-label-md text-label-md font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        
        {/* KPI 1 */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 relative overflow-hidden">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-md text-label-md uppercase tracking-wider text-outline font-semibold">
              Overall Delivery
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
          </div>
          <div className="flex items-baseline gap-space-sm mb-1">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
              99.4%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="inline-flex items-center text-emerald-600 font-semibold">
              <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>+0.8%
            </span>
            <span className="text-outline">2,480 / 2,495 sent</span>
          </div>
          <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '99.4%' }}></div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 relative overflow-hidden">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-md text-label-md uppercase tracking-wider text-outline font-semibold">
              Average Open Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">drafts</span>
            </div>
          </div>
          <div className="flex items-baseline gap-space-sm mb-1">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
              68.4%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="inline-flex items-center text-emerald-600 font-semibold">
              <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>+4.2%
            </span>
            <span className="text-outline">Industry Avg: 42%</span>
          </div>
          <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-primary-container h-full rounded-full" style={{ width: '68.4%' }}></div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 relative overflow-hidden">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-md text-label-md uppercase tracking-wider text-outline font-semibold">
              Reply Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[18px]">reply_all</span>
            </div>
          </div>
          <div className="flex items-baseline gap-space-sm mb-1">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
              22.8%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="inline-flex items-center text-emerald-600 font-semibold">
              <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>+3.1%
            </span>
            <span className="text-outline">565 Total Replies</span>
          </div>
          <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '22.8%' }}></div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 relative overflow-hidden">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-label-md text-label-md uppercase tracking-wider text-outline font-semibold">
              Positive Response
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-[18px]">thumb_up</span>
            </div>
          </div>
          <div className="flex items-baseline gap-space-sm mb-1">
            <span className="font-headline-xl text-headline-xl font-bold text-emerald-700 tracking-tight">
              14.2%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span className="inline-flex items-center text-emerald-600 font-semibold">
              <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>+1.9%
            </span>
            <span className="text-outline">Booked calls &amp; WhatsApp chats</span>
          </div>
          <div className="w-full bg-surface-container-low h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '72%' }}></div>
          </div>
        </div>

      </div>

      {/* REGIONAL SPLIT COMPARISON: PAKISTAN VS WORLDWIDE */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 space-y-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-xs border-b border-surface-container-high/40">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Regional Performance Breakdown: Pakistan vs. Worldwide
            </h3>
            <p className="text-xs text-on-surface-variant">
              Comparing engagement between Pakistan local business outreach and worldwide creator/SaaS outreach.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-bold">
            Live Channel Tracking
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
          
          {/* Pakistan Column */}
          <div className="p-space-md rounded-xl bg-surface-container-low/60 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇵🇰</span>
                <div>
                  <h4 className="font-bold text-on-surface">Pakistan Local Outreach</h4>
                  <p className="text-xs text-emerald-700 font-semibold">Islamabad, Rawalpindi, Lahore, Karachi</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                WhatsApp Funnel
              </span>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between pb-1 border-b border-surface-container-high/40">
                <span className="text-on-surface-variant">Primary Channel:</span>
                <strong className="text-on-surface">WhatsApp Chat (03473547036)</strong>
              </div>
              <div className="flex justify-between pb-1 border-b border-surface-container-high/40">
                <span className="text-on-surface-variant">Total Prospects Reached:</span>
                <strong className="text-on-surface">1,240 businesses</strong>
              </div>
              <div className="flex justify-between pb-1 border-b border-surface-container-high/40">
                <span className="text-on-surface-variant">WhatsApp Click-Through:</span>
                <strong className="text-emerald-700 font-bold">34.2% (424 chats started)</strong>
              </div>
              <div className="flex justify-between pb-1 border-b border-surface-container-high/40">
                <span className="text-on-surface-variant">Average Retainer Won:</span>
                <strong className="text-on-surface">PKR 55,000 / month</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Top Responding City:</span>
                <strong className="text-emerald-800">Islamabad (F-6, F-10, Blue Area)</strong>
              </div>
            </div>
          </div>

          {/* Worldwide Column */}
          <div className="p-space-md rounded-xl bg-surface-container-low/60 border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌐</span>
                <div>
                  <h4 className="font-bold text-on-surface">Worldwide Outreach</h4>
                  <p className="text-xs text-primary font-semibold">US, UK, UAE (Dubai), Europe</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">
                Calendly Funnel
              </span>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between pb-1 border-b border-surface-container-high/40">
                <span className="text-on-surface-variant">Primary Channel:</span>
                <strong className="text-on-surface">Gmail SMTP + Calendly 15-min</strong>
              </div>
              <div className="flex justify-between pb-1 border-b border-surface-container-high/40">
                <span className="text-on-surface-variant">Total Prospects Reached:</span>
                <strong className="text-on-surface">1,255 creators &amp; brands</strong>
              </div>
              <div className="flex justify-between pb-1 border-b border-surface-container-high/40">
                <span className="text-on-surface-variant">Calendly Call Booking Rate:</span>
                <strong className="text-primary font-bold">18.6% (233 calls booked)</strong>
              </div>
              <div className="flex justify-between pb-1 border-b border-surface-container-high/40">
                <span className="text-on-surface-variant">Average Retainer Won:</span>
                <strong className="text-on-surface">$1,150 / month</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Top Responding Niche:</span>
                <strong className="text-primary">YouTube Creators &amp; Short-Form Podcasters</strong>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Winning Subject Lines Leaderboard */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 space-y-space-md">
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/40">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Winning Subject Lines Leaderboard
            </h3>
            <p className="text-xs text-on-surface-variant">
              Ranked by combined open &amp; response conversion rate.
            </p>
          </div>
          <span className="material-symbols-outlined text-primary text-[20px]">military_tech</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-container-high/60 text-outline font-semibold uppercase">
                <th className="pb-2">Subject Line Variant</th>
                <th className="pb-2">Service Module</th>
                <th className="pb-2">Scope</th>
                <th className="pb-2">Sent</th>
                <th className="pb-2">Open Rate</th>
                <th className="pb-2">Reply Rate</th>
                <th className="pb-2">Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {TOP_SUBJECTS.map((s, idx) => (
                <tr key={idx} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-2.5 font-medium text-on-surface max-w-sm truncate pr-2">
                    {s.subject}
                  </td>
                  <td className="py-2.5 text-on-surface-variant">{s.service}</td>
                  <td className="py-2.5">
                    <span className={`px-1.5 py-0.2 rounded font-semibold ${
                      s.region === 'Pakistan' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {s.region}
                    </span>
                  </td>
                  <td className="py-2.5 font-bold text-on-surface">{s.sent}</td>
                  <td className="py-2.5 font-bold text-primary">{s.openRate}</td>
                  <td className="py-2.5 font-bold text-emerald-700">{s.replyRate}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container font-bold text-primary">
                      {s.badge}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
