import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ title = 'ReachOut' }) {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-gutter border-b border-surface-container-high/40">
      <div className="flex items-center gap-space-md">
        <div className="relative w-64 md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-outline">
            search
          </span>
          <input
            className="w-full h-10 pl-10 pr-space-md rounded-lg bg-surface-container-low text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border border-transparent transition-all"
            placeholder="Quick search leads, campaigns..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-space-md">
        {/* System Status Pill */}
        <div className="flex items-center gap-space-xs px-space-sm py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-label-sm text-label-sm font-semibold">
            Cloud Outreach Active
          </span>
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all"
          type="button"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error"></span>
        </button>

        {/* New Campaign Button */}
        <button
          className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-all font-label-lg text-label-lg shadow-sm"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Campaign</span>
        </button>

        {/* Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm">
          SD
        </div>
      </div>
    </header>
  );
}

