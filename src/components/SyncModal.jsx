import React, { useState } from 'react';
import { X, Cloud, Lock, Mail, ArrowRight, Download, LogOut, CheckCircle2 } from 'lucide-react';
import { THEMES } from '../utils/theme.js';

export const SyncModal = ({ user, isOpen, onClose, onLoginSuccess, onLogout, localEntries }) => {
  const [mode, setMode] = useState('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(user.name || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const theme = THEMES[user.theme] || THEMES.oatmeal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: mode === 'register' ? name : undefined,
          guestUserId: user.id,
          localEntries: Object.values(localEntries),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setSuccessMsg(mode === 'register' ? 'Account created and synced!' : 'Signed in successfully!');
      setTimeout(() => {
        onLoginSuccess(
          { ...user, id: data.user.id, email: data.user.email, name: data.user.name || user.name, isRegistered: true },
          data.entries || []
        );
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = () => {
    const data = { profile: user, entries: localEntries, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stillword-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        className={`w-full max-w-md rounded-2xl border ${theme.border} ${theme.surface} p-6 shadow-xl relative animate-fadeIn`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-stone-400 hover:text-stone-700 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <div className="w-8 h-8 rounded-full bg-stone-200/60 dark:bg-stone-800 flex items-center justify-center mb-3">
            <Cloud className="w-4 h-4 text-stone-700 dark:text-stone-300" />
          </div>
          <h3 className={`text-xl font-serif-writing font-medium ${theme.text}`}>
            {user.isRegistered ? 'Cloud Sync Active' : 'Sync Across Devices'}
          </h3>
          <p className={`text-xs font-sans mt-1.5 leading-relaxed ${theme.textMuted}`}>
            {user.isRegistered ? (
              <>Your morning pages are continuously synced with <span className="font-semibold">{user.email}</span>.</>
            ) : (
              <>
                You are currently writing as guest. Your streak and writing are saved locally in this browser.
                Sign in with email & password only if you wish to sync across multiple computers or phones.
              </>
            )}
          </p>
        </div>

        {user.isRegistered ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg border border-emerald-300/40 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>All current entries are safely backed up to the cloud.</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleExportBackup}
                className={`w-full py-2 px-3 text-xs font-medium rounded-lg border ${theme.border} ${theme.textMuted} hover:${theme.text} flex items-center justify-center gap-2 transition-colors`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export offline JSON backup</span>
              </button>

              <button
                onClick={() => { onLogout(); onClose(); }}
                className="w-full py-2 px-3 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out on this device</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-1 p-1 bg-stone-200/50 dark:bg-stone-800/60 rounded-lg mb-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  mode === 'register' ? 'bg-white dark:bg-stone-700 shadow-xs text-stone-900 dark:text-stone-100' : 'text-stone-500'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  mode === 'signin' ? 'bg-white dark:bg-stone-700 shadow-xs text-stone-900 dark:text-stone-100' : 'text-stone-500'
                }`}
              >
                Sign In
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 p-2.5 rounded-md bg-rose-50 text-rose-700 text-xs border border-rose-200">{errorMsg}</div>
            )}
            {successMsg && (
              <div className="mb-3 p-2.5 rounded-md bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">{successMsg}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className={`block text-[11px] uppercase tracking-wider mb-1 ${theme.textSubtle}`}>
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Harshit"
                    className={`w-full px-3 py-2 text-xs rounded-lg border ${theme.border} bg-white/70 dark:bg-stone-900/60 ${theme.text} outline-none focus:border-stone-500`}
                  />
                </div>
              )}

              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${theme.textSubtle}`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${theme.border} bg-white/70 dark:bg-stone-900/60 ${theme.text} outline-none focus:border-stone-500`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] uppercase tracking-wider mb-1 ${theme.textSubtle}`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${theme.border} bg-white/70 dark:bg-stone-900/60 ${theme.text} outline-none focus:border-stone-500`}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 px-4 text-xs font-medium rounded-lg ${theme.accent} ${theme.accentHover} disabled:opacity-50 flex items-center justify-center gap-2 transition-colors`}
                >
                  {loading ? (
                    <span>Syncing...</span>
                  ) : (
                    <>
                      <span>{mode === 'register' ? 'Save & Sync to Cloud' : 'Sign In and Fetch Archive'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-stone-200/50 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
              <span>Device ID: {user.id.slice(0, 14)}...</span>
              <button type="button" onClick={handleExportBackup} className="hover:underline flex items-center gap-1">
                <Download className="w-3 h-3" /> Export JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
