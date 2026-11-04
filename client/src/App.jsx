import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

// Fallback module component for other routes
function ModulePlaceholder({ title, icon, subtitle }) {
  return (
    <div className="flex flex-col w-full pb-16 space-y-space-md">
      <div className="flex items-center gap-space-sm">
        <span className="p-2.5 rounded-xl bg-primary-container text-on-primary">
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </span>
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
            {title}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="p-space-xl rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[32px]">{icon}</span>
        </div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">
          {title} Module Ready
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
          Connected to the Kinetic Blue design system tokens and Supabase database.
        </p>
      </div>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="relative pt-20 px-gutter py-space-lg min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[36px] text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route
            path="/my-profile"
            element={
              <ProtectedRoute>
                <ModulePlaceholder
                  title="My Profile & Services"
                  icon="account_circle"
                  subtitle="Shoaib ul Din's profile details, bio, and service experience credentials."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lead-finder"
            element={
              <ProtectedRoute>
                <ModulePlaceholder
                  title="Lead Finder & Enricher"
                  icon="person_search"
                  subtitle="Free OpenStreetMap Overpass search, CSV import, and website email extraction."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/module-social-media"
            element={
              <ProtectedRoute>
                <ModulePlaceholder
                  title="Outreach: Social Media Management"
                  icon="share"
                  subtitle="Short-form TikTok, Facebook page proof, and local business outreach campaigns."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/module-video-editing"
            element={
              <ProtectedRoute>
                <ModulePlaceholder
                  title="Outreach: Video Editing"
                  icon="movie_edit"
                  subtitle="Reels, YouTube shorts, high-retention cuts portfolio outreach."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/module-ai-video"
            element={
              <ProtectedRoute>
                <ModulePlaceholder
                  title="Outreach: AI Video Creation"
                  icon="smart_display"
                  subtitle="AI promo videos, avatar explainers, and automated product showcases."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/module-product-manager"
            element={
              <ProtectedRoute>
                <ModulePlaceholder
                  title="Outreach: Product Management"
                  icon="inventory_2"
                  subtitle="Agile coordination, sprint roadmaps, and case study documentation outreach."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manual-outreach"
            element={
              <ProtectedRoute>
                <ModulePlaceholder
                  title="Manual Outreach Tasks"
                  icon="touch_app"
                  subtitle="Daily 20 DMs goal across Instagram, Facebook, TikTok, LinkedIn, and WhatsApp."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/email-composer"
            element={
              <ProtectedRoute>
                <ModulePlaceholder
                  title="Email Composer & AI Personalization"
                  icon="edit_note"
                  subtitle="Personal hook generator, subject line A/B variants, and link tracking redirects."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <ModulePlaceholder
                  title="Outreach Inbox & Reply Tracker"
                  icon="inbox"
                  subtitle="Live Gmail IMAP synced threads with Gemini AI interest classification."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pipeline"
            element={
              <ProtectedRoute>
                <ModulePlaceholder
                  title="Lead Pipeline Kanban"
                  icon="view_kanban"
                  subtitle="Visual stages: New, Contacted, Replied, Interested, Call Booked, Won, Lost."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <ModulePlaceholder
                  title="Approval Queue & Scheduled Runs"
                  icon="schedule_send"
                  subtitle="10:00 & 16:00 PKT scheduled runs and 1-click email approvals."
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <ModulePlaceholder
                  title="Outreach Analytics & Conversion"
                  icon="bar_chart"
                  subtitle="Deliverability health, open rate, reply rate, and winning subject lines."
                />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
