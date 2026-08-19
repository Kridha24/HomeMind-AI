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
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { fetchSettings } = useSettingStore();

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
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* SOPHISTICATED MODERN SAAS BACKGROUND WITH GRID & AURORA GLOWS */}
      {/* ========================================================================= */}
      
      {/* 1. Subtle Elegant Tech Grid */}
      <div 
        className="absolute inset-0 opacity-[0.18] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 85%)',
        }}
      />

      {/* 2. Layered Ambient Lighting Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* MINIMALIST ARCHITECTURAL SIDE BADGES (DESKTOP) */}
      {/* ========================================================================= */}
      
      {/* Left Feature Pill */}
      <div className="hidden lg:flex flex-col gap-3 absolute left-12 top-1/2 -translate-y-1/2 max-w-xs pointer-events-none">
        <div className="p-4 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] shadow-2xl space-y-1.5 transition-all hover:border-blue-500/30">
          <div className="flex items-center gap-2 text-blue-400">
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wide uppercase">AI Intelligence</span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Automated grocery expiration predictions & smart appliance maintenance logs.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] shadow-2xl space-y-1.5 transition-all hover:border-emerald-500/30">
          <div className="flex items-center gap-2 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wide uppercase">Multi-Currency</span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Real-time household income, recurring bill telemetry & expense management.
          </p>
        </div>
      </div>

      {/* Right Feature Pill */}
      <div className="hidden lg:flex flex-col gap-3 absolute right-12 top-1/2 -translate-y-1/2 max-w-xs pointer-events-none">
        <div className="p-4 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] shadow-2xl space-y-1.5 transition-all hover:border-purple-500/30">
          <div className="flex items-center gap-2 text-purple-400">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wide uppercase">Family Workspace</span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Role-based multi-member workspace with isolated household encryption.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] shadow-2xl space-y-1.5 transition-all hover:border-cyan-500/30">
          <div className="flex items-center gap-2 text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wide uppercase">Zero Setup Friction</span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            1-Click instant Google login with automatic household cloud workspace creation.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PREMIUM CENTRAL GLASSMORPHISM LOGIN CARD */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[440px] bg-slate-900/80 backdrop-blur-2xl p-7 sm:p-9 space-y-6 relative z-10 border border-white/[0.12] rounded-3xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85)] border-t border-t-white/20">
        
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

        {/* Action Button: 1-Click Google Authentication */}
        <div className="space-y-4 pt-1">
          <button
            onClick={triggerGoogleAccountChooser}
            disabled={loadingGoogle}
            className={`w-full bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-extrabold py-4 px-5 rounded-2xl text-sm flex items-center justify-center gap-3 shadow-xl transition-all border border-white/80 group ${
              authTab === 'NEW_USER' ? 'hover:shadow-blue-500/30' : 'hover:shadow-purple-500/30'
            }`}
          >
            {loadingGoogle ? (
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
                ? 'Sign Up with Google (New User)'
                : 'Sign In with Google (Existing User)'}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Value Highlights */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-center space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-medium">⚡ Instant 1-Click</span>
              <span className="text-xs text-slate-200 font-bold block">No Password Needed</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-center space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-medium">🔒 Bank-Grade</span>
              <span className="text-xs text-slate-200 font-bold block">Isolated Household</span>
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
