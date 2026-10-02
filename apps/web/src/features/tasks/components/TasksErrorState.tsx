import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface TasksErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export const TasksErrorState: React.FC<TasksErrorStateProps> = ({
  onRetry,
  message = "Couldn't load household tasks.",
}) => {
  return (
    <div className="p-8 sm:p-12 text-center rounded-3xl bg-panel border border-rose-500/30 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-extrabold text-base text-primary">{message}</h3>
        <p className="text-xs text-secondary max-w-sm mx-auto">
          We encountered an issue communicating with the database. Please try again.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-primary text-xs font-bold border border-primary/60 transition-colors"
      >
        <RotateCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
};
