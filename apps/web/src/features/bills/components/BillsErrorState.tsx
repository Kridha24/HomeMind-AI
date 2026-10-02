import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface BillsErrorStateProps {
  onRetry: () => void;
  errorMessage?: string;
}

export const BillsErrorState: React.FC<BillsErrorStateProps> = ({
  onRetry,
  errorMessage = "Couldn't load bills from the server.",
}) => {
  return (
    <div className="glass-panel p-8 sm:p-12 text-center rounded-3xl border-rose-500/30 bg-rose-500/5 space-y-4 max-w-md mx-auto my-8">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-primary">
          Couldn't load bills
        </h3>
        <p className="text-xs text-secondary leading-relaxed">
          {errorMessage} Check your network connection or try reloading.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-panel border border-primary/80 text-xs font-bold text-primary hover:bg-secondary/60 transition-colors shadow-2xs"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
};
