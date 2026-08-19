import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  RefreshCw,
  UserPlus,
  LogIn,
  Lock,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { GoogleAuthModal } from '../../components/common/GoogleAuthModal';
import { NewUserOnboardingModal } from '../../components/common/NewUserOnboardingModal';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const Login: React.FC = () => {
  const [authTab, setAuthTab] = useState<'NEW_USER' | 'EXISTING_USER'>('NEW_USER');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [directEmail, setDirectEmail] = useState('');
  const [directName, setDirectName] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { fetchSettings } = useSettingStore();

  const handleDirectGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directEmail || !directEmail.includes('@')) {
      setError('Please enter a valid Google / Gmail address.');
      return;
    }

    setLoadingGoogle(true);
    setError('');

    try {
      const resolvedName = directName.trim() || directEmail.split('@')[0];
      const googleId = 'google-' + directEmail.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedName)}&background=4285F4&color=fff`;

      const res = await apiClient.post('/auth/google', {
        email: directEmail.toLowerCase().trim(),
        name: resolvedName,
        googleId,
        avatar,
      });

      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      await fetchSettings();

      if (authTab === 'NEW_USER' && res.data.isNewRegistration) {
        setNewUserName(res.data.user?.name || resolvedName);
        setShowOnboardingModal(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google Login failed. Please try again.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } catch (e) {
          console.warn('Google GSI init failed:', e);
        }
      }
    };
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  const handleGoogleCallback = async (response: any) => {
    setLoadingGoogle(true);
    setError('');

    try {
      const idToken = response.credential;
      const res = await apiClient.post('/auth/google', { idToken });
      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      await fetchSettings();

      if (authTab === 'NEW_USER' && res.data.isNewRegistration) {
        setNewUserName(res.data.user.name || '');
        setShowOnboardingModal(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setShowGoogleModal(true);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const triggerGoogleAccountChooser = () => {
    setError('');

    if (window.google?.accounts?.oauth2 && GOOGLE_CLIENT_ID) {
      try {
        setLoadingGoogle(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();
                
                const res = await apiClient.post('/auth/google', {
                  email: userInfo.email,
                  name: userInfo.name || userInfo.email.split('@')[0],
                  avatar: userInfo.picture,
                  googleId: 'google-' + userInfo.sub,
                });

                setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
                await fetchSettings();

                if (authTab === 'NEW_USER' && res.data.isNewRegistration) {
                  setNewUserName(res.data.user.name || '');
                  setShowOnboardingModal(true);
                } else {
                  navigate('/');
                }
              } catch (err: any) {
                console.error('Google Auth backend error:', err);
                setShowGoogleModal(true);
              } finally {
                setLoadingGoogle(false);
              }
            } else {
              setLoadingGoogle(false);
              if (tokenResponse?.error !== 'popup_closed_by_user') {
                setShowGoogleModal(true);
              }
            }
          },
          error_callback: () => {
            setLoadingGoogle(false);
            setShowGoogleModal(true);
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('OAuth2 popup client error, falling back to modal:', e);
        setLoadingGoogle(false);
        setShowGoogleModal(true);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleAuthSuccess = async (isNewReg?: boolean, userName?: string) => {
    setShowGoogleModal(false);
    await fetchSettings();

    if (authTab === 'NEW_USER' && isNewReg) {
      setNewUserName(userName || '');
      setShowOnboardingModal(true);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#030712] text-slate-100 flex items-center justify-center p-3 sm:p-6 md:p-8 relative overflow-x-hidden overflow-y-auto select-none">
      {/* ========================================================================= */}
      {/* SOPHISTICATED MODERN SAAS BACKGROUND WITH GRID & AURORA GLOWS */}
      {/* ========================================================================= */}
      
      {/* 1. Subtle Elegant Tech Grid */}
      <div 
        className="fixed inset-0 opacity-[0.15] sm:opacity-[0.18] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 85%)',
        }}
      />

      {/* 2. Layered Ambient Lighting Orbs */}
      <div className="fixed -top-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-600/20 sm:bg-indigo-600/25 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-600/15 sm:bg-cyan-600/20 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-blue-600/10 rounded-full blur-[120px] sm:blur-[160px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* MINIMALIST ARCHITECTURAL SIDE BADGES (DESKTOP & LARGE SCREENS ONLY) */}
      {/* ========================================================================= */}
      
      {/* Left Feature Pill (Desktop) */}
      <div className="hidden xl:flex flex-col gap-3 absolute left-8 2xl:left-16 top-1/2 -translate-y-1/2 max-w-[260px] 2xl:max-w-xs pointer-events-none z-0">
        <div className="p-4 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] shadow-2xl space-y-1.5 transition-all">
          <div className="flex items-center gap-2 text-blue-400">
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wide uppercase">AI Intelligence</span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Automated grocery expiration predictions & smart appliance logs.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] shadow-2xl space-y-1.5 transition-all">
          <div className="flex items-center gap-2 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wide uppercase">Multi-Currency</span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Real-time household income, bill telemetry & expense management.
          </p>
        </div>
      </div>

      {/* Right Feature Pill (Desktop) */}
      <div className="hidden xl:flex flex-col gap-3 absolute right-8 2xl:right-16 top-1/2 -translate-y-1/2 max-w-[260px] 2xl:max-w-xs pointer-events-none z-0">
        <div className="p-4 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] shadow-2xl space-y-1.5 transition-all">
          <div className="flex items-center gap-2 text-purple-400">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wide uppercase">Family Workspace</span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Role-based multi-member workspace with isolated household encryption.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] shadow-2xl space-y-1.5 transition-all">
          <div className="flex items-center gap-2 text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wide uppercase">Zero Setup Friction</span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            1-Click instant Google login with automatic cloud database workspace.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RESPONSIVE CENTRAL GLASSMORPHISM LOGIN CARD */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[430px] my-auto bg-slate-900/85 backdrop-blur-2xl p-5 sm:p-7 md:p-8 space-y-5 sm:space-y-6 relative z-10 border border-white/[0.12] rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] border-t border-t-white/20">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500/30 rounded-2xl blur-xl animate-pulse" />
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl border border-white/20 relative z-10">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              HomeMind AI
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Intelligent Household Management Operating System
            </p>
          </div>
        </div>

        {/* Tab Switcher: Explicit New User vs Existing User */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select User Type:
            </span>
            <span className="text-[11px] font-semibold text-blue-400">
              {authTab === 'NEW_USER' ? '🆕 New User Mode' : '🔑 Existing User Mode'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-950/90 p-1.5 rounded-2xl border border-white/[0.08] shadow-inner">
            <button
              onClick={() => {
                setAuthTab('NEW_USER');
                setError('');
              }}
              className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                authTab === 'NEW_USER'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" /> <strong>New User</strong>
              </span>
              <span className="text-[10px] font-normal opacity-80">(Naya Account / Sign Up)</span>
            </button>

            <button
              onClick={() => {
                setAuthTab('EXISTING_USER');
                setError('');
              }}
              className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                authTab === 'EXISTING_USER'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <LogIn className="w-4 h-4" /> <strong>Existing User</strong>
              </span>
              <span className="text-[10px] font-normal opacity-80">(Pehle se Account / Sign In)</span>
            </button>
          </div>

          {/* Contextual Explanatory Banner */}
          <div className={`p-3 rounded-2xl text-xs border transition-all ${
            authTab === 'NEW_USER' 
              ? 'bg-blue-500/10 border-blue-500/25 text-blue-300' 
              : 'bg-purple-500/10 border-purple-500/25 text-purple-300'
          }`}>
            <p className="font-semibold flex items-center gap-1.5">
              {authTab === 'NEW_USER' ? '🆕 New User Sign Up:' : '🔑 Existing User Sign In:'}
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              {authTab === 'NEW_USER'
                ? 'Creates a fresh, personal household database with your Google profile.'
                : 'Instantly logs into your existing household and loads your saved data.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* Action Buttons: 1-Click Google Popup & Direct Google Email Entry */}
        <div className="space-y-4 pt-1">
          {/* 1. Direct Google OAuth Popup Button */}
          <button
            type="button"
            onClick={triggerGoogleAccountChooser}
            disabled={loadingGoogle}
            className={`w-full bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-extrabold py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xl transition-all border border-white/80 group ${
              authTab === 'NEW_USER' ? 'hover:shadow-blue-500/30' : 'hover:shadow-purple-500/30'
            }`}
          >
            {loadingGoogle ? (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform flex-shrink-0" viewBox="0 0 24 24">
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
            )}
            <span>
              {authTab === 'NEW_USER'
                ? '1-Click Google Sign Up (Popup)'
                : '1-Click Google Sign In (Popup)'}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-0.5">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              Or Enter Google Email
            </span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          {/* 2. In-Card Google Email Form */}
          <form onSubmit={handleDirectGoogleLogin} className="space-y-3">
            {authTab === 'NEW_USER' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Google / Gmail Email Address <span className="text-blue-400">*</span>
              </label>
              <input
                type="email"
                required
                value={directEmail}
                onChange={(e) => setDirectEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loadingGoogle}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${
                authTab === 'NEW_USER'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/25 border border-blue-400/30'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-purple-500/25 border border-purple-400/30'
              }`}
            >
              {loadingGoogle ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {authTab === 'NEW_USER'
                      ? 'Sign Up with this Google Email'
                      : 'Sign In with this Google Email'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Value Highlights */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/[0.06] text-center space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-medium">⚡ Instant 1-Click</span>
              <span className="text-[11px] text-slate-200 font-bold block">No Password Needed</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/[0.06] text-center space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-medium">🔒 Bank-Grade</span>
              <span className="text-[11px] text-slate-200 font-bold block">Isolated Household</span>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="pt-4 text-center text-[11px] text-slate-500 space-y-1.5 border-t border-white/[0.08]">
          <p className="flex items-center justify-center gap-1.5 font-semibold text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> Enterprise Multi-Tenant Data Isolation
          </p>
          <p className="text-[10px] text-slate-500 leading-tight">
            {authTab === 'NEW_USER'
              ? '✨ New User automatically initializes a clean, personal household workspace'
              : '💾 Existing User automatically loads your permanently saved household data'}
          </p>
        </div>
      </div>

      {/* Google Modal Fallback (If popup is blocked) */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        mode={authTab}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={(isNew, name) => handleAuthSuccess(isNew, name)}
      />

      <NewUserOnboardingModal
        isOpen={showOnboardingModal}
        initialName={newUserName}
        onComplete={() => {
          setShowOnboardingModal(false);
          navigate('/');
        }}
      />
    </div>
  );
};
