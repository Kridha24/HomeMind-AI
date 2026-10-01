import React from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';

interface GoogleLoginButtonProps {
  onClick: () => void;
  loading: boolean;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onClick,
  loading,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full bg-white hover:bg-slate-100 active:scale-[0.985] text-slate-950 font-extrabold py-4 px-5 rounded-2xl text-sm flex items-center justify-between shadow-xl hover:shadow-2xl hover:shadow-white/10 transition-all border border-white/90 disabled:opacity-60 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      aria-label="Continue with Google"
    >
      <div className="flex items-center gap-3.5">
        {loading ? (
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600 flex-shrink-0" />
        ) : (
          <svg className="w-5 h-5 flex-shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span className="tracking-tight text-slate-900 font-bold">
          {loading ? 'Connecting to Google...' : 'Continue with Google'}
        </span>
      </div>

      <ArrowRight className="w-4 h-4 text-muted group-hover:text-slate-950 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
};
