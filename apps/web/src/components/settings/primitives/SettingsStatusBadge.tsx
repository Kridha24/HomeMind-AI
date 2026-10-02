import React from 'react';

export type SettingsBadgeVariant =
  | 'owner'
  | 'admin'
  | 'member'
  | 'guest'
  | 'active'
  | 'pending'
  | 'danger'
  | 'neutral';

interface SettingsStatusBadgeProps {
  label: string;
  variant?: SettingsBadgeVariant;
  icon?: React.ElementType;
  className?: string;
}

export const SettingsStatusBadge: React.FC<SettingsStatusBadgeProps> = ({
  label,
  variant = 'neutral',
  icon: Icon,
  className = '',
}) => {
  const variantStyles: Record<SettingsBadgeVariant, string> = {
    owner: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
    admin: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    member: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    guest: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
    active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${variantStyles[variant]} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      <span>{label}</span>
    </span>
  );
};

export default SettingsStatusBadge;
