import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, AlertCircle, Moon, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { LoginCard } from '../../components/auth/LoginCard';
import { HomeEntryTransition } from '../../components/auth/HomeEntryTransition';
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
  const previewTransition = searchParams.get('preview_transition') === 'true';

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
    navigate(safeRedirect, {
      replace: true,
      state: { justLoggedIn: true, welcomeName: pendingSuccessData?.userName }
    });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#070B16] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-x-hidden overflow-y-auto select-none font-sans">
      <AuthBackground />

      {/* Session expired banner */}
      <AnimatePresence>
        {sessionExpired && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-amber-500/15 backdrop-blur-xl border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-semibold px-4 sm:px-5 py-3 rounded-2xl shadow-xl shadow-amber-500/10 max-w-md w-[92%]"
          >
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
            <span className="flex-1">Your session expired. Sign in again to continue.</span>
            <button
              onClick={() => setDismissSessionExpired(true)}
              className="text-amber-400 hover:text-white p-1 -mr-1 rounded-lg text-base leading-none transition-colors"
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
            className="fixed inset-0 z-50 bg-[#070B16]/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Connecting…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. TOP NAVIGATION ── */}
      <header className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 flex items-center justify-between relative z-20">
        {/* Left: HomeMind.AI logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-white/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block">HomeMind.AI</span>
            <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase block leading-none">
              SMART HOME SYSTEM
            </span>
          </div>
        </div>

        {/* Center: Minimal Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-[#0A1128]/70 border border-white/10 backdrop-blur-xl shadow-lg">
          <span className="px-4 py-1.5 rounded-full bg-violet-600/30 text-white border border-violet-400/40 text-xs font-semibold shadow-inner cursor-pointer">
            Home
          </span>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer">
            Features
          </span>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer">
            Pricing
          </span>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer">
            About
          </span>
        </nav>

        {/* Right: Theme Toggle & Language */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="w-8 h-8 rounded-xl bg-[#0A1128]/80 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            aria-label="Theme toggle"
          >
            <Moon className="w-4 h-4 text-indigo-300" />
          </button>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A1128]/80 border border-white/10 text-xs font-medium text-slate-200">
            <span>🇺🇸</span>
            <span>English (US)</span>
          </div>
        </div>
      </header>

      {/* ── 2. HERO + AUTH MAIN CONTENT ── */}
      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10 py-6 sm:py-8 my-auto">

        {/* ── LEFT / CENTER: Hero Storytelling + Smart Home AI Visual (65% width on desktop) ── */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col justify-center space-y-6 text-left">
          
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-widest uppercase w-fit">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>SMART HOMES. HAPPIER PEOPLE.</span>
          </div>

          {/* Large Bold Headline */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-white">
              AI for <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400">
                Real Homes.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-normal max-w-xl leading-relaxed">
              From daily chores to big financial decisions — HomeMind.AI keeps your household in sync.
            </p>
          </div>

          {/* CTA & Secondary Note */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => setShowPhoneModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-indigo-600/30 border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Join Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 font-medium">
              One AI for your entire home.
            </span>
          </div>

          {/* Connected Floating Smart Home Modules Network */}
          <HomeMindEcosystem />
        </section>

        {/* ── RIGHT COLUMN: Authentication Card (approx 32-35% width) ── */}
        <section className="lg:col-span-5 xl:col-span-4 w-full flex flex-col items-center">
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

      {/* Footer Branding Note */}
      <footer className="w-full max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 relative z-20">
        <span>© {new Date().getFullYear()} HomeMind.AI • All rights reserved</span>
        <span className="hidden sm:inline">Crafted for modern households</span>
      </footer>

      {(showSuccessOverlay || previewTransition) && (
        <HomeEntryTransition
          userName={pendingSuccessData?.userName || 'Mihir'}
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
