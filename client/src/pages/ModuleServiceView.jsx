import React, { useState, useEffect } from 'react';

const SERVICE_CONFIGS = {
  'social-media': {
    id: 'srv-social-media',
    slug: 'social-media',
    title: 'Social Media Management',
    code: 'MOD-SMM-2026',
    icon: 'share',
    headline: 'Social Media Growth Outreach Campaign',
    description: 'Targeted outreach for restaurants, gyms, cafes, and brands needing short-form TikTok & Instagram reels, daily community management, and organic viral growth.',
    portfolio: 'https://www.tiktok.com/@syed_ali_azzam',
    defaultExp: '4 months',
    industries: ['Restaurants & Cafes', 'Fitness & Gyms', 'E-commerce & Fashion', 'Real Estate'],
    pakistan: {
      tag: 'Pakistan Local Businesses (Islamabad, Lahore, Karachi)',
      ctaType: 'WhatsApp Chat',
      ctaText: 'Chat on WhatsApp (03473547036)',
      ctaUrl: 'https://wa.me/923473547036?text=Hi%20Shoaib,%20I%20saw%20your%20message%20about%20social%20media%20growth',
      pricing: 'PKR 45,000 – 90,000 / month',
      subjects: [
        'Quick idea for {business_name}\'s TikTok & Instagram reels',
        'Noticed your walk-in buzz in {city} — 3 ideas for viral short-form',
        'Can we boost {business_name}\'s weekend traffic with 15 reels/month?'
      ],
      day0Body: `Hi {first_name},\n\nI was looking through {business_name} in {city} and loved your customer vibe. {personal_hook}\n\nI run organic social media campaigns and short-form reels for businesses in Pakistan. Over the past 4 months, I helped local brands scale to 100k+ views on TikTok.\n\nHere is a quick live sample of the reels I produce: {portfolio_url}\n\nWould you be open to me sending 3 free reel ideas custom-made for {business_name} over WhatsApp?\n\nBest regards,\nShoaib ul Din\nIslamabad, Pakistan | 03473547036`,
      day3Subject: 'Re: 3 viral reel concepts for {business_name}',
      day3Body: `Hi {first_name},\n\nFollowing up on my note earlier. With {city}\'s market getting more competitive on TikTok and Instagram reels, short-form content is currently the highest ROI channel.\n\nLet me know if you would like to test 1 free sample reel for your page this week!\n\nShoaib ul Din | 03473547036`,
      day7Subject: 'Last note from Shoaib regarding {business_name}',
      day7Body: `Hi {first_name},\n\nI assume you are busy scaling operations right now. I won't crowd your inbox further, but if you ever want to revamp {business_name}\'s social presence and reels, feel free to text me on WhatsApp anytime.\n\nWhatsApp: https://wa.me/923473547036\n\nAll the best,\nShoaib`,
    },
    worldwide: {
      tag: 'Worldwide Brands & Agencies (US, UK, UAE, Europe)',
      ctaType: 'Calendly Call',
      ctaText: 'Book 15-min Discovery Call',
      ctaUrl: 'https://calendly.com/shoaibuldin371/15min',
      pricing: '$600 – $1,500 / month',
      subjects: [
        'Repurposing {business_name}\'s content into 30 viral shorts/month',
        'Scaling {business_name} on TikTok & Reels (Case study)',
        'Quick question regarding your short-form content pipeline'
      ],
      day0Body: `Hey {first_name},\n\nCame across {business_name} and was really impressed by your brand positioning. {personal_hook}\n\nI manage end-to-end short-form organic distribution (TikTok, Reels, Shorts), turning podcasts, long-form videos, and product demos into high-retention clips.\n\nSample portfolio: {portfolio_url}\n\nAre you free for a quick 15-minute call this Thursday to see 3 sample angles I prepared for {business_name}?\n\nBest,\nShoaib ul Din\nSocial Growth Strategist`,
      day3Subject: 'Re: 3 sample angles for {business_name}',
      day3Body: `Hey {first_name},\n\nQuick follow-up on my note from Tuesday. We recently achieved over 500k impressions on short-form content by optimizing the first 3-second hook.\n\nWould love to show you how this applies to {business_name}. Here is my calendar if you have 10 minutes: https://calendly.com/shoaibuldin371/15min\n\nBest,\nShoaib`,
      day7Subject: 'Closing the loop on {business_name}\'s short-form pipeline',
      day7Body: `Hey {first_name},\n\nI know your schedule is packed. Just closing the loop here. If you ever need a reliable operator to take over your short-form video creation and daily community growth, my door is open.\n\nPortfolio: {portfolio_url}\n\nCheers,\nShoaib ul Din`,
    }
  },
  'video-editing': {
    id: 'srv-video-editing',
    slug: 'video-editing',
    title: 'Video Editing (Short-Form & Reels)',
    code: 'MOD-VE-2026',
    icon: 'movie_edit',
    headline: 'High-Retention Video Editing Outreach',
    description: 'Outreach campaign for YouTube creators, podcasters, and digital agencies needing snappy pacing, sound design, motion graphics, and subtitle retention editing.',
    portfolio: 'https://video-portfolio-572m.vercel.app/',
    defaultExp: '3 years',
    industries: ['Content Creators', 'Digital Agencies', 'SaaS Brands', 'Coaches & Consultants'],
    pakistan: {
      tag: 'Pakistani Creators & Local Media Agencies',
      ctaType: 'WhatsApp Chat',
      ctaText: 'Message on WhatsApp (03473547036)',
      ctaUrl: 'https://wa.me/923473547036?text=Hi%20Shoaib,%20I%20saw%20your%20video%20editing%20samples',
      pricing: 'PKR 35,000 – 80,000 / month',
      subjects: [
        'Edited a 30s sample reel for {business_name}',
        'Dynamic captions & sound design for {business_name}',
        'Quick idea to increase watch time on your reels'
      ],
      day0Body: `Assalam o Alaikum {first_name},\n\nI checked out {business_name} and really liked your content. {personal_hook}\n\nI am a video editor based in Islamabad with 3 years of experience in high-retention short-form editing (Premiere Pro, After Effects, CapCut Pro). I specialize in retention pacing, dynamic sound effects, and clean typography.\n\nPortfolio: {portfolio_url}\n\nI'd love to edit 1 free test clip from your raw footage so you can evaluate the speed and quality firsthand. Can I send it over WhatsApp?\n\nRegards,\nShoaib ul Din\n03473547036`,
      day3Subject: 'Re: Free sample reel cut for {business_name}',
      day3Body: `Hi {first_name},\n\nJust bumping this in case you missed it. The offer still stands: send me 60 seconds of raw footage, and I'll edit a finished, retention-optimized reel within 24 hours at no cost.\n\nPortfolio: {portfolio_url}\n\nShoaib ul Din | 03473547036`,
      day7Subject: 'Last follow up on video editing for {business_name}',
      day7Body: `Hi {first_name},\n\nI won't bug you again. If you ever need an editor who understands 60%+ average watch time pacing, feel free to keep my contact saved.\n\nWhatsApp: 03473547036\nPortfolio: {portfolio_url}\n\nBest,\nShoaib`,
    },
    worldwide: {
      tag: 'US, UK & Global YouTube Creators & Podcasters',
      ctaType: 'Calendly Call',
      ctaText: 'Schedule 15-min Edit Review',
      ctaUrl: 'https://calendly.com/shoaibuldin371/15min',
      pricing: '$800 – $2,500 / month',
      subjects: [
        'Loved your latest episode — edited 2 sample clips for you',
        'Increasing retention on {business_name}\'s YouTube Shorts',
        'Quick question from a video editor (with samples)'
      ],
      day0Body: `Hey {first_name},\n\nReally enjoyed your recent video on {business_name}. {personal_hook}\n\nI have 3 years of experience editing high-retention short-form videos for top YouTube creators, podcast channels, and founders. My edits focus on 70%+ retention, pattern interrupts, sound design, and clean motion graphics.\n\nReview my portfolio here: {portfolio_url}\n\nI would love to take 1 raw clip off your hands and edit a sample reel completely free. If you like the result, we can discuss a monthly batch.\n\nBest,\nShoaib ul Din\nVideo Editor`,
      day3Subject: 'Re: Sample reel for {business_name}',
      day3Body: `Hey {first_name},\n\nFollowing up on my message from earlier this week. Check out this quick breakdown of how we improved viewer retention on a recent client clip: {portfolio_url}\n\nWould you be open to a 10-minute chat this week? https://calendly.com/shoaibuldin371/15min\n\nBest,\nShoaib`,
      day7Subject: 'Closing your ticket: {business_name} video editing',
      day7Body: `Hey {first_name},\n\nAssuming you are all set with your current editing team! If anything changes down the road and you need fast turnarounds with high retention, my portfolio is always live at {portfolio_url}.\n\nBest of luck with your channel,\nShoaib`,
    }
  },
  'ai-video': {
    id: 'srv-ai-video',
    slug: 'ai-video',
    title: 'AI Video Creation & Automation',
    code: 'MOD-AIV-2026',
    icon: 'smart_display',
    headline: 'AI Video Promo & Automation Campaign',
    description: 'Scalable outreach pitching AI promotional videos, synthetic avatar explainers, automated product demonstrations, and multilingual video generation for tech and e-commerce companies.',
    portfolio: 'https://video-portfolio-572m.vercel.app/',
    defaultExp: '4 months',
    industries: ['Tech Startups', 'E-commerce Brands', 'Real Estate Agencies', 'EdTech & Training'],
    pakistan: {
      tag: 'Pakistani Real Estate, Tech & E-commerce Brands',
      ctaType: 'WhatsApp Chat',
      ctaText: 'Chat on WhatsApp (03473547036)',
      ctaUrl: 'https://wa.me/923473547036?text=Hi%20Shoaib,%20tell%20me%20about%20AI%20video%20ads',
      pricing: 'PKR 40,000 – 75,000 / project',
      subjects: [
        'AI video ads for {business_name} without expensive shooting',
        'Generate 10 product videos for {business_name} with AI',
        'Quick demo: AI avatar explainer for your services'
      ],
      day0Body: `Hi {first_name},\n\nI was looking at {business_name} in {city} and saw great potential for automated video ads. {personal_hook}\n\nInstead of paying for expensive cameras, studio rentals, and actors, I create cinematic AI-generated product promos, voiceovers, and avatar explainers in both Urdu and English.\n\nSee our AI video showcase: {portfolio_url}\n\nCan I send you a 15-second AI video teaser made specifically for {business_name} over WhatsApp?\n\nBest regards,\nShoaib ul Din\n03473547036`,
      day3Subject: 'Re: AI video teaser for {business_name}',
      day3Body: `Hi {first_name},\n\nJust checking back. AI video workflows allow us to produce 10 high-converting video variations in the time it usually takes to shoot one traditional video.\n\nLet me know if you would like to see a custom mockup for {business_name}!\n\nShoaib | 03473547036`,
      day7Subject: 'Last note on AI video for {business_name}',
      day7Body: `Hi {first_name},\n\nI'll let you be! If you ever want to scale your marketing videos with AI, feel free to reach out anytime on WhatsApp: https://wa.me/923473547036\n\nBest,\nShoaib`,
    },
    worldwide: {
      tag: 'Global SaaS, Tech Startups & DTC Brands (US, Europe, UAE)',
      ctaType: 'Calendly Call',
      ctaText: 'Book 15-min AI Demo Call',
      ctaUrl: 'https://calendly.com/shoaibuldin371/15min',
      pricing: '$750 – $2,000 / batch',
      subjects: [
        'Scaling {business_name}\'s ad creative with generative AI video',
        'AI product demos & avatar explainers for {business_name}',
        'Cut video production costs by 70% with AI workflows'
      ],
      day0Body: `Hey {first_name},\n\nCame across {business_name} and love what you are building. {personal_hook}\n\nI build scalable AI video production pipelines for software and e-commerce companies — generating photorealistic product showcases, synthetic avatar explainers, and localized ad creatives without the overhead of physical studios.\n\nAI Video Portfolio: {portfolio_url}\n\nWould you be open to a 15-min call to see a sample AI concept tailored to {business_name}?\n\nBest,\nShoaib ul Din\nAI Video Producer`,
      day3Subject: 'Re: AI concept for {business_name}',
      day3Body: `Hey {first_name},\n\nQuick follow-up on my note regarding AI video automation. Here is a recent case study where we generated 20 ad variations in 48 hours: {portfolio_url}\n\nFeel free to grab a time here if you'd like a quick preview: https://calendly.com/shoaibuldin371/15min\n\nCheers,\nShoaib`,
      day7Subject: 'Closing the loop on {business_name} AI video pipeline',
      day7Body: `Hey {first_name},\n\nI know you're busy, so this is my final note. If you ever want to test generative AI video creatives for your funnel, my portfolio is always accessible at {portfolio_url}.\n\nAll the best,\nShoaib`,
    }
  },
  'product-manager': {
    id: 'srv-product-manager',
    slug: 'product-manager',
    title: 'Product Management & Coordination',
    code: 'MOD-PMC-2026',
    icon: 'inventory_2',
    headline: 'Agile Product Coordination Outreach',
    description: 'Targeted outreach to early-stage founders, B2B SaaS builders, and software agencies needing agile sprint coordination, PRD writing, backlog grooming, and developer delivery support.',
    portfolio: 'https://github.com/shoaib',
    defaultExp: '4 months',
    industries: ['B2B SaaS', 'Mobile Apps', 'Early-Stage Startups', 'Dev Agencies'],
    pakistan: {
      tag: 'Pakistani Software Houses & Tech Startups (Islamabad/Rawalpindi/Lahore)',
      ctaType: 'WhatsApp Chat',
      ctaText: 'Connect on WhatsApp (03473547036)',
      ctaUrl: 'https://wa.me/923473547036?text=Hi%20Shoaib,%20interested%20in%20product%20coordination',
      pricing: 'PKR 60,000 – 120,000 / month',
      subjects: [
        'Streamlining sprint delivery for {business_name}\'s dev team',
        'Junior Product Coordinator available for {business_name}',
        'Freeing up your engineering leads from sprint admin'
      ],
      day0Body: `Hi {first_name},\n\nI have been following {business_name}\'s growth in {city}. {personal_hook}\n\nI work as a Product Coordinator / Junior PM helping software houses and startups manage agile ceremonies, write clear PRDs, groom Jira backlogs, and ensure developers deliver sprints on time without engineering bottlenecks.\n\nCase studies & documentation: {portfolio_url}\n\nWould you be open to a quick WhatsApp voice note or chat to see if I can assist your engineering leads this quarter?\n\nBest regards,\nShoaib ul Din\n03473547036`,
      day3Subject: 'Re: Sprint coordination for {business_name}',
      day3Body: `Hi {first_name},\n\nJust following up. If your tech leads or CTO are spending too much time writing user stories or coordinating Jira tasks, I can jump in on a flexible monthly retainer to keep sprints on track.\n\nLet me know if you would like to connect! WhatsApp: 03473547036\n\nShoaib`,
      day7Subject: 'Last follow up regarding {business_name} product delivery',
      day7Body: `Hi {first_name},\n\nFinal check-in. If you need agile coordination support as your project pipeline grows, feel free to keep my details handy.\n\nWhatsApp: https://wa.me/923473547036\n\nBest,\nShoaib ul Din`,
    },
    worldwide: {
      tag: 'Global B2B SaaS & Tech Startups (US, UK, UAE, Remote)',
      ctaType: 'Calendly Call',
      ctaText: 'Schedule 15-min Sync',
      ctaUrl: 'https://calendly.com/shoaibuldin371/15min',
      pricing: '$800 – $1,800 / month',
      subjects: [
        'Agile coordination & PRD support for {business_name}',
        'Freeing up your founders/CTO from sprint management',
        'Product coordination support for {business_name}\'s roadmap'
      ],
      day0Body: `Hey {first_name},\n\nCame across {business_name} and was intrigued by your product roadmap. {personal_hook}\n\nI assist early-stage founders and engineering teams with product coordination: drafting clear user stories & acceptance criteria, grooming backlogs in Jira/Linear, and facilitating daily asynchronous standups.\n\nDocumentation & background: {portfolio_url}\n\nWould you be open to a 15-minute call this week to see if some extra PM bandwidth would help your engineering velocity?\n\nBest,\nShoaib ul Din\nProduct Coordinator`,
      day3Subject: 'Re: PM bandwidth for {business_name}',
      day3Body: `Hey {first_name},\n\nQuick follow-up on my note from Tuesday. Having clear PRDs and unblocked sprint backlogs typically saves developer teams 5–10 hours per sprint.\n\nHere is my link if you have 10 minutes: https://calendly.com/shoaibuldin371/15min\n\nBest,\nShoaib`,
      day7Subject: 'Closing out: product coordination for {business_name}',
      day7Body: `Hey {first_name},\n\nI understand priorities shift fast. If you ever need an agile coordinator to support your sprint delivery, feel free to reach out anytime.\n\nBest of luck with {business_name},\nShoaib`,
    }
  }
};

export default function ModuleServiceView({ slug }) {
  const config = SERVICE_CONFIGS[slug] || SERVICE_CONFIGS['social-media'];
  
  // Dedicated Pakistan vs Worldwide Mode State
  const [regionMode, setRegionMode] = useState('pakistan'); // 'pakistan' or 'worldwide'
  const [activeStep, setActiveStep] = useState(0); // 0 = Day 0, 1 = Day 3, 2 = Day 7
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  
  // Editable Service claims
  const [experienceText, setExperienceText] = useState(config.defaultExp);
  const [portfolioUrl, setPortfolioUrl] = useState(config.portfolio);
  const [isSavingExp, setIsSavingExp] = useState(false);
  const [saveExpMessage, setSaveExpMessage] = useState('');

  const currentContent = regionMode === 'pakistan' ? config.pakistan : config.worldwide;

  useEffect(() => {
    fetchLeads();
    fetchServiceSettings();
  }, [slug, regionMode]);

  async function fetchServiceSettings() {
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        const found = data.find(s => s.slug === slug);
        if (found) {
          if (found.experience_text) setExperienceText(found.experience_text);
          if (found.portfolio_url) setPortfolioUrl(found.portfolio_url);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchLeads() {
    setLoadingLeads(true);
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        // Filter leads matching this service and region
        const filtered = data.filter(l => {
          const matchService = !l.service_id || l.service_id === slug;
          const isPak = (l.country || '').toLowerCase().includes('pakistan') || 
            ['islamabad', 'lahore', 'karachi', 'rawalpindi', 'peshawar', 'multan', 'faisalabad'].some(c => (l.city || '').toLowerCase().includes(c));
          
          if (regionMode === 'pakistan') {
            return matchService && isPak;
          } else {
            return matchService && (!isPak || (l.country && !l.country.toLowerCase().includes('pakistan')));
          }
        });
        setLeads(filtered.length > 0 ? filtered : data.slice(0, 4));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeads(false);
    }
  }

  async function handleSaveExperience(e) {
    e.preventDefault();
    setIsSavingExp(true);
    setSaveExpMessage('');
    try {
      const res = await fetch(`/api/services/${config.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience_text: experienceText,
          portfolio_url: portfolioUrl
        })
      });
      if (res.ok) {
        setSaveExpMessage('Experience credentials successfully saved!');
        setTimeout(() => setSaveExpMessage(''), 4000);
      }
    } catch (err) {
      setSaveExpMessage('Failed to save experience.');
    } finally {
      setIsSavingExp(false);
    }
  }

  async function handleQueueLead(lead) {
    try {
      const subject = currentContent.subjects[selectedSubjectIdx].replace('{business_name}', lead.business_name);
      const body = currentContent.day0Body
        .replace('{first_name}', lead.first_name || lead.contact_name || 'there')
        .replace('{business_name}', lead.business_name)
        .replace('{city}', lead.city || 'your area')
        .replace('{personal_hook}', lead.personal_hook || '')
        .replace('{portfolio_url}', portfolioUrl);

      const res = await fetch(`/api/leads/${lead.id}/queue-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body,
          service_id: slug,
          region: regionMode,
        })
      });

      if (res.ok) {
        setActionSuccess(`Queued email for ${lead.business_name} for next run!`);
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="flex flex-col w-full pb-20 space-y-space-lg">
      {/* Sub-navigation / Breadcrumb & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
          <span>Outreach Modules</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-semibold">{config.title}</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface font-code-sm text-code-sm px-1.5 py-0.5 rounded bg-surface-container">
            {config.code}
          </span>
        </div>

        {/* REGION SEPARATOR TOGGLE - PAKISTAN VS WORLDWIDE */}
        <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-xl border border-surface-container-high shadow-sm">
          <button
            onClick={() => setRegionMode('pakistan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-semibold transition-all ${
              regionMode === 'pakistan'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="text-base">🇵🇰</span>
            <span>Pakistan Outreach</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${regionMode === 'pakistan' ? 'bg-emerald-700 text-white' : 'bg-surface-container'}`}>
              Local
            </span>
          </button>

          <button
            onClick={() => setRegionMode('worldwide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-semibold transition-all ${
              regionMode === 'worldwide'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="text-base">🌐</span>
            <span>Worldwide Outreach</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${regionMode === 'worldwide' ? 'bg-primary-container text-on-primary' : 'bg-surface-container'}`}>
              Global
            </span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-body-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700">✕</button>
        </div>
      )}

      {/* Header Banner Section */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container-high/40">
        <div className={`absolute -right-12 -top-12 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          regionMode === 'pakistan' ? 'bg-emerald-500/15' : 'bg-primary-fixed/20'
        }`}></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container font-code-sm text-code-sm mb-space-xs">
              <span className="material-symbols-outlined text-[16px] text-primary">{config.icon}</span>
              <span className="font-semibold text-primary">{config.headline}</span>
              <span className="text-outline">|</span>
              <span className={regionMode === 'pakistan' ? 'text-emerald-700 font-bold' : 'text-primary font-bold'}>
                {regionMode === 'pakistan' ? '🇵🇰 PAKISTAN LOCAL SPECIFIC' : '🌐 WORLDWIDE SPECIFIC'}
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
              {config.title} — {regionMode === 'pakistan' ? 'Pakistan Campaign' : 'Global Campaign'}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {config.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-surface-container-high/40 text-body-sm">
              <span className="text-on-surface-variant">
                Target: <strong className="text-on-surface">{currentContent.tag}</strong>
              </span>
              <span className="text-outline">•</span>
              <span className="text-on-surface-variant">
                CTA: <strong className={regionMode === 'pakistan' ? 'text-emerald-700' : 'text-primary'}>{currentContent.ctaText}</strong>
              </span>
              <span className="text-outline">•</span>
              <span className="text-on-surface-variant">
                Retainer: <strong className="text-on-surface">{currentContent.pricing}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-sm flex-shrink-0">
            <a
              href={currentContent.ctaUrl}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-space-xs px-space-md py-2.5 rounded-lg text-white font-label-lg text-label-lg shadow-sm transition-all ${
                regionMode === 'pakistan' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary-container hover:bg-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {regionMode === 'pakistan' ? 'chat' : 'calendar_today'}
              </span>
              <span>Test CTA Link</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column Sequence Timeline + Right Column Prospects & Experience */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        
        {/* Left Column: Sequence Timeline (Day 0, Day 3, Day 7) */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/50">
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high/40 mb-space-md">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">auto_stories</span>
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Automated Sequence Timeline
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {regionMode === 'pakistan' ? 'Tailored with WhatsApp CTA & PKR local context' : 'Tailored with Calendly 15-min CTA & global standard'}
                  </p>
                </div>
              </div>

              {/* Step tabs */}
              <div className="flex rounded-lg bg-surface-container-low p-1 gap-1">
                <button
                  onClick={() => setActiveStep(0)}
                  className={`px-3 py-1 rounded-md text-label-sm font-semibold transition-all ${
                    activeStep === 0 ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  Day 0 (Initial)
                </button>
                <button
                  onClick={() => setActiveStep(1)}
                  className={`px-3 py-1 rounded-md text-label-sm font-semibold transition-all ${
                    activeStep === 1 ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  Day 3 (Follow-Up 1)
                </button>
                <button
                  onClick={() => setActiveStep(2)}
                  className={`px-3 py-1 rounded-md text-label-sm font-semibold transition-all ${
                    activeStep === 2 ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
                  }`}
                >
                  Day 7 (Follow-Up 2)
                </button>
              </div>
            </div>

            {/* Subject lines A/B testing (for Day 0) */}
            {activeStep === 0 && (
              <div className="mb-space-md bg-surface-container-low p-space-md rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-sm text-label-sm uppercase font-semibold text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">science</span>
                    3 A/B Subject Lines ({regionMode.toUpperCase()})
                  </span>
                  <span className="text-body-sm text-on-surface-variant text-xs">Click variant to select</span>
                </div>
                <div className="space-y-1.5">
                  {currentContent.subjects.map((subj, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSubjectIdx(idx)}
                      className={`w-full text-left p-2.5 rounded-lg text-body-sm transition-all flex items-center justify-between border ${
                        selectedSubjectIdx === idx
                          ? 'bg-surface-container-lowest border-primary text-on-surface font-semibold shadow-sm'
                          : 'border-transparent hover:bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          selectedSubjectIdx === idx ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="truncate">{subj}</span>
                      </div>
                      {selectedSubjectIdx === idx && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-bold">
                          Active Variant
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email Body Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-label-sm uppercase font-semibold text-secondary">
                  {activeStep === 0 ? 'Initial Email Pitch' : activeStep === 1 ? 'Follow-Up #1 (Proof & Value)' : 'Follow-Up #2 (Breakup / Closing)'}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-code-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                    {activeStep > 0 ? 'Sent in Same Gmail Thread (In-Reply-To)' : 'New Gmail Thread'}
                  </span>
                </div>
              </div>

              <div className="p-space-md bg-surface-container-low rounded-xl font-code-sm text-code-sm text-on-surface whitespace-pre-wrap leading-relaxed border border-surface-container-high/60 shadow-inner">
                {activeStep === 0 && currentContent.day0Body}
                {activeStep === 1 && currentContent.day3Body}
                {activeStep === 2 && currentContent.day7Body}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs text-outline">Dynamic Tokens:</span>
                <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded text-xs">{'{first_name}'}</span>
                <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded text-xs">{'{business_name}'}</span>
                <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded text-xs">{'{city}'}</span>
                <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded text-xs">{'{personal_hook}'}</span>
                <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded text-xs">{'{portfolio_url}'}</span>
              </div>
            </div>
          </div>

          {/* Editable Experience & Portfolio Credentials for this Service */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/50">
            <div className="flex items-center justify-between mb-space-sm pb-space-xs border-b border-surface-container-high/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Editable Experience & Portfolio Credentials
                </h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-semibold">
                Syncs with AI Prompts
              </span>
            </div>

            {saveExpMessage && (
              <p className="text-emerald-700 bg-emerald-50 p-2 rounded-lg text-body-sm mb-3">
                {saveExpMessage}
              </p>
            )}

            <form onSubmit={handleSaveExperience} className="space-y-space-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface font-medium mb-1">
                    Experience Claim (e.g., "3 years", "4 months")
                  </label>
                  <input
                    type="text"
                    value={experienceText}
                    onChange={(e) => setExperienceText(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md border border-surface-container-high focus:outline-none focus:border-primary shadow-sm"
                  />
                  <p className="text-xs text-on-surface-variant mt-1">
                    Spec: Video Editing is 3 years; Social Media, AI Video & PM are 4 months. All editable.
                  </p>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface font-medium mb-1">
                    Portfolio / Case Study URL
                  </label>
                  <input
                    type="text"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md border border-surface-container-high focus:outline-none focus:border-primary shadow-sm"
                  />
                  <p className="text-xs text-on-surface-variant mt-1">
                    Tracked link redirect via /r/:id to detect interested prospects.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingExp}
                  className="px-space-md py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md font-semibold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{isSavingExp ? 'Saving...' : 'Save Service Credentials'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Matched Prospects for this Module & Region */}
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/50">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/40 mb-space-md">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">group</span>
                  <span>{regionMode === 'pakistan' ? 'Pakistan Leads' : 'Worldwide Leads'}</span>
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {leads.length} prospects matched for {config.title}
                </p>
              </div>

              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                regionMode === 'pakistan' ? 'bg-emerald-100 text-emerald-800' : 'bg-primary-fixed text-on-primary-fixed'
              }`}>
                {regionMode === 'pakistan' ? 'Pakistan Focus' : 'Global Focus'}
              </span>
            </div>

            {loadingLeads ? (
              <div className="p-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-[28px] text-primary mb-2">
                  progress_activity
                </span>
                <p>Loading prospects...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant bg-surface-container-low rounded-xl">
                <p className="font-medium text-on-surface">No prospects found for this region.</p>
                <p className="text-body-sm mt-1">Use the Lead Finder to search OpenStreetMap or import a CSV.</p>
              </div>
            ) : (
              <div className="space-y-space-sm max-h-[640px] overflow-y-auto pr-1">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-space-md rounded-xl bg-surface-container-low/70 hover:bg-surface-container-low transition-all border border-surface-container-high/50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-label-lg text-label-lg font-bold text-on-surface">
                          {lead.business_name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {lead.city || 'Islamabad'}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-primary">Score: {lead.lead_score || 85}/100</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        lead.status === 'contacted'
                          ? 'bg-blue-100 text-blue-800'
                          : lead.status === 'interested'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-surface-container-high text-on-surface'
                      }`}>
                        {lead.status}
                      </span>
                    </div>

                    {lead.personal_hook && (
                      <p className="text-xs text-on-surface bg-surface-container-lowest p-2 rounded-lg italic border border-surface-container-high/40">
                        "{lead.personal_hook}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-on-surface-variant truncate max-w-[180px]">
                        {lead.email || 'No email (Manual DM)'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {lead.email ? (
                          <button
                            onClick={() => handleQueueLead(lead)}
                            className="px-2.5 py-1 rounded bg-primary text-on-primary hover:bg-primary-container font-semibold transition-all flex items-center gap-1 text-xs"
                          >
                            <span className="material-symbols-outlined text-[14px]">schedule_send</span>
                            <span>Queue Email</span>
                          </button>
                        ) : (
                          <a
                            href={lead.socials?.whatsapp || `https://wa.me/923473547036?text=Hi%20${encodeURIComponent(lead.business_name)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-semibold transition-all flex items-center gap-1 text-xs"
                          >
                            <span className="material-symbols-outlined text-[14px]">chat</span>
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

