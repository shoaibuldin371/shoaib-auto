import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const INITIAL_THREADS = [];

export default function Inbox() {
  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [selectedThreadId, setSelectedThreadId] = useState(1);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [syncingImap, setSyncingImap] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [showUrduModal, setShowUrduModal] = useState(false);
  const [urduNotes, setUrduNotes] = useState('');
  const [draftingReply, setDraftingReply] = useState(false);
  const [urduExplanation, setUrduExplanation] = useState('');
  const [urduWarning, setUrduWarning] = useState('');
  const [threadExplanations, setThreadExplanations] = useState({});
  const [explainingThreadId, setExplainingThreadId] = useState(null);

  const [settings, setSettings] = useState({
    sender_phone: '03473547036',
    calendly_link: '',
    video_portfolio_url: 'https://video-portfolio-self-eight.vercel.app/',
    ai_video_portfolio_url: 'https://video-portfolio-572m.vercel.app/',
  });

  useEffect(() => {
    fetchSettings();

    // Supabase Realtime updates on email_logs or leads
    if (supabase) {
      const channel = supabase
        .channel('inbox-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'email_logs' }, () => {
          handleSyncImap(true);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {}
  };

  const activeThread = threads.find(t => t.id === selectedThreadId) || threads[0] || null;

  const portfolioUrl = settings.video_portfolio_url || settings.ai_video_portfolio_url || '';

  const filteredThreads = threads.filter(t => {
    const matchCat = filterCategory === 'all' || 
      (filterCategory === 'interested' && t.category === 'Interested') ||
      (filterCategory === 'question' && t.category === 'Question') ||
      (filterCategory === 'booked' && t.category === 'Booked Calls');
    
    const matchSearch = (t.lead_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchCat && matchSearch;
  });

  async function handleSyncImap(silent = false) {
    if (!silent) setSyncingImap(true);
    setSyncMessage('');
    try {
      const res = await fetch('/api/cron/replies');
      const data = await res.json();
      if (res.ok) {
        if (!silent) setSyncMessage(`Synced with Gmail IMAP. ${data.processedCount || 0} messages scanned.`);
      }
    } catch (e) {
      if (!silent) setSyncMessage('Gmail IMAP checked.');
    } finally {
      if (!silent) setSyncingImap(false);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  }

  function toggleReadStatus(threadId) {
    setThreads(prev => {
      const updated = prev.map(t => t.id === threadId ? { ...t, isRead: !t.isRead } : t);
      const unreadCount = updated.filter(t => !t.isRead).length;
      localStorage.setItem('reachout_unread_inbox_count', unreadCount.toString());
      return updated;
    });
  }

  async function handleExplainInUrdu(threadId, emailText, subject) {
    setExplainingThreadId(threadId);
    try {
      const res = await fetch('/api/leads/explain-in-urdu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailBody: emailText, subject }),
      });
      const data = await res.json();
      if (data.explanation) {
        setThreadExplanations(prev => ({ ...prev, [threadId]: data.explanation }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExplainingThreadId(null);
    }
  }

  async function handleDraftUrduReply() {
    if (!urduNotes.trim()) return;
    setDraftingReply(true);
    try {
      const lastMsg = activeThread?.messages?.[activeThread.messages.length - 1];
      const res = await fetch('/api/leads/reply-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urduNotes,
          originalEmail: lastMsg?.text || activeThread?.subject || '',
        }),
      });
      const data = await res.json();
      if (data.replyText) {
        setReplyText(data.replyText);
        setUrduExplanation(data.urduExplanation || '');
        setUrduWarning(data.warning || '');
        setShowUrduModal(false);
        setUrduNotes('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDraftingReply(false);
    }
  }

  async function handleSendReply() {
    if (!replyText.trim() || !activeThread) return;
    setSendingReply(true);
    try {
      const lastMsg = activeThread.messages?.[activeThread.messages.length - 1];
      const res = await fetch('/api/leads/send-thread-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: activeThread.leadId || activeThread.id,
          toEmail: activeThread.email,
          subject: activeThread.subject,
          text: replyText,
          inReplyTo: lastMsg?.messageId || activeThread.messageId || '',
          references: lastMsg?.messageId || activeThread.messageId || '',
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newMsg = {
          from: 'Shoaib ul Din',
          to: activeThread.email,
          time: 'Just now',
          isMe: true,
          text: replyText,
          messageId: data.messageId,
        };

        setThreads(prev => prev.map(t => {
          if (t.id === activeThread.id) {
            return {
              ...t,
              isRead: true,
              messages: [...(t.messages || []), newMsg],
            };
          }
          return t;
        }));

        setReplyText('');
        setUrduExplanation('');
        setUrduWarning('');
        setSyncMessage(`Reply dispatched in thread via Gmail SMTP (Appears in Gmail Sent folder).`);
      } else {
        setSyncMessage(`SMTP Error: ${data.error}`);
      }
    } catch (e) {
      setSyncMessage(`Network Error: ${e.message}`);
    } finally {
      setSendingReply(false);
      setTimeout(() => setSyncMessage(''), 5000);
    }
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

        {/* Action Controls */}
        <div className="flex items-center gap-space-sm flex-wrap">
          {syncMessage && (
            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-medium animate-fade-in">
              {syncMessage}
            </span>
          )}

          <button
            type="button"
            onClick={() => handleSyncImap(false)}
            disabled={syncingImap}
            className="flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm font-medium border border-surface-container-high transition-all"
          >
            <span className={`material-symbols-outlined text-[18px] ${syncingImap ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{syncingImap ? 'Scanning Gmail...' : 'Sync IMAP Now'}</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Inbox Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
        
        {/* COLUMN 1: Conversation Threads List (4 cols) */}
        <section className="xl:col-span-4 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/50 overflow-hidden h-[760px]">
          {/* Filter Bar */}
          <div className="p-space-sm border-b border-surface-container-high/40 space-y-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads, domains, replies..."
                className="w-full h-8 pl-8 pr-3 bg-surface-container-low rounded-lg text-body-sm border border-transparent focus:border-outline-variant focus:outline-none"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
              {['all', 'interested', 'question', 'booked'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                    filterCategory === cat
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-surface-container-high/30">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-body-sm space-y-2">
                <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40">inbox</span>
                <p>No conversations in queue.</p>
                <p className="text-xs text-on-surface-variant/70">When leads reply to your cold outreach, they land here automatically.</p>
              </div>
            ) : (
              filteredThreads.map(thread => (
                <article
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`p-space-md cursor-pointer transition-all ${
                    selectedThreadId === thread.id
                      ? 'bg-surface-container-low border-l-4 border-primary'
                      : 'hover:bg-surface-container-low/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      {!thread.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary" title="Unread"></span>
                      )}
                      <h4 className="font-headline-sm text-body-sm font-bold text-on-surface truncate max-w-[160px]">
                        {thread.lead_name}
                      </h4>
                    </div>
                    <span className="font-label-sm text-[11px] text-on-surface-variant whitespace-nowrap">
                      {thread.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-on-surface-variant font-medium truncate max-w-[130px]">
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
                    {thread.messages?.[thread.messages.length - 1]?.text}
                  </p>
                </article>
              ))
            )}
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

                <button
                  type="button"
                  onClick={() => toggleReadStatus(activeThread.id)}
                  className="px-2.5 py-1 rounded-lg border border-outline-variant/60 text-xs font-medium hover:bg-surface-container-low flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {activeThread.isRead ? 'mark_email_unread' : 'mark_email_read'}
                  </span>
                  <span>{activeThread.isRead ? 'Mark as Unread' : 'Mark as Read'}</span>
                </button>
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

                      {/* "Urdu mein samjhao" button on prospect messages */}
                      {!msg.isMe && (
                        <div className="mt-2 pt-2 border-t border-surface-container-high/40">
                          <button
                            type="button"
                            onClick={() => handleExplainInUrdu(activeThread.id, msg.text, activeThread.subject)}
                            disabled={explainingThreadId === activeThread.id}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">translate</span>
                            <span>{explainingThreadId === activeThread.id ? 'Samjh raha hai...' : '🇵🇰 Urdu mein samjhao'}</span>
                          </button>

                          {threadExplanations[activeThread.id] && (
                            <div className="mt-2 p-2.5 rounded-lg bg-amber-50 text-amber-950 border border-amber-200 text-xs space-y-1">
                              <p className="font-bold flex items-center gap-1 text-amber-900">
                                <span className="material-symbols-outlined text-[14px]">psychology</span>
                                Roman Urdu Khulasa & Agla Qadam:
                              </p>
                              <p className="whitespace-pre-line">{threadExplanations[activeThread.id]}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Reply Bar */}
              <div className="p-space-sm border-t border-surface-container-high/40 bg-surface-container-lowest space-y-2">
                {/* Quick action chips reading from Settings */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <button
                    type="button"
                    disabled={!settings.sender_phone}
                    onClick={() => setReplyText(`Hi ${activeThread.lead_name}, here is my direct WhatsApp: ${settings.sender_phone}. Looking forward to chatting!`)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${settings.sender_phone ? 'bg-surface-container hover:bg-surface-container-high text-on-surface' : 'opacity-40 cursor-not-allowed bg-surface-container text-on-surface-variant'}`}
                  >
                    Share WhatsApp
                  </button>

                  <button
                    type="button"
                    disabled={!settings.calendly_link}
                    onClick={() => setReplyText(`Here is my calendar link to book a quick 15-minute call: ${settings.calendly_link}`)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${settings.calendly_link ? 'bg-surface-container hover:bg-surface-container-high text-on-surface' : 'opacity-40 cursor-not-allowed bg-surface-container text-on-surface-variant'}`}
                  >
                    Share Calendly Link
                  </button>

                  <button
                    type="button"
                    disabled={!portfolioUrl}
                    onClick={() => setReplyText(`Here are some recent sample video cuts: ${portfolioUrl}`)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${portfolioUrl ? 'bg-surface-container hover:bg-surface-container-high text-on-surface' : 'opacity-40 cursor-not-allowed bg-surface-container text-on-surface-variant'}`}
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

                {/* Roman Urdu draft explanation and warning notices */}
                {urduExplanation && (
                  <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container-high text-xs text-on-surface-variant flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0">info</span>
                    <div>
                      <span className="font-semibold text-on-surface">Urdu Note: </span>
                      {urduExplanation}
                    </div>
                  </div>
                )}

                {urduWarning && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0">warning</span>
                    <div className="font-medium">
                      {urduWarning}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={'Reply to ' + activeThread.lead_name + ' in same thread via Gmail SMTP...'}
                    className="flex-1 p-2 rounded-lg bg-surface-container-low text-body-sm border border-surface-container-high focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="px-4 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-semibold text-xs flex items-center justify-center transition-all shadow-sm"
                  >
                    {sendingReply ? (
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    )}
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
