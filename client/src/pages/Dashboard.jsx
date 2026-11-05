import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    fetch('/api/cron/status')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => console.error(err));
  }, []);

  async function handleResumeSending() {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_paused: false, auto_pause_reason: '' }),
      });
      setSystemStatus(prev => ({ ...prev, auto_paused: false, auto_pause_reason: '' }));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="flex flex-col w-full gap-space-xl pb-16">
      {/* RED SAFETY ALERT BANNER IF AUTO-PAUSED */}
      {systemStatus?.auto_paused && (
        <div className="p-space-md rounded-xl bg-red-50 border-2 border-red-500 text-red-950 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm shadow-md animate-pulse">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-red-600 text-[28px]">error</span>
            <div>
              <h4 className="font-bold text-base text-red-900">
                Outreach Automatically Paused by Safety Guardrails
              </h4>
              <p className="text-xs text-red-800">
                Reason: {systemStatus.auto_pause_reason || 'Recent bounce rate exceeded 5% limit'}. All dispatches are halted.
              </p>
            </div>
          </div>
          <button
            onClick={handleResumeSending}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap"
          >
            Acknowledge &amp; Resume Sending
          </button>
        </div>
      )}

      {/* Top Greeting & Header Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight flex items-center gap-space-xs font-bold">
            Welcome back, Shoaib <span className="inline-block hover:rotate-12 transition-transform cursor-default">👋</span>
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Here is your outreach activity and conversion metrics over the last 30 days.
          </p>
        </div>
        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <button
            className="flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-surface-container-lowest shadow-sm hover:bg-surface-container transition-colors text-on-surface font-label-md text-label-md border border-surface-container-high/60"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
            <span>Last 30 Days</span>
            <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
          </button>
          <NavLink
            to="/lead-finder"
            className="flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-primary-container text-on-primary shadow-sm hover:bg-primary transition-all font-label-md text-label-md font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">person_search</span>
            <span>Find Leads</span>
          </NavLink>
        </div>
      </section>

      {/* 4 Top KPI Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
        {/* Stat 1 */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between transition-all hover:shadow-md group border border-surface-container-high/60">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md uppercase tracking-wider text-outline font-semibold">Emails Sent</span>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">send</span>
            </div>
          </div>
          <div className="my-space-md">
            <div className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">2,480</div>
          </div>
          <div className="flex items-center justify-between font-body-sm text-body-sm">
            <div className="flex items-center gap-1 text-primary font-medium">
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              <span>+14.2%</span>
            </div>
            <span className="text-outline">vs last month</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between transition-all hover:shadow-md group border border-surface-container-high/60">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md uppercase tracking-wider text-outline font-semibold">Open Rate</span>
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">drafts</span>
            </div>
          </div>
          <div className="my-space-md">
            <div className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">42.8%</div>
          </div>
          <div className="flex items-center justify-between font-body-sm text-body-sm">
            <div className="flex items-center gap-1 text-primary font-medium">
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              <span>+3.1%</span>
            </div>
            <span className="text-outline">High Deliverability</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between transition-all hover:shadow-md group border border-surface-container-high/60">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md uppercase tracking-wider text-outline font-semibold">Reply Rate</span>
            <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">forum</span>
            </div>
          </div>
          <div className="my-space-md">
            <div className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">8.4%</div>
          </div>
          <div className="flex items-center justify-between font-body-sm text-body-sm">
            <div className="flex items-center gap-1 text-primary font-medium">
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              <span>+1.6%</span>
            </div>
            <span className="text-outline">68 Interested</span>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between transition-all hover:shadow-md group border border-surface-container-high/60">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md uppercase tracking-wider text-outline font-semibold">Meetings Booked</span>
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">event_available</span>
            </div>
          </div>
          <div className="my-space-md">
            <div className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">14</div>
          </div>
          <div className="flex items-center justify-between font-body-sm text-body-sm">
            <div className="flex items-center gap-1 text-primary font-medium">
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              <span>+4 calls</span>
            </div>
            <span className="text-outline">Target: 20/mo</span>
          </div>
        </div>
      </section>

      {/* The 4 Services Quick Modules Grid */}
      <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 space-y-space-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              The 4 Outreach Services
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Individual campaign stats, leads, and personalized email sequences
            </p>
          </div>
          <NavLink to="/settings" className="font-label-md text-label-md text-primary hover:underline font-semibold">
            Edit Experience Claims →
          </NavLink>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Card 1 */}
          <NavLink
            to="/module-social-media"
            className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-surface-container-lowest text-primary">
                  <span className="material-symbols-outlined text-[20px]">share</span>
                </span>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                  4 mo exp
                </span>
              </div>
              <h3 className="font-label-lg text-label-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                Social Media Management
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
                TikTok, Instagram &amp; Facebook organic content &amp; short clips.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-container-high flex items-center justify-between text-body-sm">
              <span className="text-outline">Active Leads</span>
              <span className="font-bold text-on-surface">142</span>
            </div>
          </NavLink>

          {/* Card 2 */}
          <NavLink
            to="/module-video-editing"
            className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-surface-container-lowest text-primary">
                  <span className="material-symbols-outlined text-[20px]">movie_edit</span>
                </span>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-semibold">
                  3 yr exp
                </span>
              </div>
              <h3 className="font-label-lg text-label-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                Video Editing
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
                High-retention short-form reels, pacing, dynamic captions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-container-high flex items-center justify-between text-body-sm">
              <span className="text-outline">Active Leads</span>
              <span className="font-bold text-on-surface">98</span>
            </div>
          </NavLink>

          {/* Card 3 */}
          <NavLink
            to="/module-ai-video"
            className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-surface-container-lowest text-primary">
                  <span className="material-symbols-outlined text-[20px]">smart_display</span>
                </span>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                  4 mo exp
                </span>
              </div>
              <h3 className="font-label-lg text-label-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                AI Video Creation
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
                Scalable AI-assisted promo videos and product showcases.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-container-high flex items-center justify-between text-body-sm">
              <span className="text-outline">Active Leads</span>
              <span className="font-bold text-on-surface">64</span>
            </div>
          </NavLink>

          {/* Card 4 */}
          <NavLink
            to="/module-product-manager"
            className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-surface-container-lowest text-primary">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </span>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                  4 mo exp
                </span>
              </div>
              <h3 className="font-label-lg text-label-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                Product Management
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
                PRDs, backlog coordination, user research, agile delivery.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-container-high flex items-center justify-between text-body-sm">
              <span className="text-outline">Active Leads</span>
              <span className="font-bold text-on-surface">51</span>
            </div>
          </NavLink>
        </div>
      </section>
    </div>
  );
}

