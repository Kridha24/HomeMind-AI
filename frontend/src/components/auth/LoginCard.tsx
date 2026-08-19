import React from 'react';
import { AlertCircle } from 'lucide-react';
import { GoogleLoginButton } from './GoogleLoginButton';
import { SecurityBadge } from './SecurityBadge';

interface LoginCardProps {
  onGoogleClick: () => void;
  loading: boolean;
  error: string;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onGoogleClick,
  loading,
  error,
}) => {
  return (
    <div className="w-full max-w-[430px] bg-slate-900/85 backdrop-blur-3xl p-7 sm:p-9 space-y-6 border border-white/[0.12] rounded-3xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9)] border-t border-t-white/20 relative z-10">
      {/* Card Header */}
      <div className="space-y-1.5 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome to HomeMind 👋
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Your intelligent home starts here.
        </p>
      </div>

      {/* Human-Friendly Error Alert */}
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-red-200">Unable to sign you in</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Single Authentication CTA: Google Only */}
      <div className="space-y-4 pt-1">
        <GoogleLoginButton
          onClick={onGoogleClick}
          loading={loading}
        />

        {/* Feature Value Badges */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-center space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-medium">⚡ Instant Access</span>
            <span className="text-xs text-slate-200 font-bold block">No Password Needed</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-center space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-medium">🔒 Bank-Grade</span>
            <span className="text-xs text-slate-200 font-bold block">Private Household</span>
          </div>
        </div>
      </div>

      {/* Trust & Security Message */}
      <SecurityBadge />
    </div>
  );
};
