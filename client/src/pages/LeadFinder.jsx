import React, { useState, useEffect } from 'react';

export default function LeadFinder() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [minScore, setMinScore] = useState(50);
  const [statusFilter, setStatusFilter] = useState('all');

  // Search OSM modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchCity, setSearchCity] = useState('Islamabad');
  const [searchIndustry, setSearchIndustry] = useState('restaurants');
  const [searchLimit, setSearchLimit] = useState(15);
  const [searchingOsm, setSearchingOsm] = useState(false);

  // CSV Import modal state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importingCsv, setImportingCsv] = useState(false);

  // Lead actions loading
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusNotification, setStatusNotification] = useState(null);

  useEffect(() => {
    fetchLeads();
  }, [selectedIndustry, selectedRegion, minScore, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (minScore > 0) params.append('minScore', minScore);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.warn('Error fetching leads:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchOsm = async (e) => {
    e.preventDefault();
    setSearchingOsm(true);
    setStatusNotification(null);

    try {
      const res = await fetch('/api/leads/search-osm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: searchCity,
          industry: searchIndustry,
          limit: parseInt(searchLimit),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusNotification({
          type: 'success',
          text: `Found and scored ${data.count} local businesses in ${searchCity} via OpenStreetMap!`,
        });
        setShowSearchModal(false);
        fetchLeads();
      } else {
        setStatusNotification({ type: 'error', text: data.error || 'Search failed' });
      }
    } catch (err) {
      setStatusNotification({ type: 'error', text: err.message });
    } finally {
      setSearchingOsm(false);
    }
  };

  const handleImportCsv = async (e) => {
    e.preventDefault();
    setImportingCsv(true);

    try {
      // Basic CSV parser
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must contain at least a header row and one data row.');
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols.length >= 2) {
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] || '';
          });
          rows.push({
            business_name: rowObj.name || rowObj.business_name || rowObj.company || 'Business',
            email: rowObj.email || '',
            phone: rowObj.phone || '',
            website: rowObj.website || '',
            city: rowObj.city || 'Islamabad',
            contact_name: rowObj.contact || rowObj.contact_name || '',
          });
        }
      }

      const res = await fetch('/api/leads/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();

      if (data.success) {
        setStatusNotification({
          type: 'success',
          text: `Successfully imported and scored ${data.count} leads from CSV!`,
        });
        setShowCsvModal(false);
        setCsvText('');
        fetchLeads();
      }
    } catch (err) {
      setStatusNotification({ type: 'error', text: err.message });
    } finally {
      setImportingCsv(false);
    }
  };

  const handleEnrich = async (leadId) => {
    setActionLoadingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/enrich`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusNotification({
          type: 'success',
          text: `Enriched ${data.lead.business_name}! Found email: ${data.lead.email || 'None'} and ${
            Object.keys(data.lead.socials || {}).length
          } social links. Score updated to ${data.lead.lead_score}.`,
        });
        fetchLeads();
      } else {
        setStatusNotification({ type: 'error', text: data.error });
      }
    } catch (err) {
      setStatusNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGenerateHook = async (leadId) => {
    setActionLoadingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/generate-hook`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusNotification({
          type: 'success',
          text: `Gemini generated personalized hook for ${data.service_id}: "${data.personal_hook}"`,
        });
        fetchLeads();
      } else {
        setStatusNotification({ type: 'error', text: data.error });
      }
    } catch (err) {
      setStatusNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 85) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 70) return 'bg-primary-fixed text-on-primary-fixed border-primary-fixed-dim';
    return 'bg-surface-container text-on-surface-variant border-outline-variant';
  };

  return (
    <div className="flex flex-col w-full gap-space-lg pb-16">
      {/* Header Section with Tactical Stats Counter */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
        <div className="space-y-space-xs max-w-3xl">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold bg-primary-fixed px-2 py-0.5 rounded-full">
              Free Lead Engine
            </span>
            <span className="text-outline-variant font-mono text-xs">•</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              OpenStreetMap Overpass + Website Enricher
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            Lead Finder &amp; Prospect Intelligence
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Discover local businesses by city and niche, extract verified public emails &amp; social profiles, and route directly to personalized outreach sequences.
          </p>
        </div>

        {/* Quick Stat Chips */}
        <div className="flex items-center gap-space-sm flex-wrap self-start lg:self-end">
          <div className="bg-surface-container-lowest shadow-sm rounded-xl px-space-md py-2.5 flex items-center gap-space-sm border border-surface-container-high/60">
            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">database</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Qualified Leads</p>
              <p className="font-headline-sm text-headline-sm text-on-surface font-bold">{leads.length} Active</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest shadow-sm rounded-xl px-space-md py-2.5 flex items-center gap-space-sm border border-surface-container-high/60">
            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Avg Lead Score</p>
              <p className="font-headline-sm text-headline-sm text-on-surface font-bold">
                {leads.length > 0
                  ? Math.round(leads.reduce((acc, l) => acc + (l.lead_score || 50), 0) / leads.length)
                  : 85}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Notification */}
      {statusNotification && (
        <div
          className={`p-space-md rounded-xl text-body-md flex items-center justify-between shadow-sm border ${
            statusNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-error-container/60 border-error-container text-on-error-container'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">
              {statusNotification.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{statusNotification.text}</span>
          </div>
          <button onClick={() => setStatusNotification(null)} className="text-current hover:opacity-75">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Controls Card: Search & Dimensional Filters */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md space-y-space-md border border-surface-container-high/60">
        <div className="flex flex-col md:flex-row gap-space-sm items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-[20px] text-outline">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
              className="w-full h-10 pl-11 pr-space-md rounded-lg bg-surface-container-low text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-sm transition-all border border-transparent focus:border-primary/20"
              placeholder="Search by company name, niche, domain, city..."
            />
          </div>

          <div className="flex items-center gap-space-xs flex-wrap">
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="h-10 px-space-md rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-all flex items-center gap-space-xs font-label-lg text-label-lg shadow-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">explore</span>
              <span>Find New Leads (OSM)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCsvModal(true)}
              className="h-10 px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface transition-all flex items-center gap-space-xs font-label-lg text-label-lg font-medium"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">upload_file</span>
              <span>Import CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm pt-space-xs">
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-medium">
              Industry Focus
            </label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full h-9 px-space-sm rounded-lg bg-surface-container-low text-body-sm font-body-sm text-on-surface focus:outline-none cursor-pointer border border-outline-variant/40"
            >
              <option value="all">All Industries</option>
              <option value="restaurants">Hospitality &amp; Restaurants</option>
              <option value="gyms">Fitness, Gyms &amp; Trainers</option>
              <option value="ecommerce">E-commerce &amp; Retail</option>
              <option value="tech">Tech Startups &amp; SaaS</option>
            </select>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-medium">
              Target City
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full h-9 px-space-sm rounded-lg bg-surface-container-low text-body-sm font-body-sm text-on-surface focus:outline-none cursor-pointer border border-outline-variant/40"
            >
              <option value="all">All Cities</option>
              <option value="Islamabad">Islamabad, PK</option>
              <option value="Rawalpindi">Rawalpindi, PK</option>
              <option value="Lahore">Lahore, PK</option>
              <option value="Karachi">Karachi, PK</option>
            </select>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-medium">
              Min Lead Score: {minScore}
            </label>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="w-full h-9 accent-primary cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-medium">
              Lead Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 px-space-sm rounded-lg bg-surface-container-low text-body-sm font-body-sm text-on-surface focus:outline-none cursor-pointer border border-outline-variant/40"
            >
              <option value="all">All Statuses</option>
              <option value="new">New (Uncontacted)</option>
              <option value="contacted">Contacted</option>
              <option value="replied">Replied</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <th className="py-3 px-space-md font-semibold">Business / Lead</th>
                <th className="py-3 px-space-md font-semibold">Contact &amp; Location</th>
                <th className="py-3 px-space-md font-semibold">Detected Channels</th>
                <th className="py-3 px-space-md font-semibold text-center">Score</th>
                <th className="py-3 px-space-md font-semibold">Suggested Service &amp; Hook</th>
                <th className="py-3 px-space-md font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/50 text-body-sm font-body-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-outline">
                    <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
                      progress_activity
                    </span>
                    <p className="mt-2 font-medium">Loading qualified prospects...</p>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-outline">
                    <span className="material-symbols-outlined text-[36px] text-outline mb-1">
                      search_off
                    </span>
                    <p className="text-body-md font-medium text-on-surface">No leads found</p>
                    <p className="text-body-sm text-on-surface-variant mt-1">
                      Click <strong>"Find New Leads (OSM)"</strong> to search local businesses or import a CSV.
                    </p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const hasEmail = Boolean(lead.email);
                  const isActionLoading = actionLoadingId === lead.id;

                  return (
                    <tr key={lead.id} className="hover:bg-surface-container-low/40 transition-colors group">
                      {/* Business & Website */}
                      <td className="py-3.5 px-space-md">
                        <div className="font-label-md text-label-md font-bold text-on-surface">
                          {lead.business_name}
                        </div>
                        {lead.website ? (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-0.5 mt-0.5"
                          >
                            <span>{lead.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')}</span>
                            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                          </a>
                        ) : (
                          <span className="text-xs text-outline italic">No website</span>
                        )}
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-1">
                          <span className="material-symbols-outlined text-[13px] text-amber-500">star</span>
                          <span className="font-semibold">{lead.rating || 4.5}</span>
                          <span className="text-outline">({lead.review_count || 12} reviews)</span>
                        </div>
                      </td>

                      {/* Contact & City */}
                      <td className="py-3.5 px-space-md">
                        <div className="text-on-surface font-medium">
                          {lead.contact_name || lead.first_name || 'Business Manager'}
                        </div>
                        <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px] text-outline">location_on</span>
                          <span>{lead.city || 'Islamabad'}</span>
                        </div>
                        {lead.phone && (
                          <div className="text-xs text-outline mt-0.5 font-mono">{lead.phone}</div>
                        )}
                      </td>

                      {/* Detected Channels */}
                      <td className="py-3.5 px-space-md">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Email badge */}
                          {hasEmail ? (
                            <span
                              className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold"
                              title={`Verified email: ${lead.email}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">mail</span>
                            </span>
                          ) : (
                            <span
                              className="w-7 h-7 rounded-lg bg-surface-container text-outline flex items-center justify-center"
                              title="No email found (Will route to Manual Social Task)"
                            >
                              <span className="material-symbols-outlined text-[16px]">mail_lock</span>
                            </span>
                          )}

                          {/* Social links */}
                          {lead.socials?.instagram && (
                            <a
                              href={lead.socials.instagram}
                              target="_blank"
                              rel="noreferrer"
                              className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center hover:scale-105 transition-transform"
                              title="Instagram"
                            >
                              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                            </a>
                          )}
                          {lead.socials?.facebook && (
                            <a
                              href={lead.socials.facebook}
                              target="_blank"
                              rel="noreferrer"
                              className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center hover:scale-105 transition-transform"
                              title="Facebook"
                            >
                              <span className="material-symbols-outlined text-[16px]">public</span>
                            </a>
                          )}
                          {lead.socials?.tiktok && (
                            <a
                              href={lead.socials.tiktok}
                              target="_blank"
                              rel="noreferrer"
                              className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center hover:scale-105 transition-transform"
                              title="TikTok"
                            >
                              <span className="material-symbols-outlined text-[16px]">play_circle</span>
                            </a>
                          )}
                          {lead.socials?.whatsapp && (
                            <a
                              href={lead.socials.whatsapp}
                              target="_blank"
                              rel="noreferrer"
                              className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:scale-105 transition-transform"
                              title="WhatsApp"
                            >
                              <span className="material-symbols-outlined text-[16px]">chat</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Lead Score */}
                      <td className="py-3.5 px-space-md text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-label-md text-label-md font-bold border ${getScoreBadgeColor(
                            lead.lead_score || 50
                          )}`}
                        >
                          {lead.lead_score || 50}
                        </span>
                      </td>

                      {/* Service & AI Hook */}
                      <td className="py-3.5 px-space-md max-w-xs">
                        <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 rounded-full bg-surface-container font-semibold text-primary">
                          {lead.service_id || 'social-media'}
                        </span>
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 italic">
                          "{lead.personal_hook || 'Click AI Hook to generate personalized line'}"
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-space-md text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Enrich Button */}
                          {lead.website && (
                            <button
                              type="button"
                              onClick={() => handleEnrich(lead.id)}
                              disabled={isActionLoading}
                              title="Enrich website (extract email & socials)"
                              className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {isActionLoading ? 'progress_activity' : 'travel_explore'}
                              </span>
                            </button>
                          )}

                          {/* Generate Hook Button */}
                          <button
                            type="button"
                            onClick={() => handleGenerateHook(lead.id)}
                            disabled={isActionLoading}
                            title="Generate Gemini AI Hook & Match Service"
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OpenStreetMap Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-md p-space-xl rounded-2xl shadow-xl border border-surface-container-high space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-primary-container text-on-primary">
                  <span className="material-symbols-outlined text-[20px]">explore</span>
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  OpenStreetMap Lead Search
                </h3>
              </div>
              <button onClick={() => setShowSearchModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Free, live business discovery powered by the OpenStreetMap Overpass engine. Discovered leads are automatically scored and enriched.
            </p>

            <form onSubmit={handleSearchOsm} className="space-y-space-md">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Target City
                </label>
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  required
                  placeholder="e.g. Islamabad, Lahore, Karachi, London"
                  className="w-full h-11 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-body-md"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Industry / Niche
                </label>
                <select
                  value={searchIndustry}
                  onChange={(e) => setSearchIndustry(e.target.value)}
                  className="w-full h-11 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-body-md"
                >
                  <option value="restaurants">Restaurants, Cafes &amp; Bakeries</option>
                  <option value="gyms">Gyms &amp; Fitness Centres</option>
                  <option value="ecommerce">Clothing &amp; Boutiques</option>
                  <option value="beauty">Salons &amp; Beauty Parlours</option>
                  <option value="tech">Software &amp; Tech Companies</option>
                  <option value="all">Broad Search (All Local Businesses)</option>
                </select>
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">
                  Leads to Discover
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={searchLimit}
                  onChange={(e) => setSearchLimit(e.target.value)}
                  className="w-full h-11 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-body-md"
                />
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={searchingOsm}
                  className="px-space-md py-2.5 rounded-xl bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md font-semibold flex items-center gap-2 shadow-sm"
                >
                  {searchingOsm ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">search</span>
                  )}
                  <span>Search Overpass</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg p-space-xl rounded-2xl shadow-xl border border-surface-container-high space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-primary-container text-on-primary">
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Import Leads from CSV
                </h3>
              </div>
              <button onClick={() => setShowCsvModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Paste CSV rows below. Must include columns: <code>name,email,website,phone,city</code>.
            </p>

            <form onSubmit={handleImportCsv} className="space-y-space-md">
              <textarea
                rows="6"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="name,email,website,phone,city&#10;Islamabad Roast Cafe,info@roast.pk,https://roast.pk,+923001234567,Islamabad"
                className="w-full p-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              ></textarea>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importingCsv || !csvText.trim()}
                  className="px-space-md py-2.5 rounded-xl bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md font-semibold flex items-center gap-2 shadow-sm"
                >
                  {importingCsv ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  )}
                  <span>Import &amp; Score Leads</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
