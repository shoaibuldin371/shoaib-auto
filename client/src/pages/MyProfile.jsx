import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_SERVICES = [
  {
    id: 'srv-video-editing',
    slug: 'video-editing',
    route: '/module-video-editing',
    name: 'Video Editing',
    title: 'High-Retention Video Editing',
    experience_text: '3 years',
    description: 'Dynamic short-form video editing for Reels, TikTok, and YouTube Shorts with snappy pacing, sound design, and kinetic typography.',
    portfolio_url: 'https://video-portfolio-572m.vercel.app/',
    industries: ['Content Creators', 'Digital Agencies', 'SaaS Brands', 'Coaches'],
    icon: 'movie_edit',
    accent: 'border-l-primary',
  },
  {
    id: 'srv-social-media',
    slug: 'social-media',
    route: '/module-social-media',
    name: 'Social Media Management',
    title: 'Social Media Growth Systems',
    experience_text: '4 months',
    description: 'End-to-end short-form content creation, community engagement, and organic brand scaling across TikTok, Instagram, and Facebook.',
    portfolio_url: 'https://www.tiktok.com/@syed_ali_azzam',
    industries: ['Restaurants & Cafes', 'Fitness & Gyms', 'E-commerce', 'Real Estate'],
    icon: 'share',
    accent: 'border-l-emerald-600',
  },
  {
    id: 'srv-ai-video',
    slug: 'ai-video',
    route: '/module-ai-video',
    name: 'AI Video Creation',
    title: 'AI Video & Synthetic Avatars',
    experience_text: '4 months',
    description: 'Scalable AI promotional videos, synthetic avatar explainers, automated product demonstrations, and cost-effective ad creatives.',
    portfolio_url: 'https://video-portfolio-572m.vercel.app/',
    industries: ['Tech Startups', 'E-commerce Brands', 'Real Estate', 'EdTech'],
    icon: 'smart_display',
    accent: 'border-l-purple-600',
  },
  {
    id: 'srv-product-manager',
    slug: 'product-manager',
    route: '/module-product-manager',
    name: 'Product Management',
    title: 'Agile Product Coordination',
    experience_text: '4 months',
    description: 'Agile sprint coordination, backlog grooming, PRD documentation, user story refinement, and unblocking engineering teams.',
    portfolio_url: 'https://github.com/shoaib',
    industries: ['B2B SaaS', 'Mobile Apps', 'Early Startups', 'Dev Agencies'],
    icon: 'inventory_2',
    accent: 'border-l-amber-600',
  },
];

export default function MyProfile() {
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [editingId, setEditingId] = useState(null);
  const [editExp, setEditExp] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        setServices(prev => prev.map(s => {
          const match = data.find(d => d.slug === s.slug || d.id === s.id);
          if (match) {
            return {
              ...s,
              experience_text: match.experience_text || s.experience_text,
              portfolio_url: match.portfolio_url || s.portfolio_url,
            };
          }
          return s;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }

  function startEditing(service) {
    setEditingId(service.id);
    setEditExp(service.experience_text);
    setEditUrl(service.portfolio_url);
  }

  async function handleSaveService(id) {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience_text: editExp,
          portfolio_url: editUrl,
        })
      });
      if (res.ok) {
        setServices(prev => prev.map(s => s.id === id ? { ...s, experience_text: editExp, portfolio_url: editUrl } : s));
        setEditingId(null);
        setSaveSuccess('Service credentials successfully updated!');
        setTimeout(() => setSaveSuccess(''), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="flex flex-col w-full pb-20 space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-space-xs gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
              Master Freelancer Profile
            </span>
            <span className="text-outline text-xs">•</span>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
              Prompt Context Source
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            Profile &amp; Freelancer Services
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Credentials and service offerings used by Gemini AI to automatically personalize cold pitches.
          </p>
        </div>

        <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded-xl shadow-sm">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface font-bold">AI Pitch Context: Active</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">Verified in Supabase</span>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-body-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>{saveSuccess}</span>
          </div>
          <button onClick={() => setSaveSuccess('')}>✕</button>
        </div>
      )}

      {/* Shoaib ul Din Showcase Bento Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg relative overflow-hidden border border-surface-container-high/60">
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-primary-fixed/20 blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
          <div className="flex flex-col sm:flex-row gap-space-lg items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-2xl shadow-md border-2 border-primary">
                SD
              </div>
              <span className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-surface-container-lowest shadow-sm px-2 py-0.5 rounded-full text-xs font-bold text-emerald-600 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active
              </span>
            </div>

            {/* Identity & Bio */}
            <div className="space-y-1 max-w-xl">
              <div className="flex flex-wrap items-center gap-space-xs">
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                  Shoaib ul Din
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                  Freelancer Pro
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-label-sm font-semibold">
                  Top Rated
                </span>
              </div>

              <p className="font-headline-sm text-sm text-primary font-semibold">
                Video Editor &amp; Social Media Manager
              </p>

              <div className="flex flex-wrap items-center gap-space-xs text-on-surface-variant font-body-sm text-xs pt-1">
                <span className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[15px] text-outline">location_on</span>
                  <span>Islamabad, Pakistan</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[15px] text-outline">schedule</span>
                  <span>PKT (UTC+5)</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[15px] text-outline">call</span>
                  <span>03473547036</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[15px] text-outline">mail</span>
                  <span>Mshoaibuldin371@gmail.com</span>
                </span>
              </div>

              <p className="font-body-md text-body-md text-on-surface-variant pt-2 leading-relaxed">
                Specializing in high-retention short-form video editing, viral social growth systems, AI-generated synthetic ads, and agile product coordination for founders and creators worldwide.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-col gap-2 min-w-[220px]">
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Active Pipeline:</span>
              <strong className="text-on-surface">28 Qualified Leads</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Pakistan Outreach:</span>
              <strong className="text-emerald-700">WhatsApp Direct</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Worldwide Outreach:</span>
              <strong className="text-primary">Gmail SMTP + Calendly</strong>
            </div>
          </div>
        </div>
      </div>

      {/* The 4 Freelance Service Offerings */}
      <div className="space-y-space-md">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            The 4 Service Modules &amp; Experience Settings
          </h2>
          <span className="text-xs text-on-surface-variant">
            Default experience: Video Editing 3 yrs, others 4 mos (all editable)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {services.map(service => (
            <div
              key={service.id}
              className={`p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm border-l-4 ${service.accent} flex flex-col justify-between space-y-3`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                      {service.icon}
                    </span>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        {service.name}
                      </h3>
                      <p className="text-xs text-secondary font-medium">{service.title}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-surface-container font-code-sm text-xs font-bold text-primary">
                    {service.experience_text}
                  </span>
                </div>

                <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                  {service.description}
                </p>

                {/* Industries */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {service.industries.map((ind, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-surface-container-low text-on-surface font-medium">
                      {ind}
                    </span>
                  ))}
                </div>

                {/* Inline Editing Form */}
                {editingId === service.id ? (
                  <div className="mt-3 p-3 bg-surface-container-low rounded-lg space-y-2 border border-surface-container-high">
                    <div>
                      <label className="text-xs font-bold text-on-surface block">Experience Claim:</label>
                      <input
                        type="text"
                        value={editExp}
                        onChange={(e) => setEditExp(e.target.value)}
                        className="w-full h-8 px-2 rounded bg-surface-container-lowest text-xs border border-surface-container-high mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-on-surface block">Portfolio URL:</label>
                      <input
                        type="text"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full h-8 px-2 rounded bg-surface-container-lowest text-xs border border-surface-container-high mt-1"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 rounded text-xs text-on-surface-variant"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveService(service.id)}
                        className="px-3 py-1 rounded bg-primary text-on-primary text-xs font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-on-surface-variant flex items-center justify-between">
                    <span className="truncate max-w-[220px]">
                      Portfolio: <a href={service.portfolio_url} target="_blank" rel="noreferrer" className="text-primary underline">{service.portfolio_url}</a>
                    </span>
                    <button
                      type="button"
                      onClick={() => startEditing(service)}
                      className="text-primary hover:underline text-xs font-semibold flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      <span>Edit Credentials</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Module Launch Button */}
              <div className="pt-2 border-t border-surface-container-high/40 flex justify-end">
                <Link
                  to={service.route}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 text-xs"
                >
                  <span>Launch Outreach Module</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

