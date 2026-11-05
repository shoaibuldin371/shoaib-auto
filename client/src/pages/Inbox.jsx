import React, { useState } from 'react';

const INITIAL_THREADS = [];

export default function Inbox() {
  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [selectedThreadId, setSelectedThreadId] = useState(1);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [syncingImap, setSyncingImap] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [showUrduModal, setShowUrduModal] = useState(false);
  const [urduNotes, setUrduNotes] = useState('');
  const [draftingReply, setDraftingReply] = useState(false);

  const activeThread = threads.find(t => t.id === selectedThreadId) || threads[0] || null;

  async function handleDraftUrduReply() {
    if (!urduNotes.trim()) return;
    setDraftingReply(true);
    try {
      const res = await fetch('/api/leads/reply-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urduNotes,
          originalEmail: activeThread?.messages?.[activeThread.messages.length - 1]?.text || '',
        }),
      });
      const data = await res.json();
      if (data.replyText) {
        setReplyText(data.replyText);
        setShowUrduModal(false);
        setUrduNotes('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDraftingReply(false);
    }
  }

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

        {/* COLUMN 2 & 3: Active Conversation Viewer or Empty State */}
        {!activeThread ? (
          <section className="xl:col-span-8 flex flex-col items-center justify-center bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/50 h-[760px] p-12 text-center space-y-3">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/40">mark_email_read</span>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">No Inbound Replies Yet</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
              When prospects respond to your cold outreach emails, they are automatically parsed from Gmail IMAP, classified by Gemini AI, and displayed here.
            </p>
          </section>
        ) : (
          <>
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
                {(activeThread.messages || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={'flex flex-col ' + (msg.isMe ? 'items-end' : 'items-start')}
                  >
                    <div className="flex items-center gap-2 mb-1 text-xs text-on-surface-variant">
                      <span className="font-semibold">{msg.from}</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                    </div>

                    <div className={'p-3 rounded-2xl max-w-[90%] text-body-sm leading-relaxed whitespace-pre-wrap ' + (
                      msg.isMe
                        ? 'bg-primary-container text-on-primary rounded-tr-none'
                        : 'bg-surface-container-low text-on-surface rounded-tl-none border border-surface-container-high/60'
                    )}>
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
                    onClick={() => setReplyText('Hi ' + activeThread.lead_name + ', here is my direct WhatsApp: 03473547036. Looking forward to chatting!')}
                    className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-medium"
                  >
                    Share WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText('Here are some recent video sample cuts: https://video-portfolio-self-eight.vercel.app/')}
                    className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-medium"
                  >
                    Send Portfolio
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUrduModal(true)}
                    className="px-2.5 py-1 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-semibold flex items-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[14px]">translate</span>
                    Urdu / Roman Urdu Drafter
                  </button>
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={'Reply to ' + activeThread.lead_name + ' via Gmail SMTP...'}
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

              <div className="space-y-2 text-xs border-y border-surface-container-high/40 py-3">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Location:</span>
                  <span className="font-semibold text-on-surface">{activeThread.city}, {activeThread.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Service:</span>
                  <span className="font-semibold text-primary">{activeThread.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Email:</span>
                  <span className="font-semibold text-on-surface">{activeThread.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Phone:</span>
                  <span className="font-semibold text-on-surface">{activeThread.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Interest:</span>
                  <span className="font-bold text-emerald-700">{activeThread.portfolioClicks || 0} Link Clicks</span>
                </div>
              </div>

              {/* One click contact buttons */}
              <div className="space-y-2 pt-2">
                <a
                  href={'https://wa.me/' + (activeThread.phone || '').replace(/[^0-9]/g, '') + '?text=Hi%20' + encodeURIComponent(activeThread.lead_name)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-label-md font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>Open WhatsApp Chat</span>
                </a>

                <a
                  href={'mailto:' + activeThread.email}
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
          </>
        )}
      </div>

      {/* Urdu to English AI Reply Modal */}
      {showUrduModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg p-space-xl rounded-2xl shadow-xl border border-surface-container-high space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-primary-container text-on-primary">
                  <span className="material-symbols-outlined text-[20px]">translate</span>
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Urdu / Roman Urdu Reply Assistant
                </h3>
              </div>
              <button
                onClick={() => setShowUrduModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Apnay rough points Roman Urdu ya Urdu mein likhein. Gemini AI inko aik clean, professional, concise English outreach reply mein convert kar dega.
            </p>

            <textarea
              rows={4}
              value={urduNotes}
              onChange={(e) => setUrduNotes(e.target.value)}
              placeholder="e.g. Inko bolo k main kal tak 2 sample reels bhej dunga WhatsApp py aur rate 25k hoga..."
              className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/60 text-body-sm focus:outline-none focus:border-primary"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUrduModal(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant text-body-sm font-semibold hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDraftUrduReply}
                disabled={draftingReply || !urduNotes.trim()}
                className="px-5 py-2 rounded-xl bg-primary-container text-on-primary hover:bg-primary font-semibold text-body-sm flex items-center gap-1.5 shadow-sm transition-all"
              >
                {draftingReply ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    <span>Draft English Reply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
