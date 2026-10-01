import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface DashboardErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({
  onRetry,
  message = "We couldn't refresh your dashboard data.",
}) => {
  return (
    <div
      className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/50 p-6 sm:p-8 text-center space-y-4 shadow-sm"
      role="alert"
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
          Dashboard Refresh Issue
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {message} Your navigation and sidebar remain operational while we attempt recovery.
        </p>
      </div>

      <div>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
};
