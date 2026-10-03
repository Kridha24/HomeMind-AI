import React from 'react';
import { LucideIcon, Plus, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryText?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryText = 'Everything starts empty. Data will sync automatically across family devices.',
  className = '',
}) => {
  return (
    <div
      className={`bg-panel/70 dark:bg-slate-900/60 border border-primary/60 dark:border-white/10 rounded-2xl p-6 sm:p-8 text-center space-y-4 max-w-md mx-auto my-4 shadow-xs backdrop-blur-md animate-in fade-in zoom-in-98 duration-150 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto shadow-xs">
        <Icon className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-base text-primary tracking-tight">{title}</h3>
        <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">{description}</p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 mx-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{actionLabel}</span>
          </button>
        </div>
      )}

      {secondaryText && (
        <p className="text-[11px] text-muted flex items-center justify-center gap-1.5 pt-2 border-t border-primary/40">
          <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
          <span>{secondaryText}</span>
        </p>
      )}
    </div>
  );
};

export default EmptyState;
