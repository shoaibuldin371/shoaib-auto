import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { supabase } from './lib/supabase';

// Intercept all outgoing /api fetch calls to automatically attach Supabase JWT
const originalFetch = window.fetch;
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url || '';
  if (url.startsWith('/api') && !url.startsWith('/api/cron/')) {
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const headers = new Headers(init.headers || (typeof input === 'object' ? input.headers : {}));
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${session.access_token}`);
          }
          init = { ...init, headers };
        }
      } catch (err) {
        console.warn('Could not attach session token:', err.message);
      }
    }
  }
  return originalFetch(input, init);
};

// Register Service Worker for PWA
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

