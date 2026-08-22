import React from 'react';
import { AlertCircle, PhoneCall } from 'lucide-react';
import { GoogleLoginButton } from './GoogleLoginButton';
import { SecurityBadge } from './SecurityBadge';

interface LoginCardProps {
  onGoogleClick: () => void;
  loading: boolean;
  error: string;
  onPhoneClick: () => void;
  /** If false, Google sign-in is not configured — show informational message */
  googleConfigured?: boolean;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onGoogleClick,
  loading,
  error,
  onPhoneClick,
  googleConfigured = true,
}) => {
  return (
    <div className="w-full max-w-[430px] bg-panel/85 backdrop-blur-xl p-7 sm:p-9 space-y-6 border border-primary/20 rounded-3xl shadow-2xl relative z-10">
      {/* Card Header */}
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
          Namaste 👋
        </h2>
        <p className="text-sm text-muted">
          Sign in to your household
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-red-200 mb-0.5">Sign-in failed</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Auth Options */}
      <div className="space-y-3 pt-1">
        {googleConfigured ? (
          <GoogleLoginButton onClick={onGoogleClick} loading={loading} />
        ) : (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              Google sign-in is not configured. Use your mobile number below.
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-primary/40" />
          <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">or</span>
          <div className="flex-1 h-px bg-primary/40" />
        </div>

        <button
          type="button"
          onClick={onPhoneClick}
          disabled={loading}
          className="w-full min-h-[44px] bg-panel hover:bg-secondary border border-primary/40 text-primary font-semibold py-3.5 px-5 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Continue with phone</span>
        </button>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-2xl bg-background/60 border border-primary/20 text-center space-y-0.5">
          <span className="text-[10px] text-muted block font-medium">⚡ Quick Login</span>
          <span className="text-xs text-primary font-bold block">No Password Needed</span>
        </div>
        <div className="p-3 rounded-2xl bg-background/60 border border-primary/20 text-center space-y-0.5">
          <span className="text-[10px] text-muted block font-medium">🏠 Private</span>
          <span className="text-xs text-primary font-bold block">Your Data Only</span>
        </div>
      </div>

      <SecurityBadge />
    </div>
  );
};
