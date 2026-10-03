import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AnalyticsErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export const AnalyticsErrorState: React.FC<AnalyticsErrorStateProps> = ({
  onRetry,
  message = "Couldn't load household analytics.",
}) => {
  return (
    <div className="glass-panel p-12 border-rose-500/30 text-center space-y-4 my-8">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-base font-extrabold text-primary">{message}</h3>
        <p className="text-xs text-muted max-w-md mx-auto mt-1">
          An error occurred while aggregating real household intelligence metrics. Please verify network connectivity and try again.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-secondary hover:bg-primary/90 text-xs font-bold transition-all shadow-sm active:scale-95"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
};
