import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const [modulesOpen, setModulesOpen] = useState(true);

  const navClass = ({ isActive }) =>
    `flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-all font-label-lg text-label-lg ${
      isActive
        ? 'bg-primary-container text-on-primary font-bold shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
    }`;

  const subNavClass = ({ isActive }) =>
    `block px-space-sm py-1.5 rounded-lg transition-all font-body-sm text-body-sm ${
      isActive
        ? 'bg-secondary-container text-on-secondary-container font-semibold'
        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
    }`;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between">
      <div className="flex flex-col">
        {/* Brand Bar */}
        <div className="h-16 px-space-md flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[26px]">rocket_launch</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">ReachOut</span>
          </div>
          <span className="font-label-sm text-label-sm px-space-xs py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
            v2.4
          </span>
        </div>

        {/* Workspace Dropdown */}
        <div className="px-space-md pt-space-xs pb-space-sm">
          <button
            className="w-full flex items-center justify-between px-space-sm py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all"
            type="button"
          >
            <div className="flex items-center gap-space-xs truncate">
              <span className="material-symbols-outlined text-[18px] text-primary">workspaces</span>
              <span className="font-label-md text-label-md truncate text-on-surface font-medium">Shoaib's Outreach</span>
            </div>
            <span className="material-symbols-outlined text-[16px]">unfold_more</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-space-sm space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
          <NavLink to="/" end className={navClass}>
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/my-profile" className={navClass}>
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
            <span>My Profile</span>
          </NavLink>

          <NavLink to="/lead-finder" className={navClass}>
            <span className="material-symbols-outlined text-[20px]">person_search</span>
            <span>Lead Finder</span>
          </NavLink>

          {/* 4 Outreach Modules */}
          <div className="pt-space-xs">
            <button
              onClick={() => setModulesOpen(!modulesOpen)}
              className="w-full flex items-center justify-between px-space-sm py-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
              type="button"
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px]">hub</span>
                <span className="font-label-lg text-label-lg font-medium">Outreach Modules</span>
              </div>
              <span className={`material-symbols-outlined text-[16px] transition-transform ${modulesOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {modulesOpen && (
              <div className="pl-7 pr-space-xs space-y-1 mt-0.5">
                <NavLink to="/module-social-media" className={subNavClass}>
                  Social Media
                </NavLink>
                <NavLink to="/module-video-editing" className={subNavClass}>
                  Video Editing
                </NavLink>
                <NavLink to="/module-ai-video" className={subNavClass}>
                  AI Video
                </NavLink>
                <NavLink to="/module-product-manager" className={subNavClass}>
                  Product Manager
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/manual-outreach" className={navClass}>
            <span className="material-symbols-outlined text-[20px]">touch_app</span>
            <span>Manual Outreach</span>
          </NavLink>

          <NavLink to="/email-composer" className={navClass}>
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
            <span>Email Composer</span>
          </NavLink>

          <NavLink to="/inbox" className={navClass}>
            <div className="flex items-center gap-space-sm flex-1">
              <span className="material-symbols-outlined text-[20px]">inbox</span>
              <span>Inbox</span>
            </div>
            {parseInt(localStorage.getItem('reachout_unread_inbox_count') || '0', 10) > 0 && (
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded-full bg-error-container text-on-error-container font-bold">
                {localStorage.getItem('reachout_unread_inbox_count')}
              </span>
            )}
          </NavLink>

          <NavLink to="/pipeline" className={navClass}>
            <span className="material-symbols-outlined text-[20px]">view_kanban</span>
            <span>Pipeline</span>
          </NavLink>

          <NavLink to="/campaigns" className={navClass}>
            <span className="material-symbols-outlined text-[20px]">schedule_send</span>
            <span>Approval Queue</span>
          </NavLink>

          <NavLink to="/analytics" className={navClass}>
            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
            <span>Analytics</span>
          </NavLink>

          <NavLink to="/settings" className={navClass}>
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Settings</span>
          </NavLink>
        </nav>
      </div>

      {/* User Footer Card */}
      <div className="p-space-sm border-t border-surface-container-high/60">
        <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs uppercase">
                SD
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest"></span>
            </div>
            <div className="min-w-0">
              <p className="font-label-md text-label-md text-on-surface truncate font-semibold">
                {user?.user_metadata?.full_name || 'Shoaib ul Din'}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                Islamabad, PK
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            title="Log Out"
            className="text-on-surface-variant hover:text-error p-1 rounded-lg hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

