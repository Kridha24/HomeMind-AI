import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { GoogleAuthModal } from '../../components/common/GoogleAuthModal';
import { AuthBackground } from '../../components/auth/AuthBackground';
import { DynamicAIMessage } from '../../components/auth/DynamicAIMessage';
import { HomeMindEcosystem } from '../../components/auth/HomeMindEcosystem';
import { FloatingFeatureCards } from '../../components/auth/FloatingFeatureCards';
import { ProductBenefits } from '../../components/auth/ProductBenefits';
import { LoginCard } from '../../components/auth/LoginCard';
import { AuthSuccessOverlay } from '../../components/auth/AuthSuccessOverlay';
import { OnboardingWizard } from '../../components/onboarding/OnboardingWizard';

import {
  auth,
  googleProvider,
  signInWithPopup,
} from '../../config/firebase';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '91216619042-uq0127o11vljo7u8am7l4ng3f7rb1sid.apps.googleusercontent.com';

export const Login: React.FC = () => {
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [pendingSuccessData, setPendingSuccessData] = useState<{
    isNew: boolean;
    userName: string;
  } | null>(null);

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { fetchSettings } = useSettingStore();

  useEffect(() => {
    // Initialize Google Identity Services (GSI)
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

      setPendingSuccessData({
        isNew: !!res.data.isNewRegistration,
        userName: res.data.user?.name || '',
      });
      setShowSuccessOverlay(true);
    } catch (err: any) {
      setShowGoogleModal(true);
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Google OAuth Primary Action Trigger
  const triggerGoogleAccountChooser = async () => {
    setError('');
    setLoadingGoogle(true);

    // Method 1: Google Identity Services (GSI) Token Client Popup (No redirect_uri_mismatch, opens official Google Account Chooser)
    if (window.google?.accounts?.oauth2 && GOOGLE_CLIENT_ID) {
      try {
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
                  name: userInfo.name || userInfo.email?.split('@')[0],
                  avatar: userInfo.picture,
                  googleId: 'google-' + userInfo.sub,
                });

                setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
                await fetchSettings();

                setPendingSuccessData({
                  isNew: !!res.data.isNewRegistration,
                  userName: res.data.user?.name || userInfo?.name || '',
                });
                setShowSuccessOverlay(true);
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
          error_callback: (err: any) => {
            console.warn('GSI Token Client error callback:', err);
            setLoadingGoogle(false);
            setShowGoogleModal(true);
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (gsiErr) {
        console.warn('GSI popup error, trying Firebase:', gsiErr);
      }
    }

    // Method 2: Firebase Google Popup (Fallback)
    if (auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result && result.user) {
          const idToken = await result.user.getIdToken();
          const res = await apiClient.post('/auth/google', {
            idToken,
            email: result.user.email,
            name: result.user.displayName || result.user.email?.split('@')[0],
            avatar: result.user.photoURL,
            googleId: 'google-' + result.user.uid,
          });

          setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
          await fetchSettings();

          setPendingSuccessData({
            isNew: !!res.data.isNewRegistration,
            userName: res.data.user?.name || result.user.displayName || '',
          });
          setShowSuccessOverlay(true);
          return;
        }
      } catch (fbErr: any) {
        console.warn('Firebase Google Auth popup:', fbErr);
        if (fbErr.code === 'auth/popup-closed-by-user' || fbErr.code === 'auth/cancelled-popup-request') {
          setLoadingGoogle(false);
          return;
        }
      }
    }

    // Method 3: Fallback Google Modal
    setLoadingGoogle(false);
    setShowGoogleModal(true);
  };

  const handleModalAuthSuccess = async (isNew?: boolean, userName?: string) => {
    setShowGoogleModal(false);
    await fetchSettings();

    setPendingSuccessData({
      isNew: !!isNew,
      userName: userName || '',
    });
    setShowSuccessOverlay(true);
  };

  const handleOverlayFinish = () => {
    setShowSuccessOverlay(false);
    navigate('/');
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#030712] text-primary flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-x-hidden overflow-y-auto select-none font-sans">
      <AuthBackground />

      <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center relative z-10 my-auto">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: PRODUCT EXPERIENCE & AI ECOSYSTEM (DESKTOP) */}
        {/* ========================================================================= */}
        <section className="lg:col-span-7 flex flex-col justify-center space-y-5 text-left">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 border border-white/20">
              <Sparkles className="w-5 h-5" />
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
          <div className="space-y-1.5">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
              Your Home.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-200">
                Smarter.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-secondary font-normal max-w-lg leading-relaxed pt-1">
              One intelligent system for everything that matters at home.
            </p>
          </div>

          {/* Dynamic AI Message Ticker */}
          <div>
            <DynamicAIMessage />
          </div>

          {/* Connected HomeMind Ecosystem Visualization (Desktop / Tablet) */}
          <div className="hidden sm:block">
            <HomeMindEcosystem />
          </div>

          {/* Floating Product Intelligence Cards */}
          <div className="hidden sm:block">
            <FloatingFeatureCards />
          </div>

          {/* 3 Core Product Benefits */}
          <div className="hidden sm:block">
            <ProductBenefits />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: SINGLE GOOGLE AUTHENTICATION CARD */}
        {/* ========================================================================= */}
        <section className="lg:col-span-5 w-full flex justify-center">
          <LoginCard
            onGoogleClick={triggerGoogleAccountChooser}
            loading={loadingGoogle}
            error={error}
          />
        </section>

      </main>

      {/* 600ms Login Success Transition */}
      {showSuccessOverlay && (
        <AuthSuccessOverlay
          userName={pendingSuccessData?.userName}
          onFinish={handleOverlayFinish}
        />
      )}

      {/* Multi-Step First-Time User Onboarding */}
      <OnboardingWizard
        isOpen={showOnboarding}
        initialName={pendingSuccessData?.userName}
        onComplete={() => {
          setShowOnboarding(false);
          navigate('/');
        }}
      />

      {/* Fallback Google Modal */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        mode="EXISTING_USER"
        onClose={() => setShowGoogleModal(false)}
        onSuccess={(isNew, name) => handleModalAuthSuccess(isNew, name)}
      />
    </div>
  );
};

export default Login;
