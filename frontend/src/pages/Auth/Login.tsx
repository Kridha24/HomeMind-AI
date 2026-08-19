import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertCircle } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { GoogleAuthModal } from '../../components/common/GoogleAuthModal';
import { NewUserOnboardingModal } from '../../components/common/NewUserOnboardingModal';
import { AuthBackground } from '../../components/auth/AuthBackground';
import { EcosystemVisual } from '../../components/auth/EcosystemVisual';
import { FeatureCards } from '../../components/auth/FeatureCards';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';
import { SecurityBadge } from '../../components/auth/SecurityBadge';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const Login: React.FC = () => {
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

  // Google OAuth GSI Callback Handler
  const handleGoogleCallback = async (response: any) => {
    setLoadingGoogle(true);
    setError('');

    try {
      const idToken = response.credential;
      const res = await apiClient.post('/auth/google', { idToken });
      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      await fetchSettings();

      if (res.data.isNewRegistration) {
        setNewUserName(res.data.user?.name || '');
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

  // Google OAuth Popup Trigger
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

                if (res.data.isNewRegistration) {
                  setNewUserName(res.data.user?.name || '');
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

    if (isNewReg) {
      setNewUserName(userName || '');
      setShowOnboardingModal(true);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#030712] text-slate-100 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-x-hidden overflow-y-auto select-none font-sans">
      <AuthBackground />

      <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center relative z-10 my-auto">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: HOMEMIND INTRODUCTION & AI ECOSYSTEM (DESKTOP) */}
        {/* ========================================================================= */}
        <section className="lg:col-span-7 flex flex-col justify-center space-y-6 text-left">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 border border-white/20">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">
                HomeMind AI
              </span>
              <span className="text-[11px] text-blue-400 font-semibold tracking-wider uppercase block leading-none">
                Intelligent Operating System
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
              Your Home.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-200">
                Smarter.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-normal max-w-lg leading-relaxed pt-1">
              One intelligent system for everything that matters at home.
            </p>
          </div>

          {/* Connected AI Ecosystem Visual (Desktop/Tablet) */}
          <div className="hidden sm:block">
            <EcosystemVisual />
          </div>

          {/* 3 Product Benefits Cards */}
          <div className="hidden sm:block">
            <FeatureCards />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: AUTHENTICATION CARD (GOOGLE-ONLY) */}
        {/* ========================================================================= */}
        <section className="lg:col-span-5 w-full flex justify-center">
          <div className="w-full max-w-[430px] bg-slate-900/85 backdrop-blur-3xl p-7 sm:p-9 space-y-6 border border-white/[0.12] rounded-3xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9)] border-t border-t-white/20">
            
            {/* Card Header */}
            <div className="space-y-1.5 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome to HomeMind 👋
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Your intelligent home starts here.
              </p>
            </div>

            {/* Error Message (Friendly, No raw error dumps) */}
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-red-200">Unable to sign you in</strong>
                  <span>Something went wrong. Please try again.</span>
                </div>
              </div>
            )}

            {/* Primary Action CTA: Google Authentication ONLY */}
            <div className="space-y-4 pt-1">
              <GoogleLoginButton
                onClick={triggerGoogleAccountChooser}
                loading={loadingGoogle}
              />

              {/* Value Highlights */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-center space-y-0.5">
                  <span className="text-[10px] text-slate-400 block font-medium">⚡ 1-Click Access</span>
                  <span className="text-xs text-slate-200 font-bold block">No Password Needed</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-center space-y-0.5">
                  <span className="text-[10px] text-slate-400 block font-medium">🔒 Bank-Grade</span>
                  <span className="text-xs text-slate-200 font-bold block">Isolated Household</span>
                </div>
              </div>
            </div>

            {/* Security Message */}
            <SecurityBadge />
          </div>
        </section>

      </main>

      {/* Google Modal Fallback (If popup is blocked) */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        mode="EXISTING_USER"
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

export default Login;
