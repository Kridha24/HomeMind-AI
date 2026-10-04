import React from 'react';
import { AlertCircle, PhoneCall, Lock, Zap } from 'lucide-react';
import { GoogleLoginButton } from './GoogleLoginButton';
import { SecurityBadge } from './SecurityBadge';

interface LoginCardProps {
  onGoogleClick: () => void;
  googleButtonRef?: React.RefObject<HTMLDivElement>;
  isGisReady?: boolean;
  isNative?: boolean;
  loading: boolean;
  error: string;
  onPhoneClick: () => void;
  googleConfigured?: boolean;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onGoogleClick,
  googleButtonRef,
  isGisReady = true,
  isNative = false,
  loading,
  error,
  onPhoneClick,
  googleConfigured = true,
}) => {
  return (
    <div className="w-full max-w-[440px] bg-[#0A1128]/85 dark:bg-[#0A1128]/90 backdrop-blur-2xl p-7 sm:p-9 space-y-6 border border-indigo-500/30 dark:border-indigo-400/25 rounded-[30px] shadow-2xl shadow-indigo-950/60 relative z-10 transition-all">
      {/* Card Header */}
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome Back 👋
        </h2>
        <p className="text-sm text-slate-400 font-medium">
          Sign in to continue
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-red-500/10 dark:bg-red-950/40 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-600 dark:text-red-300 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-red-700 dark:text-red-200 mb-0.5">Sign-in failed</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Auth Options */}
      <div className="space-y-3 pt-1">
        {googleConfigured ? (
          <GoogleLoginButton
            buttonRef={googleButtonRef}
            isReady={isGisReady}
            loading={loading}
            isNative={isNative}
            onClick={onGoogleClick}
          />
        ) : (
          <div className="p-3.5 bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 rounded-2xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              Google sign-in is not configured. Use your mobile number below.
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          type="button"
          onClick={onPhoneClick}
          disabled={loading}
          className="w-full min-h-[48px] bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-emerald-500/30 text-slate-100 font-semibold py-3.5 px-5 rounded-2xl text-sm flex items-center justify-center gap-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-[0.98] disabled:opacity-60 group shadow-md"
        >
          <PhoneCall className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Continue with Mobile Number</span>
        </button>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-amber-500/20 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-400 font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Access</span>
          </div>
          <span className="text-xs text-slate-200 font-bold block">No Password Needed</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-indigo-500/25 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-indigo-400 font-semibold">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>100% Private</span>
          </div>
          <span className="text-xs text-slate-200 font-bold block">Your Data. Your Home.</span>
        </div>
      </div>

      <SecurityBadge />
    </div>
  );
};
