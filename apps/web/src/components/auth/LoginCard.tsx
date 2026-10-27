import React, { useState } from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GoogleLoginButton } from './GoogleLoginButton';
import { useSettingStore } from '../../stores/useSettingStore';

interface LoginCardProps {
  onGoogleClick: () => void;
  googleButtonRef?: React.RefObject<HTMLDivElement>;
  isGisReady?: boolean;
  isNative?: boolean;
  loading: boolean;
  error: string;
  onClearError?: () => void;
  onPhoneClick?: () => void;
  googleConfigured?: boolean;
  onSuccess?: (isNewRegistration?: boolean, userName?: string) => void;
  termsAccepted?: boolean;
  onTermsChange?: (accepted: boolean) => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onGoogleClick,
  googleButtonRef,
  isGisReady = true,
  isNative = false,
  loading: googleLoading,
  error: parentError,
  onClearError,
  googleConfigured = true,
  termsAccepted: propTermsAccepted,
  onTermsChange,
}) => {
  const [localError, setLocalError] = useState('');
  const [internalTerms, setInternalTerms] = useState<boolean>(() => {
    return propTermsAccepted ?? (typeof localStorage !== 'undefined' && localStorage.getItem('homemind_terms_accepted') === 'true');
  });
  const isTermsAccepted = propTermsAccepted !== undefined ? propTermsAccepted : internalTerms;
  const [termsError, setTermsError] = useState(false);

  const setTermsAccepted = (val: boolean) => {
    setInternalTerms(val);
    try {
      localStorage.setItem('homemind_terms_accepted', val ? 'true' : 'false');
    } catch {}
    if (onTermsChange) onTermsChange(val);
    if (val) {
      setTermsError(false);
      if (localError.includes('Terms')) setLocalError('');
      if (onClearError) onClearError();
    }
  };

  const triggerTermsNotice = () => {
    setTermsError(true);
    setLocalError('Please accept the Terms of Service & Privacy Policy to sign in.');
  };

  const { theme } = useSettingStore();
  const isLight = theme === 'light';
  const activeError = parentError || localError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-[420px] p-5 sm:p-7 space-y-4 rounded-2xl sm:rounded-3xl relative z-10 transition-colors select-none ${
        isLight
          ? 'bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 text-slate-800'
          : 'bg-[#0E131F] border border-slate-800 shadow-2xl text-white'
      }`}
    >
      {/* Heading & Subheading */}
      <div className="space-y-1 text-center relative z-10">
        <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Welcome to HomeMind 👋
        </h2>
        <p className={`text-xs sm:text-[13px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Sign in to manage your household
        </p>
      </div>

      {/* Error Alert Banner */}
      {activeError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/15 border border-red-500/35 rounded-2xl flex items-start gap-2 text-xs text-red-200"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-red-100 mb-0.5">Authentication note</span>
            <span className="leading-relaxed">{activeError}</span>
          </div>
        </motion.div>
      )}

      {/* MANDATORY TERMS & PRIVACY CONSENT CHECKBOX */}
      <motion.div
        animate={termsError ? { x: [-4, 4, -4, 4, 0] } : {}}
        transition={{ duration: 0.35 }}
        className={`p-2.5 sm:p-3 rounded-2xl border transition-all ${
          termsError
            ? 'bg-rose-500/15 border-rose-500/60 shadow-md shadow-rose-500/20 ring-2 ring-rose-500/30'
            : isTermsAccepted
            ? isLight
              ? 'bg-emerald-50/80 border-emerald-300 text-slate-800'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            : isLight
            ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
            : 'bg-[#0F1735]/80 border-white/10 hover:border-white/20'
        }`}
      >
        <label className="flex items-start gap-2.5 cursor-pointer text-[11px] sm:text-xs select-none">
          <input
            type="checkbox"
            id="mandatory-terms-checkbox"
            checked={isTermsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer accent-rose-500 flex-shrink-0"
          />
          <span className={`leading-snug ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            I accept the{' '}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="underline font-bold text-rose-500 hover:text-rose-400 transition-colors"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="underline font-bold text-rose-500 hover:text-rose-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-rose-500 font-extrabold ml-1" title="Required to sign in">*</span>
          </span>
        </label>
        {termsError && (
          <p className="mt-1 text-[10.5px] font-semibold text-rose-500 pl-6 animate-in fade-in">
            Required: Please check this box to agree before continuing.
          </p>
        )}
      </motion.div>

      {/* PRIMARY AUTH ACTION: Google GIS Button */}
      <div className="space-y-3 pt-1 relative z-10">
        {googleConfigured ? (
          <div className="w-full relative">
            <GoogleLoginButton
              buttonRef={googleButtonRef}
              isReady={isGisReady}
              loading={googleLoading}
              isNative={isNative}
              onClick={() => {
                if (!isTermsAccepted) {
                  triggerTermsNotice();
                  return;
                }
                onGoogleClick();
              }}
            />
            {/* Transparent click barrier when terms not accepted to intercept GIS iframe */}
            {!isTermsAccepted && !isNative && (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  triggerTermsNotice();
                }}
                className="absolute inset-0 z-20 cursor-pointer rounded-full"
                title="Please accept the Terms of Service & Privacy Policy to sign in"
              />
            )}
          </div>
        ) : (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Google sign-in is loading. Please wait a moment.</span>
          </div>
        )}
      </div>

      {/* Trust & Security footnote */}
      <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>End-to-end encrypted 256-bit secure sign in</span>
      </div>
    </motion.div>
  );
};
