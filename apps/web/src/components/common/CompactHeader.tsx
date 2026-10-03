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
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    text: 'text-indigo-600 dark:text-indigo-400',
    ring: 'border-indigo-500/20 dark:border-indigo-500/30',
  },
  expenses: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'border-emerald-500/20 dark:border-emerald-500/30',
  },
  income: {
    bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    text: 'text-teal-600 dark:text-teal-400',
    ring: 'border-teal-500/20 dark:border-teal-500/30',
  },
  bills: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'border-amber-500/20 dark:border-amber-500/30',
  },
  groceries: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400',
    ring: 'border-rose-500/20 dark:border-rose-500/30',
  },
  tasks: {
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    text: 'text-sky-600 dark:text-sky-400',
    ring: 'border-sky-500/20 dark:border-sky-500/30',
  },
  family: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    ring: 'border-purple-500/20 dark:border-purple-500/30',
  },
  analytics: {
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    text: 'text-violet-600 dark:text-violet-400',
    ring: 'border-violet-500/20 dark:border-violet-500/30',
  },
  settings: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    text: 'text-slate-600 dark:text-slate-400',
    ring: 'border-slate-500/20 dark:border-slate-500/30',
  },
  neutral: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    text: 'text-slate-600 dark:text-slate-400',
    ring: 'border-slate-500/20 dark:border-slate-500/30',
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
  const styles = accentTileStyles[accent];

  return (
    <div
      className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-2 border-b border-primary/40 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs flex-shrink-0 transition-transform ${styles.bg} ${styles.text} ${styles.ring}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary truncate">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-muted truncate max-w-xl">
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
