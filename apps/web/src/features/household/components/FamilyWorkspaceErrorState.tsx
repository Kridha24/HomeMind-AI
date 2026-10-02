import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface FamilyWorkspaceErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export const FamilyWorkspaceErrorState: React.FC<FamilyWorkspaceErrorStateProps> = ({
  message = 'Failed to load household workspace data. Please check your connection and try again.',
  onRetry,
}) => {
  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">Couldn't load household</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
};
