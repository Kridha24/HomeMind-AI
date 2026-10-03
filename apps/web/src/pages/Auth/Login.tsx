import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { LoginCard } from '../../components/auth/LoginCard';
import { AuthSuccessOverlay } from '../../components/auth/AuthSuccessOverlay';
import { PhoneAuthModal } from '../../components/common/PhoneAuthModal';

// Desktop-only decorative components — hidden on mobile via CSS
import { DynamicAIMessage } from '../../components/auth/DynamicAIMessage';
import { HomeMindEcosystem } from '../../components/auth/HomeMindEcosystem';
import { FloatingFeatureCards } from '../../components/auth/FloatingFeatureCards';
import { ProductBenefits } from '../../components/auth/ProductBenefits';
import { AuthBackground } from '../../components/auth/AuthBackground';

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
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [pendingSuccessData, setPendingSuccessData] = useState<{ isNew: boolean; userName: string } | null>(null);

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'connecting' | 'success'>('idle');
  const [error, setError] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [isGisReady, setIsGisReady] = useState<boolean>(() => {
    if (Capacitor.isNativePlatform()) return true;
    return typeof window !== 'undefined' && !!window.google?.accounts?.id;
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const { fetchSettings } = useSettingStore();

  const redirectParam = searchParams.get('redirect');
  const safeRedirect = redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//') && !redirectParam.includes(':') && redirectParam !== '/login'
    ? redirectParam
    : '/';

  const [dismissSessionExpired, setDismissSessionExpired] = useState(false);
  // Show "session expired" banner if redirected here from genuine refresh failure
  const sessionExpired = !dismissSessionExpired && searchParams.get('sessionExpired') === 'true';

  // Load Google Identity Services script on Web
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setIsGisReady(true);
      return;
    }
    if (!GOOGLE_CLIENT_ID) return;

    const checkGis = () => !!window.google?.accounts?.id;

    if (checkGis()) {
      setIsGisReady(true);
      return;
    }

    let script = document.querySelector<HTMLScriptElement>('script[src*="accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (checkGis()) {
          setIsGisReady(true);
        }
      };
      script.onerror = () => {
        console.error('[Google GIS] Failed to load script from accounts.google.com');
        setError('Google sign-in script could not be loaded. Please check your internet connection or ad-blocker.');
      };
      document.head.appendChild(script);
    } else {
      // Script already injected into DOM; poll briefly for window.google.accounts.id
      const interval = setInterval(() => {
        if (checkGis()) {
          setIsGisReady(true);
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, []);

  // Initialize GIS and render official Google Sign-In button on Web
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (!isGisReady || !GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          if (response?.credential) {
            await submitGoogleToken(response.credential);
          } else {
            console.warn('[Google GIS] Callback received without credential:', response);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        itp_support: true,
      });

      const containerWidth = googleButtonRef.current.parentElement?.clientWidth || 340;
      const buttonWidth = Math.min(Math.max(Math.floor(containerWidth), 220), 380);

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: buttonWidth,
      });
    } catch (err) {
      console.warn('[Google GIS] Button initialization error:', err);
    }
  }, [isGisReady]);

  const submitGoogleToken = async (googleToken: string) => {
    setLoadingGoogle(true);
    setLoadingState('connecting');
    setError('');
    try {
      const res = await apiClient.post('/auth/google', { idToken: googleToken });
      setLoadingState('success');
      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      await fetchSettings();
      setPendingSuccessData({ isNew: !!res.data.isNewRegistration, userName: res.data.user?.name || '' });
      setTimeout(() => {
        setShowSuccessOverlay(true);
        setLoadingState('idle');
      }, 300);
    } catch (err: any) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.error;
      console.warn(`[AUTH:GOOGLE] Sign-in failed with code ${code}:`, err.response?.data?.details || msg);

      if (code === 'GOOGLE_AUDIENCE_MISMATCH') {
        setError('Google sign-in configuration error: OAuth Client ID mismatch between client and server.');
      } else if (code === 'GOOGLE_ACCOUNT_UNVERIFIED') {
        setError('Your Google account does not have a verified email address. Please verify your email with Google.');
      } else if (code === 'AUTH_SERVER_UNAVAILABLE') {
        setError('Google authentication service is temporarily unavailable. Check your connection and try again.');
      } else {
        setError(
          msg === 'Invalid Google session. Please sign in with your Google account again.'
            ? 'Google could not verify this account. Try again or use phone/email login.'
            : msg || "Google sign-in couldn't open in this browser session. Retry or use mobile sign-in."
        );
      }
      setLoadingState('idle');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const triggerGoogleSignIn = async () => {
    setError('');
    if (!GOOGLE_CLIENT_ID) {
      setError('Google sign-in is not configured. Use phone or email login, or add VITE_GOOGLE_CLIENT_ID.');
      return;
    }

    // Native Android / iOS flow using Android Credential Manager / SocialLogin
    if (Capacitor.isNativePlatform()) {
      setLoadingGoogle(true);
      setLoadingState('connecting');
      try {
        await SocialLogin.initialize({
          google: {
            webClientId: GOOGLE_CLIENT_ID,
            mode: 'online',
          },
        });

        const res = await SocialLogin.login({
          provider: 'google',
          options: {},
        });

        const result = res.result;
        const idToken = (result as any)?.idToken || (result as any)?.accessToken?.token;
        if (!idToken) {
          setError('Google did not return an account token. Please try again.');
          setLoadingGoogle(false);
          setLoadingState('idle');
          return;
        }

        await submitGoogleToken(idToken);
      } catch (err: any) {
        console.warn('[Google Native] Login error:', err);
        setLoadingGoogle(false);
        setLoadingState('idle');
        const errorMsg = err?.message || String(err || '');
        const isDismissed =
          (errorMsg.toLowerCase().includes('user cancelled') ||
           errorMsg.toLowerCase().includes('cancelled by user') ||
           errorMsg.toLowerCase().includes('canceled by user')) &&
          !errorMsg.toLowerCase().includes('reauth');

        if (isDismissed) {
          // User genuinely dismissed account picker dialog
          return;
        }

        if (
          errorMsg.includes('16') ||
          errorMsg.toLowerCase().includes('reauth') ||
          errorMsg.includes('10') ||
          errorMsg.includes('DEVELOPER_ERROR') ||
          errorMsg.includes('28444')
        ) {
          setError(
            'Google Sign-In configuration error ([16] Account reauth failed). Please ensure the Android OAuth Client ID (Package: com.kridha.homemind + SHA-1) is added in Google Cloud Console.'
          );
        } else {
          setError(err?.message || "Google sign-in couldn't open in this browser session. Retry or use mobile sign-in.");
        }
      }
      return;
    }

    // Web flow is handled directly by Google's rendered button (GIS iframe user-gesture)
    if (!window.google?.accounts?.id) {
      setError('Google sign-in is still initializing. Please wait a moment and try again.');
    }
  };

  const handleOverlayFinish = () => {
    setShowSuccessOverlay(false);
    navigate(safeRedirect, { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-primary flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-x-hidden overflow-y-auto select-none font-sans">
      <AuthBackground />

      {/* Session expired banner */}
      <AnimatePresence>
        {sessionExpired && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-amber-500/15 dark:bg-amber-950/80 backdrop-blur-xl border border-amber-500/40 text-amber-950 dark:text-amber-200 text-xs sm:text-sm font-semibold px-4 sm:px-5 py-3 rounded-2xl shadow-xl shadow-amber-500/10 max-w-md w-[92%]"
          >
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
            <span className="flex-1">Your session expired. Sign in again to continue.</span>
            <button
              onClick={() => setDismissSessionExpired(true)}
              className="text-amber-700 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-100 p-1 -mr-1 rounded-lg text-base leading-none transition-colors"
              aria-label="Dismiss banner"
            >
              &times;
            </button>
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
              <span className="font-extrabold text-base tracking-tight text-primary block">HomeMind.AI</span>
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
              <span className="font-extrabold text-lg tracking-tight text-primary block">HomeMind.AI</span>
              <span className="text-[11px] text-blue-400 font-semibold tracking-wider uppercase leading-none block">
                Apna Ghar, Smarter
              </span>
            </div>
          </div>

          <LoginCard
            onGoogleClick={triggerGoogleSignIn}
            googleButtonRef={googleButtonRef}
            isGisReady={isGisReady}
            isNative={Capacitor.isNativePlatform()}
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

      <PhoneAuthModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={async (isNew, userName) => {
          setShowPhoneModal(false);
          await fetchSettings();
          setPendingSuccessData({ isNew: !!isNew, userName: userName || '' });
          setShowSuccessOverlay(true);
        }}
      />
    </div>
  );
};

export default Login;
