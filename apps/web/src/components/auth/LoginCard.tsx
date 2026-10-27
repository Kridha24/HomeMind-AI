import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Shield, Lock, Users, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GoogleLoginButton } from './GoogleLoginButton';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
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
  onSuccess,
  termsAccepted: propTermsAccepted,
  onTermsChange,
}) => {
  // Direct in-card phone authentication state
  const [phoneStep, setPhoneStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [userName, setUserName] = useState('');
  const [localError, setLocalError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Mandatory Terms & Conditions acceptance
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

  const { setAuth } = useAuthStore();
  const { theme, fetchSettings } = useSettingStore();
  const isLight = theme === 'light';

  const activeError = parentError || localError;

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (phoneStep === 'OTP') {
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }
  }, [phoneStep]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(val);
    if (localError) setLocalError('');
    if (onClearError) onClearError();
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onClearError) onClearError();
    if (!isTermsAccepted) {
      triggerTermsNotice();
      return;
    }
    if (phoneNumber.length !== 10) {
      setLocalError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLocalLoading(true);
    setLocalError('');
    setInfoMessage('');
    const fullE164 = `+91${phoneNumber}`;

    try {
      const res = await apiClient.post('/auth/phone/request-otp', { phoneNumber: fullE164 });
      setPhoneStep('OTP');
      setResendTimer(30);
      setOtp('');

      const returnedCode = res.data.devOtp || res.data.otp;
      if (returnedCode) {
        setDevOtp(String(returnedCode));
        setInfoMessage(`Code sent! (Dev Auto-fill: ${returnedCode})`);
      } else {
        setDevOtp(null);
        setInfoMessage(res.data.message || `Code sent to ${fullE164}`);
      }
    } catch (err: any) {
      console.warn('[Phone Auth] Send OTP failed:', err);
      setLocalError(err.response?.data?.error || 'Could not send verification code. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTermsAccepted) {
      triggerTermsNotice();
      return;
    }
    if (otp.length !== 6) {
      setLocalError('Please enter the 6-digit verification code.');
      return;
    }

    setLocalLoading(true);
    setLocalError('');
    const fullE164 = `+91${phoneNumber}`;

    try {
      const res = await apiClient.post('/auth/phone/verify-otp', {
        phoneNumber: fullE164,
        otp: otp.trim(),
        name: userName.trim() || undefined,
      });

      setAuth(res.data.user, res.data.household, res.data.accessToken, res.data.refreshToken);
      await fetchSettings();

      if (onSuccess) {
        onSuccess(res.data.isNewRegistration, res.data.user?.name);
      }
    } catch (err: any) {
      console.warn('[Phone Auth] Verify OTP failed:', err);
      setLocalError(err.response?.data?.error || 'Invalid verification code. Please check and try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleQuickFillDevOtp = () => {
    if (devOtp) {
      setOtp(devOtp);
      setLocalError('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`w-full max-w-[420px] p-4 sm:p-6 lg:p-7 space-y-3.5 sm:space-y-4 rounded-2xl sm:rounded-3xl relative z-10 transition-colors select-none ${
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

      {/* Info / OTP Helper Banner */}
      {infoMessage && phoneStep === 'OTP' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2.5 bg-indigo-500/15 border border-indigo-400/30 rounded-2xl flex items-center justify-between gap-2 text-xs text-indigo-200"
        >
          <span className="leading-snug">{infoMessage}</span>
          {devOtp && (
            <button
              type="button"
              onClick={handleQuickFillDevOtp}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/30 hover:bg-indigo-500/45 text-white font-bold text-[11px] border border-indigo-400/40 transition-colors flex-shrink-0"
            >
              Auto-fill
            </button>
          )}
        </motion.div>
      )}

      {/* MANDATORY TERMS & PRIVACY CONSENT CHECKBOX (Big App Standard - Enforced on all sign-in flows) */}
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

      {/* PRIMARY AUTH ACTION 1: Google GIS Button */}
      <div className="space-y-3 pt-0.5 relative z-10">
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
            <span>Google sign-in is not configured. Use your mobile number below.</span>
          </div>
        )}

        {/* OR Separator */}
        <div className="flex items-center gap-3 py-0.5">
          <div className={`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
          <span className={`text-[10px] uppercase tracking-wider font-bold ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>
            OR
          </span>
          <div className={`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
        </div>

        {/* PRIMARY AUTH ACTION 2: Phone Input Section */}
        <AnimatePresence mode="wait">
          {phoneStep === 'PHONE' ? (
            <motion.form
              key="step-phone"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              onSubmit={handleSendOTP}
              className="space-y-2.5"
            >
              <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Sign in with mobile number
              </label>

              {/* +91 & Mobile input */}
              <div
                className={`flex items-center rounded-2xl border transition-all p-1 shadow-inner ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20'
                    : 'bg-[#0F1735]/90 border-white/15 focus-within:border-rose-400/60 focus-within:ring-2 focus-within:ring-rose-500/20'
                }`}
              >
                <div
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold flex-shrink-0 ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-700'
                      : 'bg-white/[0.06] border-white/10 text-slate-200'
                  }`}
                >
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter 10-digit number"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  disabled={localLoading || googleLoading}
                  className={`w-full bg-transparent px-3 py-1.5 text-sm focus:outline-none font-medium tracking-wide ${
                    isLight ? 'text-slate-800 placeholder-slate-400' : 'text-white placeholder-slate-500'
                  }`}
                />
              </div>

              {/* Send OTP Coral / Pink / Violet Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                disabled={localLoading || phoneNumber.length !== 10 || googleLoading}
                className="w-full min-h-[42px] rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-violet-600 hover:from-rose-400 hover:via-pink-400 hover:to-violet-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/30 border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                {localLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form
              key="step-otp"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              onSubmit={handleVerifyOTP}
              className="space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                  Code sent to <strong className={isLight ? 'text-slate-900' : 'text-white'}>+91 {phoneNumber}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneStep('PHONE');
                    setLocalError('');
                  }}
                  className="text-rose-500 hover:text-rose-400 underline font-semibold transition-colors text-xs"
                >
                  Change
                </button>
              </div>

              {/* 6-digit OTP Input */}
              <div
                className={`rounded-2xl border transition-all p-1 shadow-inner ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20'
                    : 'bg-[#0F1735]/90 border-white/15 focus-within:border-rose-400/60 focus-within:ring-2 focus-within:ring-rose-500/20'
                }`}
              >
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={localLoading}
                  className={`w-full bg-transparent px-3 py-2 text-center text-lg sm:text-xl font-mono tracking-[0.35em] focus:outline-none font-bold ${
                    isLight ? 'text-slate-800 placeholder-slate-400' : 'text-white placeholder-slate-500'
                  }`}
                />
              </div>

              {/* Optional Name for First-time registration */}
              <input
                type="text"
                placeholder="Your Name (Optional)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={`w-full rounded-xl border px-3 py-1.5 text-xs focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400'
                    : 'bg-[#0F1735]/70 border-white/10 text-white placeholder-slate-500 focus:border-indigo-400/50'
                }`}
              />

              {/* Verify & Enter Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                disabled={localLoading || otp.length !== 6}
                className="w-full min-h-[42px] rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-violet-600 hover:from-rose-400 hover:via-pink-400 hover:to-violet-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/30 border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {localLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </motion.button>

              {/* Resend Action */}
              <div className="text-center pt-0.5">
                {resendTimer > 0 ? (
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Resend code in <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{resendTimer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOTP()}
                    disabled={localLoading}
                    className="text-[11px] text-rose-500 hover:text-rose-400 font-semibold underline"
                  >
                    Didn't receive code? Resend OTP
                  </button>
                )}
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
