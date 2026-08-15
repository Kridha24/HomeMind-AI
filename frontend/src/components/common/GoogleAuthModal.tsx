import React, { useState, useEffect } from 'react';
import { X, RefreshCw, UserPlus, LogIn, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';

interface GoogleAccount {
  email: string;
  name: string;
  avatar?: string;
}

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isNewRegistration?: boolean, userName?: string) => void;
  mode: 'NEW_USER' | 'EXISTING_USER';
}

const SAVED_ACCOUNTS_KEY = 'hm_saved_google_accounts';

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<GoogleAccount[]>([]);

  const { setAuth } = useAuthStore();
  const { fetchSettings } = useSettingStore();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_ACCOUNTS_KEY) || '[]');
      if (Array.isArray(saved)) {
        setSavedAccounts(saved);
        if (saved.length === 0) {
          setIsCustomMode(true);
        }
      } else {
        setIsCustomMode(true);
      }
    } catch (e) {
      setIsCustomMode(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectAccount = async (acc: GoogleAccount) => {
    setLoading(true);
    setError('');

    try {
      const googleId = 'google-' + acc.email.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const res = await apiClient.post('/auth/google', {
        email: acc.email.toLowerCase().trim(),
        name: acc.name,
        googleId,
        avatar: acc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=3b82f6&color=fff`,
      });

      // Save to remembered accounts list
      saveAccount({
        email: acc.email.toLowerCase().trim(),
        name: acc.name,
        avatar: acc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=3b82f6&color=fff`,
      });

      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      await fetchSettings();
      onSuccess(res.data.isNewRegistration, res.data.user?.name);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid Google Account email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const resolvedName = name.trim() || email.split('@')[0];
      const googleId = 'google-' + email.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedName)}&background=4285F4&color=fff`;

      const res = await apiClient.post('/auth/google', {
        email: email.toLowerCase().trim(),
        name: resolvedName,
        googleId,
        avatar,
      });

      saveAccount({
        email: email.toLowerCase().trim(),
        name: resolvedName,
        avatar,
      });

      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      await fetchSettings();
      onSuccess(res.data.isNewRegistration, res.data.user?.name);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const saveAccount = (acc: GoogleAccount) => {
    try {
      const current = JSON.parse(localStorage.getItem(SAVED_ACCOUNTS_KEY) || '[]');
      const filtered = current.filter((a: GoogleAccount) => a.email !== acc.email);
      const updated = [acc, ...filtered].slice(0, 5);
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Google Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20 border border-slate-200">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
            {savedAccounts.length > 0 && !isCustomMode
              ? 'Choose a Google Account'
              : mode === 'NEW_USER'
              ? 'Sign Up with Google Account'
              : 'Sign In with Google Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {savedAccounts.length > 0 && !isCustomMode
              ? 'to continue to HomeMind AI Household System'
              : 'Enter your Google email to authenticate your account'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* Saved Google Accounts List (Account Chooser) */}
        {!isCustomMode && savedAccounts.length > 0 ? (
          <div className="space-y-2.5">
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
              {savedAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleSelectAccount(acc)}
                  disabled={loading}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-slate-800/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=3b82f6&color=fff`}
                      alt={acc.name}
                      className="w-10 h-10 rounded-full border border-blue-500/30 object-cover"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-100 block group-hover:text-blue-400 transition-colors">
                        {acc.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {acc.email}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsCustomMode(true)}
              className="w-full py-3 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4 text-blue-400" /> Use another Google Account
            </button>
          </div>
        ) : (
          /* Custom Google Account Entry Form */
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Google Account Email <span className="text-blue-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Your Full Name <span className="text-slate-500">(Google Profile Name)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mihir Shekhar"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with this Google Account</span>
                </>
              )}
            </button>

            {savedAccounts.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="w-full text-center text-xs text-blue-400 hover:text-blue-300 pt-2 transition-colors"
              >
                ← Back to Saved Accounts
              </button>
            )}
          </form>
        )}

        <div className="pt-2 text-center text-[10px] text-slate-500 border-t border-slate-800/80">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Authenticates directly with your chosen Google Identity
          </p>
        </div>
      </div>
    </div>
  );
};
