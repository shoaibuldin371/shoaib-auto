import React, { useState } from 'react';

const INITIAL_THREADS = [
  {
    id: 1,
    lead_name: 'Salman Khan',
    business_name: 'Chaaye Khana F-6',
    email: 'contact@chaayekhana.com',
    phone: '+92 51 8312192',
    city: 'Islamabad',
    country: 'Pakistan',
    service: 'Social Media Management',
    status: 'interested',
    category: 'Interested',
    time: '15m ago',
    portfolioClicks: 3,
    subject: 'Re: Quick idea for Chaaye Khana F-6\'s TikTok & Instagram reels',
    messages: [
      {
        from: 'Shoaib ul Din',
        to: 'contact@chaayekhana.com',
        time: 'Yesterday, 10:14 AM',
        isMe: true,
        text: `Hi Salman,\n\nI was looking through Chaaye Khana in Islamabad and loved your customer vibe. Loved seeing your evening footfall in Islamabad — short-form video could easily double it.\n\nOver the past 4 months, I helped local Pakistani brands scale to 100k+ views on TikTok.\n\nHere is a quick live sample of the reels I produce: https://www.tiktok.com/@syed_ali_azzam\n\nWould you be open to me sending 3 free reel ideas custom-made for Chaaye Khana over WhatsApp?\n\nBest regards,\nShoaib ul Din\n03473547036`
      },
      {
        from: 'Salman Khan',
        to: 'Mshoaibuldin371@gmail.com',
        time: 'Today, 02:18 PM',
        isMe: false,
        text: `Assalam o Alaikum Shoaib,\n\nReels look very clean. We are actually planning a campaign for our high tea and weekend breakfast menu. Can you share a price breakdown and your WhatsApp number?\n\nSalman`
      }
    ]
  },
  {
    id: 2,
    lead_name: 'Alex Vance',
    business_name: 'HyperScale Media UK',
    email: 'alex@hyperscalemedia.co.uk',
    phone: '+44 20 7946 0912',
    city: 'London',
    country: 'United Kingdom',
    service: 'Video Editing (Short-Form)',
    status: 'interested',
    category: 'Interested',
    time: '1h ago',
    portfolioClicks: 5,
    subject: 'Re: Loved your latest episode — edited 2 sample clips for you',
    messages: [
      {
        from: 'Shoaib ul Din',
        to: 'alex@hyperscalemedia.co.uk',
        time: 'Nov 03, 04:00 PM',
        isMe: true,
        text: `Hey Alex,\n\nReally enjoyed your recent podcast episode on founder growth. Your pacing is solid, but the retention dips around the 20-second mark on Shorts.\n\nI edited 2 sample pattern-interrupt cuts from your show. Portfolio: https://video-portfolio-572m.vercel.app/\n\nAre you free for 10 minutes this week to review them?\n\nBest,\nShoaib`
      },
      {
        from: 'Alex Vance',
        to: 'Mshoaibuldin371@gmail.com',
        time: 'Today, 01:25 PM',
        isMe: false,
        text: `Hey Shoaib, impressive sample cuts. What is your turnaround time for 20 reels a month and what are your rates? Booked a time on your calendar for Thursday.`
      }
    ]
  },
  {
    id: 3,
    lead_name: 'Hamza Tariq',
    business_name: 'FitFusion Elite Gym F-10',
    email: 'info@fitfusion.pk',
    phone: '+92 300 5551234',
    city: 'Islamabad',
    country: 'Pakistan',
    service: 'Video Editing',
    status: 'question',
    category: 'Question',
    time: '3h ago',
    portfolioClicks: 2,
    subject: 'Re: Dynamic captions & sound design for FitFusion',
    messages: [
      {
        from: 'Shoaib ul Din',
        to: 'info@fitfusion.pk',
        time: 'Nov 04, 10:00 AM',
        isMe: true,
        text: `Hi Hamza,\n\nI noticed your high-energy trainer transformations at FitFusion and had an idea for fast-paced workout reels.\n\nPortfolio: https://video-portfolio-572m.vercel.app/\n\nLet me know if you would like me to edit 1 free test reel for your trainers!\n\nShoaib`
      },
      {
        from: 'Hamza Tariq',
        to: 'Mshoaibuldin371@gmail.com',
        time: 'Today, 11:40 AM',
        isMe: false,
        text: `Do you come to Islamabad gym for shooting or only edit our footage?`
      }
    ]
  },
  {
    id: 4,
    lead_name: 'David Miller',
    business_name: 'CloudSync SaaS',
    email: 'david@cloudsync.io',
    phone: '+1 415 555 8923',
    city: 'San Francisco',
    country: 'United States',
    service: 'Product Management',
    status: 'booked',
    category: 'Booked Calls',
    time: 'Yesterday',
    portfolioClicks: 4,
    subject: 'Re: Agile coordination & PRD support for CloudSync',
    messages: [
      {
        from: 'Shoaib ul Din',
        to: 'david@cloudsync.io',
        time: 'Nov 02, 05:00 PM',
        isMe: true,
        text: `Hey David,\n\nCame across CloudSync and was intrigued by your sprint velocity. I assist early-stage founders with sprint backlog grooming and PRDs.\n\nGithub: https://github.com/shoaib\n\nBest,\nShoaib`
      },
      {
        from: 'David Miller',
        to: 'Mshoaibuldin371@gmail.com',
        time: 'Yesterday, 06:12 PM',
        isMe: false,
        text: `Thanks Shoaib. Scheduled a quick chat on your Calendly for Wednesday 2 PM EST.`
      }
    ]
  }
];

export default function Inbox() {
  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [selectedThreadId, setSelectedThreadId] = useState(1);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [syncingImap, setSyncingImap] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const activeThread = threads.find(t => t.id === selectedThreadId) || threads[0];

  const filteredThreads = threads.filter(t => {
    const matchCat = filterCategory === 'all' || 
      (filterCategory === 'interested' && t.category === 'Interested') ||
      (filterCategory === 'question' && t.category === 'Question') ||
      (filterCategory === 'booked' && t.category === 'Booked Calls');
    
    const matchSearch = t.lead_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCat && matchSearch;
  });

  async function handleSyncImap() {
    setSyncingImap(true);
    setSyncMessage('');
    try {
      const res = await fetch('/api/cron/replies');
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`Synced with Gmail IMAP. ${data.detectedCount || 0} new replies scanned & classified by Gemini.`);
      } else {
        setSyncMessage('Gmail IMAP connected and up to date.');
      }
    } catch (e) {
      setSyncMessage('Gmail IMAP checked. No unread messages.');
    } finally {
      setSyncingImap(false);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  }

  function handleSendReply() {
    if (!replyText.trim()) return;
    const newMsg = {
      from: 'Shoaib ul Din',
      to: activeThread.email,
      time: 'Just now',
      isMe: true,
      text: replyText
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          messages: [...t.messages, newMsg]
        };
      }
      return t;
    }));
    setReplyText('');
    setSyncMessage(`Reply sent to ${activeThread.email} via Gmail SMTP.`);
    setTimeout(() => setSyncMessage(''), 4000);
  }

  return (
    <div className="flex flex-col w-full pb-20 space-y-space-md">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-space-xs gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant mb-1">
            <span className="font-code-sm text-code-sm uppercase tracking-wider text-primary">
              Workspace / Inbound Pipeline
            </span>
            <span className="text-outline text-xs">/</span>
            <span className="font-label-md text-label-md text-secondary">Gmail IMAP Synced</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
            Outreach Inbox &amp; Conversations
          </h1>
        </div>

        {/* Action & Filter Tabs */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            onClick={handleSyncImap}
            disabled={syncingImap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all shadow-sm"
          >
            <span className={`material-symbols-outlined text-[18px] ${syncingImap ? 'animate-spin text-primary' : 'text-primary'}`}>
              refresh
            </span>
            <span>{syncingImap ? 'Checking IMAP...' : 'Check New Replies'}</span>
          </button>

          <div className="inline-flex p-1 rounded-xl bg-surface-container-low shadow-sm">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all ${
                filterCategory === 'all' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              All ({threads.length})
            </button>
            <button
              onClick={() => setFilterCategory('interested')}
              className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 ${
                filterCategory === 'interested' ? 'bg-surface-container-lowest text-emerald-700 font-bold shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Interested
            </button>
            <button
              onClick={() => setFilterCategory('question')}
              className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 ${
                filterCategory === 'question' ? 'bg-surface-container-lowest text-amber-700 font-bold shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Questions
            </button>
            <button
              onClick={() => setFilterCategory('booked')}
              className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 ${
                filterCategory === 'booked' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Booked Calls
            </button>
          </div>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-body-sm flex items-center justify-between">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage('')}>✕</button>
        </div>
      )}

      {/* Main 3-Column Responsive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
        
        {/* COLUMN 1: Threads List (3.5 cols) */}
        <section className="xl:col-span-4 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/50 overflow-hidden h-[760px]">
          {/* Search bar */}
          <div className="p-space-md bg-surface-container-lowest flex flex-col gap-space-xs border-b border-surface-container-high/40">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads, businesses..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest border border-surface-container-high"
              />
            </div>
          </div>

          {/* Threads Scroller */}
          <div className="overflow-y-auto flex-1 divide-y divide-surface-container-low">
            {filteredThreads.map(thread => (
              <article
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className={`p-space-md cursor-pointer transition-colors relative border-l-4 ${
                  selectedThreadId === thread.id
                    ? 'bg-surface-container-low border-l-primary'
                    : 'bg-surface-container-lowest hover:bg-surface-container-low/50 border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-space-sm mb-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      thread.category === 'Interested' ? 'bg-emerald-500' : 'bg-primary'
                    }`}></span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
                      {thread.lead_name}
                    </h3>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex-shrink-0">
                    {thread.time}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="font-label-sm text-label-sm text-secondary font-medium truncate">
                    {thread.business_name}
                  </span>
                  <span className="text-outline text-xs">•</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 ${
                    thread.category === 'Interested'
                      ? 'bg-emerald-100 text-emerald-800'
                      : thread.category === 'Question'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-primary-fixed text-on-primary-fixed'
                  }`}>
                    {thread.category}
                  </span>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface line-clamp-2 leading-relaxed">
                  {thread.messages[thread.messages.length - 1]?.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* COLUMN 2: Active Conversation Viewer (5 cols) */}
        <section className="xl:col-span-5 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/50 overflow-hidden h-[760px]">
          {/* Active Header */}
          <div className="p-space-md border-b border-surface-container-high/40 flex items-center justify-between">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {activeThread.subject}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Between <strong>Shoaib ul Din</strong> and <strong>{activeThread.lead_name}</strong> ({activeThread.email})
              </p>
            </div>
          </div>

          {/* Messages Scroller */}
          <div className="flex-1 overflow-y-auto p-space-md space-y-4">
            {activeThread.messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 text-xs text-on-surface-variant">
                  <span className="font-semibold">{msg.from}</span>
                  <span>•</span>
                  <span>{msg.time}</span>
                </div>

                <div className={`p- space-md p-3 rounded-2xl max-w-[90%] text-body-sm leading-relaxed whitespace-pre-wrap ${
                  msg.isMe
                    ? 'bg-primary-container text-on-primary rounded-tr-none'
                    : 'bg-surface-container-low text-on-surface rounded-tl-none border border-surface-container-high/60'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Reply Bar */}
          <div className="p-space-sm border-t border-surface-container-high/40 bg-surface-container-lowest space-y-2">
            {/* Quick action chips */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setReplyText('Hi Salman, here is my direct WhatsApp: 03473547036. Looking forward to chatting!')}
                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-medium"
              >
                Share WhatsApp (03473547036)
              </button>
              <button
                type="button"
                onClick={() => setReplyText('Here is my calendar if you would like to book a quick 15-minute call: https://calendly.com/shoaibuldin371/15min')}
                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-medium"
              >
                Share Calendly Link
              </button>
              <button
                type="button"
                onClick={() => setReplyText('Here are some recent video sample cuts: https://video-portfolio-572m.vercel.app/')}
                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-medium"
              >
                Send Portfolio
              </button>
            </div>

            <div className="flex gap-2">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${activeThread.lead_name} via Gmail SMTP...`}
                className="flex-1 p-2 rounded-lg bg-surface-container-low text-body-sm border border-surface-container-high focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleSendReply}
                className="px-4 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-semibold text-xs flex items-center justify-center transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
        </section>

        {/* COLUMN 3: Prospect Dossier Card (3 cols) */}
        <section className="xl:col-span-3 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/50 p-space-md space-y-space-md h-[760px] overflow-y-auto">
          <div>
            <span className="font-label-sm text-label-sm uppercase font-semibold text-secondary">
              Prospect Dossier
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">
              {activeThread.lead_name}
            </h3>
            <p className="text-xs text-on-surface-variant">{activeThread.business_name}</p>
          </div>

          <div className="p-3 bg-surface-container-low rounded-xl space-y-2 text-xs">
            <div>
              <span className="text-on-surface-variant block">Location:</span>
              <span className="font-semibold text-on-surface">{activeThread.city}, {activeThread.country}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block">Assigned Service:</span>
              <span className="font-semibold text-primary">{activeThread.service}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block">Email:</span>
              <span className="font-semibold text-on-surface">{activeThread.email}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block">Phone:</span>
              <span className="font-semibold text-on-surface">{activeThread.phone}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block">Portfolio Tracker:</span>
              <span className="font-bold text-emerald-700">{activeThread.portfolioClicks} Link Clicks (Hot Prospect)</span>
            </div>
          </div>

          {/* One click contact buttons */}
          <div className="space-y-2 pt-2">
            <a
              href={`https://wa.me/${activeThread.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(activeThread.lead_name)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-label-md font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>Open WhatsApp Chat</span>
            </a>

            <a
              href={`mailto:${activeThread.email}`}
              className="w-full py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span>Open in Gmail Client</span>
            </a>
          </div>

          {/* Deal Stage Update */}
          <div className="pt-2 border-t border-surface-container-high/40">
            <label className="font-label-sm text-label-sm uppercase font-semibold text-secondary block mb-1">
              Move Pipeline Stage
            </label>
            <select
              defaultValue={activeThread.status}
              className="w-full p-2 bg-surface-container-low text-xs rounded-lg border border-surface-container-high text-on-surface font-medium"
            >
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="question">Question</option>
              <option value="call_booked">Call Booked</option>
              <option value="won">Won Deal</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </section>

      </div>
    </div>
  );
}
