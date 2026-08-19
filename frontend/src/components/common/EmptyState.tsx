import React from 'react';
import { LucideIcon, Plus, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryText = 'Everything starts empty. Data will sync automatically across family devices.',
}) => {
  return (
    <div className="bg-panel/60 border border-primary/80 rounded-3xl p-10 text-center space-y-5 max-w-lg mx-auto my-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-xl"></div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-primary flex items-center justify-center text-blue-400 shadow-inner relative z-10">
          <Icon className="w-8 h-8 text-blue-400" />
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="font-bold text-lg text-primary tracking-tight">{title}</h3>
        <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto">{description}</p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-105 active:scale-95 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{actionLabel}</span>
          </button>
        </div>
      )}

      {secondaryText && (
        <p className="text-[11px] text-muted flex items-center justify-center gap-1 pt-2 border-t border-primary/50">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>{secondaryText}</span>
        </p>
      )}
    </div>
  );
};
