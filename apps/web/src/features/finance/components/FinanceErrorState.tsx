import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface FinanceErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export const FinanceErrorState: React.FC<FinanceErrorStateProps> = ({
  onRetry,
  message = "Couldn't load transactions from the server.",
}) => {
  return (
    <div className="glass-panel p-8 rounded-3xl border-rose-500/30 bg-rose-500/5 text-center space-y-3 max-w-md mx-auto my-6">
      <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide">
          Sync Error
        </h3>
        <p className="text-xs text-secondary mt-1">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-surface-elevated border border-primary/30 text-primary hover:border-blue-500/50 shadow-xs transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
};
