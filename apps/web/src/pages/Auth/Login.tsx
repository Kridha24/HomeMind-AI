import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Sparkles, AlertCircle, Moon, Sun, ArrowRight, ChevronDown, Check, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { LoginCard } from '../../components/auth/LoginCard';
import { HomeEntryTransition } from '../../components/auth/HomeEntryTransition';
import { HomeMindEcosystem } from '../../components/auth/HomeMindEcosystem';
import { FloatingFeatureCards } from '../../components/auth/FloatingFeatureCards';
import { AuthBackground } from '../../components/auth/AuthBackground';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const INDIAN_LANGUAGES = [
  { code: 'en-IN', name: 'English (IN)', native: 'English' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी' },
];

export const Login: React.FC = () => {
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [pendingSuccessData, setPendingSuccessData] = useState<{ isNew: boolean; userName: string } | null>(null);

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'connecting' | 'success'>('idle');
  const [error, setError] = useState('');
  const [ecosystemHighlighted, setEcosystemHighlighted] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const [termsAccepted, setTermsAcceptedState] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem('homemind_terms_accepted') === 'true';
  });
  const termsAcceptedRef = useRef<boolean>(termsAccepted);

  const setTermsAccepted = (val: boolean) => {
    termsAcceptedRef.current = val;
    setTermsAcceptedState(val);
    try {
      localStorage.setItem('homemind_terms_accepted', val ? 'true' : 'false');
    } catch {}
  };

  useEffect(() => {
    termsAcceptedRef.current = termsAccepted;
  }, [termsAccepted]);

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const loginSectionRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const googleAttemptRef = useRef<{ id: string; timestamp: number } | null>(null);
  const submitGoogleTokenRef = useRef<((token: string, attemptId: string) => Promise<void>) | null>(null);

  const [isGisReady, setIsGisReady] = useState<boolean>(() => {
    if (Capacitor.isNativePlatform()) return true;
    return typeof window !== 'undefined' && !!window.google?.accounts?.id;
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const { theme, setTheme, fetchSettings, setLanguage } = useSettingStore();
  const isLight = theme === 'light';

  const redirectParam = searchParams.get('redirect');
  const safeRedirect =
    redirectParam &&
    redirectParam.startsWith('/') &&
    !redirectParam.startsWith('//') &&
    !redirectParam.includes(':') &&
    redirectParam !== '/login'
      ? redirectParam
      : '/';

  const [dismissSessionExpired, setDismissSessionExpired] = useState(false);
  const sessionExpired = !dismissSessionExpired && searchParams.get('sessionExpired') === 'true';
  const previewTransition = searchParams.get('preview_transition') === 'true';

  // Mount logging & cleanup
  useEffect(() => {
    isMountedRef.current = true;
    console.log('[AUTH_UI] login page mounted');
    // Ensure no stale errors on mount
    setError('');

    return () => {
      isMountedRef.current = false;
      googleAttemptRef.current = null;
    };
  }, []);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Register an intentional user Google attempt
  const registerGoogleAttempt = () => {
    const attemptId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    googleAttemptRef.current = { id: attemptId, timestamp: Date.now() };
    console.log('[AUTH_UI] google attempt started');
    setError('');
    return attemptId;
  };

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
        if (isMountedRef.current) {
          setError('Google Sign-In is temporarily unavailable. Check your connection or use mobile sign-in.');
        }
      };
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (checkGis()) {
          setIsGisReady(true);
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, []);

  // Keep submitGoogleTokenRef always current across re-renders
  submitGoogleTokenRef.current = async (googleToken: string, attemptId: string) => {
    return submitGoogleToken(googleToken, attemptId);
  };

  // Initialize GIS and render official Google Sign-In button on Web
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (!isGisReady || !GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          console.log('[AUTH_UI] google credential callback received');
          if (response?.credential) {
            const attemptId = registerGoogleAttempt();
            if (submitGoogleTokenRef.current) {
              await submitGoogleTokenRef.current(response.credential, attemptId);
            }
          } else {
            console.warn('[AUTH_UI] google callback received without credential');
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        itp_support: false, // Prevents aggressive ambient prompt loops
      });

      const containerWidth = googleButtonRef.current.parentElement?.clientWidth || 340;
      const buttonWidth = Math.min(Math.max(Math.floor(containerWidth), 220), 380);

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: isLight ? 'outline' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: buttonWidth,
      });

      // Capture clicks on the rendered button container to register user intent
      const btnEl = googleButtonRef.current;
      const handleUserClick = () => {
        registerGoogleAttempt();
      };
      btnEl.addEventListener('pointerdown', handleUserClick, { capture: true });
      btnEl.addEventListener('click', handleUserClick, { capture: true });

      return () => {
        btnEl.removeEventListener('pointerdown', handleUserClick, { capture: true });
        btnEl.removeEventListener('click', handleUserClick, { capture: true });
      };
    } catch (err) {
      console.warn('[Google GIS] Button initialization error:', err);
    }
  }, [isGisReady, isLight]);

  const submitGoogleToken = async (googleToken: string, attemptId: string) => {
    if (!isMountedRef.current) return;
    const isAccepted = termsAcceptedRef.current || (typeof localStorage !== 'undefined' && localStorage.getItem('homemind_terms_accepted') === 'true');
    if (!isAccepted) {
      setError('Please accept the Terms of Service & Privacy Policy before signing in.');
      setLoadingGoogle(false);
      setLoadingState('idle');
      return;
    }
    if (googleAttemptRef.current?.id !== attemptId) {
      console.warn('[AUTH_UI] ignoring stale google token response');
      return;
    }

    setLoadingGoogle(true);
    setLoadingState('connecting');
    setError('');
    console.log('[AUTH_UI] google backend request started');

    try {
      const res = await apiClient.post('/auth/google', { idToken: googleToken });
      if (!isMountedRef.current || googleAttemptRef.current?.id !== attemptId) return;

      setLoadingState('success');
      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      await fetchSettings();
      setPendingSuccessData({ isNew: !!res.data.isNewRegistration, userName: res.data.user?.name || '' });
      setTimeout(() => {
        if (!isMountedRef.current) return;
        setShowSuccessOverlay(true);
        setLoadingState('idle');
      }, 300);
    } catch (err: any) {
      if (!isMountedRef.current || googleAttemptRef.current?.id !== attemptId) return;

      const code = err.response?.data?.code;
      const msg = err.response?.data?.error;
      console.warn(`[AUTH_UI] google backend request failed code=${code || err.code || 'UNKNOWN'}`);

      // Separate error types
      if (code === 'GOOGLE_AUDIENCE_MISMATCH') {
        setError('Google sign-in configuration error: OAuth Client ID mismatch between client and server.');
      } else if (code === 'GOOGLE_ACCOUNT_UNVERIFIED') {
        setError('Your Google account does not have a verified email address. Please verify your email with Google.');
      } else if (code === 'AUTH_SERVER_UNAVAILABLE' || err.code === 'ERR_NETWORK' || !err.response) {
        setError("HomeMind couldn't reach the server. Please check your connection and try again.");
      } else {
        // Human-friendly error only after intentional user attempt
        setError("We couldn't complete Google sign-in. Please try again or use mobile sign-in.");
      }
      setLoadingState('idle');
    } finally {
      if (isMountedRef.current) {
        setLoadingGoogle(false);
      }
    }
  };

  const triggerGoogleSignIn = async () => {
    setError('');
    const isAccepted = termsAcceptedRef.current || (typeof localStorage !== 'undefined' && localStorage.getItem('homemind_terms_accepted') === 'true');
    if (!isAccepted) {
      setError('Please accept the Terms of Service & Privacy Policy before signing in.');
      return;
    }
    if (!GOOGLE_CLIENT_ID) {
      setError('Google sign-in is not configured. Use phone login or set VITE_GOOGLE_CLIENT_ID.');
      return;
    }

    const attemptId = registerGoogleAttempt();

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

        await submitGoogleToken(idToken, attemptId);
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
          // Return cleanly to idle without error banner
          return;
        }

        setError("We couldn't complete Google sign-in. Please try mobile sign-in.");
      }
      return;
    }

    if (!window.google?.accounts?.id) {
      setError('Google sign-in is still initializing. Please wait a moment and try again.');
    }
  };

  const handleOverlayFinish = () => {
    setShowSuccessOverlay(false);
    navigate(safeRedirect, {
      replace: true,
      state: { justLoggedIn: true, welcomeName: pendingSuccessData?.userName },
    });
  };

  const scrollToLoginCard = () => {
    loginSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSeeHowItWorks = () => {
    setEcosystemHighlighted(true);
    setTimeout(() => setEcosystemHighlighted(false), 2400);
  };

  const handleSelectLanguage = (langCode: string) => {
    setSelectedLang(langCode);
    setLanguage(langCode);
    setLangDropdownOpen(false);
  };

  const currentLangObj = INDIAN_LANGUAGES.find((l) => l.code === selectedLang) || INDIAN_LANGUAGES[0];

  return (
    <div
      className={`min-h-[100dvh] lg:h-screen lg:max-h-screen w-full flex flex-col justify-between p-3 sm:p-5 lg:px-8 lg:py-3.5 relative overflow-x-hidden overflow-y-auto lg:overflow-hidden select-none font-sans transition-colors duration-700 ${
        isLight ? 'bg-[#F4F6FC] text-slate-800' : 'bg-[#070B16] text-white'
      }`}
    >
      <AuthBackground />

      {/* Session Expired Banner */}
      <AnimatePresence>
        {sessionExpired && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-amber-500/15 backdrop-blur-xl border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl shadow-amber-500/10 max-w-md w-[92%]"
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

      {/* Connecting Overlay */}
      <AnimatePresence>
        {loadingState === 'connecting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#070B16]/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-violet-600 flex items-center justify-center animate-pulse shadow-xl shadow-rose-950/40">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-200">Connecting securely…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. MINIMAL TOP HEADER (NO CENTER NAVIGATION LINKS) ── */}
      <header className="w-full max-w-7xl mx-auto px-1 sm:px-4 py-1 flex items-center justify-between relative z-20 flex-shrink-0">
        {/* Top-Left: HomeMind.AI Logo + Subtitle */}
        <div
          className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/30 border border-white/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div>
            <span
              className={`font-extrabold text-sm sm:text-base lg:text-lg tracking-tight block leading-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              HomeMind.AI
            </span>
            <span className="text-[8.5px] sm:text-[9.5px] text-rose-500 dark:text-rose-300/90 font-bold tracking-widest uppercase block leading-none">
              AI OS FOR SMARTER HOMES
            </span>
          </div>
        </div>

        {/* Top-Right: Theme Toggle & Language Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2 relative">
          {/* Animated Theme Toggle */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition-all shadow-sm ${
              isLight
                ? 'bg-white border-slate-200 text-amber-500 hover:border-slate-300'
                : 'bg-[#090F24]/85 border-white/10 text-indigo-300 hover:border-white/25 hover:text-white'
            }`}
            aria-label="Toggle visual theme"
            title={`Switch to ${isLight ? 'dark' : 'light'} theme`}
          >
            <motion.div
              key={theme}
              initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {isLight ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-300" />}
            </motion.div>
          </motion.button>

          {/* Interactive Indian Language Dropdown */}
          <div ref={langDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  : 'bg-[#090F24]/85 border-white/10 text-slate-200 hover:border-white/25'
              }`}
            >
              <span>🇮🇳</span>
              <span className="hidden sm:inline text-[11px] font-medium">{currentLangObj.name}</span>
              <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className={`absolute right-0 mt-1.5 w-44 rounded-2xl border backdrop-blur-xl shadow-2xl p-1.5 z-50 ${
                    isLight ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-[#0A1028]/95 border-white/15 text-white'
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Language
                  </div>
                  {INDIAN_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-left transition-colors ${
                        selectedLang === lang.code
                          ? isLight
                            ? 'bg-rose-50 text-rose-600 font-bold'
                            : 'bg-rose-500/20 text-rose-300 font-bold'
                          : isLight
                          ? 'hover:bg-slate-100 text-slate-700'
                          : 'hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      <span>{lang.native} ({lang.name})</span>
                      {selectedLang === lang.code && <Check className="w-3.5 h-3.5 text-rose-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── 2. SINGLE-SCREEN HERO + VISUAL NETWORK + AUTH MAIN CONTENT ── */}
      <main className="w-full max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-2.5 sm:gap-4 lg:gap-8 items-center relative z-10 flex-1 min-h-0 py-1 sm:py-2">
        {/* ── LEFT COLUMN: Emotional Storytelling + Animated Ecosystem + Modules ── */}
        <section className="w-full lg:col-span-7 xl:col-span-7 flex flex-col justify-center gap-1.5 sm:gap-2.5 lg:gap-3.5 text-center lg:text-left min-h-0">
          {/* Eyebrow Pill + Micro-line */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border text-[9.5px] sm:text-[10.5px] font-bold tracking-widest uppercase w-fit shadow-sm ${
                isLight
                  ? 'bg-rose-500/10 border-rose-500/25 text-rose-600'
                  : 'bg-rose-500/15 border-rose-400/30 text-rose-300'
              }`}
            >
              <Sparkles className="w-3 h-3 text-rose-500 dark:text-rose-400" />
              <span>AI-POWERED HOUSEHOLD COMPANION</span>
            </motion.div>

            <span className={`text-[10.5px] sm:text-[11px] font-semibold tracking-wide uppercase ${isLight ? 'text-amber-800' : 'text-amber-200/90'}`}>
              Your home. Your people. Your rhythm.
            </span>
          </div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-0.5 sm:space-y-1"
          >
            <h1
              className={`text-2xl sm:text-3xl lg:text-[42px] xl:text-5xl font-serif font-extrabold tracking-tight leading-[1.1] ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              <span>Made for</span>{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400">
                homes that care.
              </span>
            </h1>
            <p
              className={`text-[11.5px] sm:text-xs lg:text-sm max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              HomeMind.AI helps families manage expenses, groceries, bills, tasks, and shared home life in one calm intelligent system.
            </p>
          </motion.div>

          {/* Primary CTA + Microcopy + Secondary Action (DESKTOP ONLY) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden lg:flex flex-wrap items-center gap-3 pt-0.5"
          >
            <motion.button
              type="button"
              onClick={scrollToLoginCard}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-violet-600 hover:from-rose-400 hover:via-pink-400 hover:to-violet-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-rose-950/30 border border-white/25 transition-all group"
            >
              {/* Moving light shimmer beam */}
              <motion.div
                animate={{ x: ['-150%', '200%'] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-12 pointer-events-none"
              />
              <span>Get Started with HomeMind.AI</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <div className="flex items-center gap-2 text-xs">
              <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-300/90'}`}>
                One AI for your entire home.
              </span>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <button
                type="button"
                onClick={handleSeeHowItWorks}
                className="text-rose-500 dark:text-rose-300 hover:underline font-semibold transition-colors cursor-pointer"
              >
                See how it works
              </button>
            </div>
          </motion.div>

          {/* Central Smart-Home AI Visual Network (DESKTOP ONLY) */}
          <div className="hidden lg:block pt-0.5">
            <HomeMindEcosystem isHighlighted={ecosystemHighlighted} />
          </div>

          {/* Bottom Module Cards Row near bottom-left (DESKTOP ONLY) */}
          <div className="hidden lg:block pt-0.5">
            <FloatingFeatureCards />
          </div>
        </section>

        {/* ── RIGHT COLUMN: Premium Glass Login Card ── */}
        <section ref={loginSectionRef} className="w-full lg:col-span-5 xl:col-span-5 flex flex-col items-center justify-center">
          <LoginCard
            onGoogleClick={triggerGoogleSignIn}
            googleButtonRef={googleButtonRef}
            isGisReady={isGisReady}
            isNative={Capacitor.isNativePlatform()}
            loading={loadingGoogle}
            error={error}
            onClearError={() => setError('')}
            googleConfigured={!!GOOGLE_CLIENT_ID}
            termsAccepted={termsAccepted}
            onTermsChange={setTermsAccepted}
            onSuccess={async (isNew, userName) => {
              setPendingSuccessData({ isNew: !!isNew, userName: userName || '' });
              setShowSuccessOverlay(true);
            }}
          />
        </section>

        {/* ── MOBILE-ONLY FEATURE CARDS ROW (Rendered directly under LoginCard on mobile) ── */}
        <div className="w-full flex lg:hidden justify-center pt-0.5">
          <FloatingFeatureCards />
        </div>
      </main>

      {/* ── 3. COMPACT FOOTER (SINGLE-LINE NO-OVERFLOW) ── */}
      <footer
        className={`w-full max-w-7xl mx-auto px-2 sm:px-4 py-1 sm:py-1.5 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] relative z-20 border-t flex-shrink-0 transition-colors duration-700 ${
          isLight ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-white/[0.08]'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <span>© {new Date().getFullYear()} HomeMind.AI</span>
          <span>•</span>
          <Link to="/privacy" className="hover:text-blue-500 hover:underline transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-blue-500 hover:underline transition-colors">
            Terms of Service
          </Link>
        </div>
        <span className="flex items-center gap-1.5">
          <span>Thoughtfully crafted for modern Indian families</span>
          <span>🇮🇳</span>
        </span>
      </footer>

      {/* Full-screen Home Entry Animation upon sign-in */}
      {(showSuccessOverlay || previewTransition) && (
        <HomeEntryTransition
          userName={pendingSuccessData?.userName || 'Family'}
          onFinish={handleOverlayFinish}
        />
      )}
    </div>
  );
};

export default Login;
