import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { LoginCard } from '../../components/auth/LoginCard';
import { AuthSuccessOverlay } from '../../components/auth/AuthSuccessOverlay';
import { OnboardingWizard } from '../../components/onboarding/OnboardingWizard';
import { PhoneAuthModal } from '../../components/common/PhoneAuthModal';

// Desktop-only decorative components — hidden on mobile via CSS
import { DynamicAIMessage } from '../../components/auth/DynamicAIMessage';
import { HomeMindEcosystem } from '../../components/auth/HomeMindEcosystem';
import { FloatingFeatureCards } from '../../components/auth/FloatingFeatureCards';
import { ProductBenefits } from '../../components/auth/ProductBenefits';
import { AuthBackground } from '../../components/auth/AuthBackground';

// Firebase fallback (only used if GSI is blocked)
import { auth, googleProvider, signInWithPopup } from '../../config/firebase';

declare global {
  interface Window {
    google?: any;
  }
}

// ────────────────────────────────────────────────────────
// DO NOT hardcode a fallback Google Client ID here.
// If VITE_GOOGLE_CLIENT_ID is not set, Google sign-in
// is disabled and we show a clear message instead.
// ────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const Login: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [pendingSuccessData, setPendingSuccessData] = useState<{ isNew: boolean; userName: string } | null>(null);

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'connecting' | 'success'>('idle');
  const [error, setError] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const gsiInitialised = useRef(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const { fetchSettings } = useSettingStore();

  // Show "session expired" toast if redirected here from silent refresh failure
  const sessionExpired = searchParams.get('sessionExpired') === 'true';

  // ─── GSI Initialisation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return; // Don't load GSI script if not configured
    if (gsiInitialised.current) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGSICredential,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          gsiInitialised.current = true;
        } catch (e) {
          console.warn('[GSI] Init failed:', e);
        }
      }
    };
    document.body.appendChild(script);
    return () => {
      try { document.body.removeChild(script); } catch (_) {}
    };
  }, []);

  // ─── ONE path: GSI credential callback → POST idToken ────────────────────
  const handleGSICredential = async (response: any) => {
    const idToken = response?.credential;
    if (!idToken) {
      setError('Google sign-in failed: no credential received. Please try again.');
      setLoadingState('idle');
      setLoadingGoogle(false);
      return;
    }
    await submitGoogleIdToken(idToken);
  };

  // ─── Core token submission (shared by GSI + Firebase fallback) ───────────
  const submitGoogleIdToken = async (idToken: string) => {
    setLoadingGoogle(true);
    setLoadingState('connecting');
    setError('');
    try {
      const res = await apiClient.post('/auth/google', { idToken });
      setLoadingState('success');
      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      await fetchSettings();
      setPendingSuccessData({ isNew: !!res.data.isNewRegistration, userName: res.data.user?.name || '' });
      setTimeout(() => {
        setShowSuccessOverlay(true);
        setLoadingState('idle');
      }, 300);
    } catch (err: any) {
      const msg = err.response?.data?.error;
      setError(
        msg === 'Invalid Google session. Please sign in with your Google account again.'
          ? 'Your Google session could not be verified. Please try again.'
          : msg || 'Google sign-in failed. Check your connection and try again.'
      );
      setLoadingState('idle');
    } finally {
      setLoadingGoogle(false);
    }
  };

  // ─── Primary trigger: GSI prompt → Firebase fallback ────────────────────
  const triggerGoogleSignIn = async () => {
    setError('');

    if (!GOOGLE_CLIENT_ID) {
      setError('Google sign-in is not configured. Please contact support or use phone login.');
      return;
    }

    // Method 1: GSI prompt (uses credential/id_token — the secure path)
    if (window.google?.accounts?.id && gsiInitialised.current) {
      window.google.accounts.id.prompt((notification: any) => {
        if (
          notification.isNotDisplayed() ||
          notification.isSkippedMoment() ||
          notification.getDismissedReason() === 'credential_returned'
        ) {
          // Prompt not shown (e.g. popup blocked or user dismissed) → fall through to Firebase
          tryFirebaseFallback();
        }
        // If credential_returned, handleGSICredential fires automatically
      });
      return;
    }

    // Method 2: Firebase popup fallback (still sends idToken, never email-only)
    await tryFirebaseFallback();
  };

  const tryFirebaseFallback = async () => {
    if (!auth || !googleProvider) {
      setError('Google sign-in is unavailable. Please try phone login or check your connection.');
      return;
    }
    setLoadingGoogle(true);
    setLoadingState('connecting');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        const idToken = await result.user.getIdToken();
        // Send ONLY the verified Firebase idToken — never email/name/googleId alone.
        await submitGoogleIdToken(idToken);
      }
    } catch (err: any) {
      setLoadingGoogle(false);
      setLoadingState('idle');
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed popup — silent, no error
        return;
      }
      if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by your browser. Please allow popups for this site and try again.');
        return;
      }
      setError('Google sign-in failed. Please try again or use phone login.');
    }
  };

  const handleOverlayFinish = () => {
    setShowSuccessOverlay(false);
    navigate('/');
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-primary flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-x-hidden overflow-y-auto select-none font-sans">
      <AuthBackground />

      {/* Session expired banner */}
      <AnimatePresence>
        {sessionExpired && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Your session expired. Please sign in again.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connecting overlay */}
      <AnimatePresence>
        {loadingState === 'connecting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-secondary">Connecting…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center relative z-10 my-auto">

        {/* ── LEFT COLUMN: Brand + decorative (hidden on mobile) ── */}
        <section className="lg:col-span-7 flex flex-col justify-center space-y-5 text-left hidden lg:flex">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 border border-white/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-primary block">HomeMind AI</span>
              <span className="text-[11px] text-blue-400 font-semibold tracking-wider uppercase block leading-none">
                Smart Home System
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-1.5">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-primary">
              Apna Ghar.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-300">
                Smarter.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-secondary font-normal max-w-lg leading-relaxed pt-1">
              Expenses, groceries, bills, tasks — sab ek jagah.
            </p>
          </div>

          <DynamicAIMessage />

          {/* @media prefers-reduced-motion handled in index.css */}
          <HomeMindEcosystem />
          <FloatingFeatureCards />
          <ProductBenefits />
        </section>

        {/* ── RIGHT COLUMN: Mobile brand + auth card ── */}
        <section className="lg:col-span-5 w-full flex flex-col items-center gap-6">

          {/* Mobile-only brand (visible when left column is hidden) */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-primary block">HomeMind AI</span>
              <span className="text-[11px] text-blue-400 font-semibold tracking-wider uppercase leading-none block">
                Apna Ghar, Smarter
              </span>
            </div>
          </div>

          <LoginCard
            onGoogleClick={triggerGoogleSignIn}
            onPhoneClick={() => setShowPhoneModal(true)}
            loading={loadingGoogle}
            error={error}
            googleConfigured={!!GOOGLE_CLIENT_ID}
          />
        </section>
      </main>

      {showSuccessOverlay && (
        <AuthSuccessOverlay
          userName={pendingSuccessData?.userName}
          onFinish={handleOverlayFinish}
        />
      )}

      <OnboardingWizard
        isOpen={showOnboarding}
        initialName={pendingSuccessData?.userName}
        onComplete={() => {
          setShowOnboarding(false);
          navigate('/');
        }}
      />

      <PhoneAuthModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={() => {
          setShowPhoneModal(false);
          // Standard login logic usually calls fetchSettings then navigates
          fetchSettings().finally(() => {
             navigate('/');
          });
        }}
      />
    </div>
  );
};

export default Login;
