import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn, isSupabaseConfigured } = useAuth();
  const [email, setEmail] = useState('Mshoaibuldin371@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const checkRateLimit = () => {
    try {
      const attempts = JSON.parse(localStorage.getItem('reachout_login_attempts') || '[]');
      const fifteenMinAgo = Date.now() - 15 * 60 * 1000;
      const recentAttempts = attempts.filter((t) => t > fifteenMinAgo);
      if (recentAttempts.length >= 5) {
        const remainingMin = Math.ceil((recentAttempts[0] + 15 * 60 * 1000 - Date.now()) / 60000);
        return { locked: true, remainingMin: Math.max(1, remainingMin) };
      }
      return { locked: false, count: recentAttempts.length };
    } catch {
      return { locked: false };
    }
  };

  const recordFailedAttempt = () => {
    try {
      const attempts = JSON.parse(localStorage.getItem('reachout_login_attempts') || '[]');
      const fifteenMinAgo = Date.now() - 15 * 60 * 1000;
      const recentAttempts = attempts.filter((t) => t > fifteenMinAgo);
      recentAttempts.push(Date.now());
      localStorage.setItem('reachout_login_attempts', JSON.stringify(recentAttempts));
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const rateCheck = checkRateLimit();
    if (rateCheck.locked) {
      setError(`Too many failed login attempts (5 max). Locked for security. Try again in ${rateCheck.remainingMin} minute(s).`);
      setLoading(false);
      return;
    }

    try {
      await signIn(email, password);
      localStorage.removeItem('reachout_login_attempts');
    } catch (err) {
      recordFailedAttempt();
      const updatedCheck = checkRateLimit();
      if (updatedCheck.locked) {
        setError(`5 failed login attempts reached. Account locked for 15 minutes.`);
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest p-space-xl rounded-2xl shadow-sm border border-surface-container-high">
        {/* Brand Header */}
        <div className="text-center mb-space-lg">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-container text-on-primary mb-3 shadow-sm">
            <span className="material-symbols-outlined text-[28px]">rocket_launch</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            ReachOut AI
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Automated Cold-Outreach & Lead Growth System
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-space-md p-space-sm bg-secondary-fixed/50 border border-secondary-fixed text-on-secondary-fixed rounded-xl text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>Running in Local Mode. Enter credentials to enter the dashboard.</span>
          </div>
        )}

        {error && (
          <div className="mb-space-md p-space-sm bg-error-container text-on-error-container rounded-xl text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-space-md p-space-sm bg-primary-fixed text-on-primary-fixed rounded-xl text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-space-md">
          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1 font-medium">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Mshoaibuldin371@gmail.com"
            />
          </div>

          <div>
            <label className="block font-label-md text-label-md text-on-surface mb-1 font-medium">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-11 px-space-md rounded-xl bg-surface-container-low border border-outline-variant/60 text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-primary-container text-on-primary hover:bg-primary font-label-lg text-label-lg font-semibold shadow-sm transition-all flex items-center justify-center gap-2 mt-space-md"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-space-lg text-center pt-space-sm border-t border-surface-container-high/60">
          <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
            Private single-user workspace. Public sign-ups are disabled.
          </p>
        </div>
      </div>
    </div>
  );
}

