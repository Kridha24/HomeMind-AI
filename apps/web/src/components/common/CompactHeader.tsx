import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ModuleAccent =
  | 'dashboard'
  | 'expenses'
  | 'income'
  | 'bills'
  | 'groceries'
  | 'tasks'
  | 'family'
  | 'analytics'
  | 'settings'
  | 'vision'
  | 'sustainability'
  | 'neutral';

interface CompactHeaderProps {
  icon: LucideIcon;
  accent?: ModuleAccent;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const accentTileStyles: Record<ModuleAccent, { bg: string; text: string; ring: string }> = {
  dashboard: {
    bg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
    text: 'text-white',
    ring: 'border-transparent shadow-xs shadow-indigo-500/25',
  },
  expenses: {
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    text: 'text-white',
    ring: 'border-transparent shadow-xs shadow-emerald-500/25',
  },
  income: {
    bg: 'bg-gradient-to-br from-teal-500 to-emerald-600',
    text: 'text-white',
    ring: 'border-transparent shadow-xs shadow-teal-500/25',
  },
  bills: {
    bg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    text: 'text-white',
    ring: 'border-transparent shadow-xs shadow-amber-500/25',
  },
  groceries: {
    bg: 'bg-gradient-to-br from-rose-500 to-pink-600',
    text: 'text-white',
    ring: 'border-transparent shadow-xs shadow-rose-500/25',
  },
  tasks: {
    bg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    text: 'text-white',
    ring: 'border-transparent shadow-xs shadow-violet-500/25',
  },
  family: {
    bg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    text: 'text-white',
    ring: 'border-transparent shadow-xs shadow-purple-500/25',
  },
  analytics: {
    bg: 'bg-gradient-to-br from-violet-600 to-cyan-600',
    text: 'text-white',
    ring: 'border-transparent shadow-xs shadow-violet-500/25',
  },
  settings: {
    bg: 'bg-gradient-to-br from-slate-600 to-slate-800',
    text: 'text-white',
    ring: 'border-transparent shadow-xs shadow-slate-500/25',
  },
  vision: {
    bg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    text: 'text-white',
    ring: 'border-transparent shadow-xs shadow-cyan-500/25',
  },
  sustainability: {
    bg: 'bg-gradient-to-br from-emerald-600 to-teal-500',
    text: 'text-white',
    ring: 'border-transparent shadow-xs shadow-emerald-500/25',
  },
  neutral: {
    bg: 'bg-gradient-to-br from-slate-500 to-slate-700',
    text: 'text-white',
    ring: 'border-transparent shadow-xs shadow-slate-500/25',
  },
};

export const CompactHeader: React.FC<CompactHeaderProps> = ({
  icon: Icon,
  accent = 'neutral',
  title,
  description,
  badge,
  actions,
  children,
  className = '',
}) => {
  const styles = accentTileStyles[accent] || accentTileStyles.neutral;

  return (
    <div
      className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-800 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs flex-shrink-0 transition-transform ${styles.bg} ${styles.text} ${styles.ring}`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xl font-medium">
              {description}
            </p>
          )}
        </div>
      </div>

      {(actions || children) && (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
};

export default CompactHeader;
