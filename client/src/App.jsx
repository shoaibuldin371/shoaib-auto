import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import LeadFinder from './pages/LeadFinder';
import MyProfile from './pages/MyProfile';
import ModuleSocialMedia from './pages/ModuleSocialMedia';
import ModuleVideoEditing from './pages/ModuleVideoEditing';
import ModuleAiVideo from './pages/ModuleAiVideo';
import ModuleProductManager from './pages/ModuleProductManager';
import ManualOutreach from './pages/ManualOutreach';
import EmailComposer from './pages/EmailComposer';
import Inbox from './pages/Inbox';
import Pipeline from './pages/Pipeline';
import Campaigns from './pages/Campaigns';
import Analytics from './pages/Analytics';

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
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
          <Route path="/lead-finder" element={<ProtectedRoute><LeadFinder /></ProtectedRoute>} />

          {/* 4 Dedicated Outreach Modules with Pakistan vs. Worldwide split */}
          <Route path="/module-social-media" element={<ProtectedRoute><ModuleSocialMedia /></ProtectedRoute>} />
          <Route path="/module-video-editing" element={<ProtectedRoute><ModuleVideoEditing /></ProtectedRoute>} />
          <Route path="/module-ai-video" element={<ProtectedRoute><ModuleAiVideo /></ProtectedRoute>} />
          <Route path="/module-product-manager" element={<ProtectedRoute><ModuleProductManager /></ProtectedRoute>} />

          {/* Outreach Execution & Inbound Hubs */}
          <Route path="/manual-outreach" element={<ProtectedRoute><ManualOutreach /></ProtectedRoute>} />
          <Route path="/email-composer" element={<ProtectedRoute><EmailComposer /></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
          <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
