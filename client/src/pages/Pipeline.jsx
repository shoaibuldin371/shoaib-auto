import React, { useState, useEffect } from 'react';

const STAGES = [
  { id: 'new', label: 'New Prospects', color: 'border-l-blue-400' },
  { id: 'contacted', label: 'Contacted', color: 'border-l-indigo-500' },
  { id: 'replied', label: 'Replied', color: 'border-l-amber-500' },
  { id: 'interested', label: 'Interested', color: 'border-l-emerald-500' },
  { id: 'call_booked', label: 'Call Booked', color: 'border-l-purple-500' },
  { id: 'won', label: 'Won Deals', color: 'border-l-green-600' },
  { id: 'lost', label: 'Closed / Lost', color: 'border-l-gray-400' },
];

export default function Pipeline() {
  const [regionFilter, setRegionFilter] = useState('all'); // 'all', 'pakistan', 'worldwide'
  const [serviceFilter, setServiceFilter] = useState('all');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function moveLeadStage(leadId, newStage) {
    try {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStage } : l));
      await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStage })
      });
    } catch (e) {
      console.error(e);
    }
  }

  const filteredLeads = leads.filter(l => {
    const isPak = (l.country || '').toLowerCase().includes('pakistan') || 
      ['islamabad', 'lahore', 'karachi', 'rawalpindi', 'peshawar', 'multan', 'faisalabad'].some(c => (l.city || '').toLowerCase().includes(c));

    if (regionFilter === 'pakistan' && !isPak) return false;
    if (regionFilter === 'worldwide' && isPak) return false;
    if (serviceFilter !== 'all' && l.service_id !== serviceFilter) return false;

    return true;
  });

  return (
    <div className="flex flex-col w-full pb-20 space-y-space-md">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-space-xs gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
              Conversion Engine
            </span>
            <span className="text-outline text-xs">/</span>
            <span className="font-label-md text-label-md text-secondary">Kanban Pipeline</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            Outreach Pipeline &amp; Deal Tracking
          </h1>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-space-sm flex-wrap">
          {/* Region Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-surface-container-low shadow-sm">
            <button
              onClick={() => setRegionFilter('all')}
              className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all ${
                regionFilter === 'all' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              All Regions
            </button>
            <button
              onClick={() => setRegionFilter('pakistan')}
              className={`px-3 py-1 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1 ${
                regionFilter === 'pakistan' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              <span>🇵🇰</span> Pakistan
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

          {/* Service Selector */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="h-9 px-3 bg-surface-container-low text-xs rounded-lg border border-surface-container-high text-on-surface font-medium"
          >
            <option value="all">All Services</option>
            <option value="social-media">Social Media Management</option>
            <option value="video-editing">Video Editing</option>
            <option value="ai-video">AI Video Creation</option>
            <option value="product-manager">Product Management</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-space-md overflow-x-auto pb-6 pt-2">
        {STAGES.map(stage => {
          const stageLeads = filteredLeads.filter(l => (l.status || 'new') === stage.id);

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80 bg-surface-container-low/70 rounded-xl p-space-sm border border-surface-container-high/60 flex flex-col max-h-[780px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container-high/40 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-sm text-on-surface font-bold">
                    {stage.label}
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-xs bg-surface-container font-bold text-on-surface-variant">
                    {stageLeads.length}
                  </span>
                </div>
              </div>

              {/* Cards Scroller */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {stageLeads.length === 0 ? (
                  <div className="p-4 text-center text-xs text-on-surface-variant italic">
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map(lead => {
                    const isPak = (lead.country || '').toLowerCase().includes('pakistan') || 
                      ['islamabad', 'lahore', 'karachi', 'rawalpindi', 'peshawar', 'multan', 'faisalabad'].some(c => (lead.city || '').toLowerCase().includes(c));

                    return (
                      <div
                        key={lead.id}
                        className={`p-space-sm rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 space-y-2 border-l-4 ${stage.color}`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <h4 className="font-label-md text-label-md font-bold text-on-surface">
                              {lead.business_name}
                            </h4>
                            <p className="text-xs text-on-surface-variant">
                              {lead.contact_name || lead.city || 'Contact'}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-primary px-1.5 py-0.5 rounded bg-surface-container">
                            {lead.lead_score || 85}
                          </span>
                        </div>

                        {/* Location and Service tags */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className={`px-1.5 py-0.2 rounded font-medium ${
                            isPak ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {isPak ? '🇵🇰 ' + (lead.city || 'Pakistan') : '🌐 ' + (lead.country || 'Global')}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface font-medium truncate max-w-[120px]">
                            {lead.service_id || 'social-media'}
                          </span>
                        </div>

                        {/* Value estimate */}
                        <div className="text-xs font-semibold text-secondary">
                          Est. Value: {isPak ? 'PKR 65,000 / mo' : '$1,200 / mo'}
                        </div>

                        {/* Stage Quick Move Dropdown */}
                        <div className="pt-1 border-t border-surface-container-high/40 flex items-center justify-between text-xs">
                          <span className="text-on-surface-variant">Move to:</span>
                          <select
                            value={lead.status || 'new'}
                            onChange={(e) => moveLeadStage(lead.id, e.target.value)}
                            className="bg-surface-container-low text-[11px] rounded px-1.5 py-1 text-on-surface border border-surface-container-high focus:outline-none"
                          >
                            {STAGES.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
