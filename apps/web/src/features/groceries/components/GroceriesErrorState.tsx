import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface GroceriesErrorStateProps {
  onRetry: () => void;
  error?: any;
}

export const GroceriesErrorState: React.FC<GroceriesErrorStateProps> = ({
  onRetry,
  error,
}) => {
  return (
    <div className="glass-panel p-10 text-center rounded-3xl border border-rose-500/30 space-y-4 animate-in fade-in duration-200">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
        <AlertCircle className="w-7 h-7" />
      </div>
      <div>
        <h3 className="text-base font-extrabold text-primary">
          Couldn't load groceries
        </h3>
        <p className="text-xs text-secondary max-w-sm mx-auto mt-1">
          {error?.message || 'We ran into a problem communicating with the household server. Please check your connection and retry.'}
        </p>
      </div>
      <div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/70 hover:bg-secondary text-primary text-xs font-bold transition-all active:scale-95 border border-primary/50"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
};
