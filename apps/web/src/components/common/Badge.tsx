import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'indigo'
  | 'emerald'
  | 'teal'
  | 'amber'
  | 'rose'
  | 'violet';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  teal: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
  neutral: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  warning: 'bg-amber-500',
  amber: 'bg-amber-500',
  danger: 'bg-rose-500',
  rose: 'bg-rose-500',
  info: 'bg-sky-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  neutral: 'bg-slate-400',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  children,
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-lg border leading-tight ${variantStyles[variant]} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export default Badge;
