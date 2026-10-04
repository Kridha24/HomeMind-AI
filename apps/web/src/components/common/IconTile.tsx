import React from 'react';
import { LucideIcon } from 'lucide-react';

export type SemanticColor =
  | 'indigo'
  | 'blue'
  | 'emerald'
  | 'teal'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'red'
  | 'sky'
  | 'purple'
  | 'violet'
  | 'cyan'
  | 'slate'
  | 'neutral';

export type TileSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const semanticColorMap: Record<
  SemanticColor,
  {
    bg: string;
    text: string;
    border: string;
    hoverBg: string;
    gradient?: string;
    glow?: string;
  }
> = {
  indigo: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20 dark:border-indigo-500/30',
    hoverBg: 'hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30',
    glow: 'shadow-indigo-500/10',
  },
  blue: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20 dark:border-blue-500/30',
    hoverBg: 'hover:bg-blue-500/20 dark:hover:bg-blue-500/30',
    glow: 'shadow-blue-500/10',
  },
  emerald: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20 dark:border-emerald-500/30',
    hoverBg: 'hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30',
    glow: 'shadow-emerald-500/10',
  },
  teal: {
    bg: 'bg-teal-500/10 dark:bg-teal-500/20',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/20 dark:border-teal-500/30',
    hoverBg: 'hover:bg-teal-500/20 dark:hover:bg-teal-500/30',
    glow: 'shadow-teal-500/10',
  },
  amber: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20 dark:border-amber-500/30',
    hoverBg: 'hover:bg-amber-500/20 dark:hover:bg-amber-500/30',
    glow: 'shadow-amber-500/10',
  },
  orange: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/20 dark:border-orange-500/30',
    hoverBg: 'hover:bg-orange-500/20 dark:hover:bg-orange-500/30',
    glow: 'shadow-orange-500/10',
  },
  rose: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20 dark:border-rose-500/30',
    hoverBg: 'hover:bg-rose-500/20 dark:hover:bg-rose-500/30',
    glow: 'shadow-rose-500/10',
  },
  red: {
    bg: 'bg-red-500/10 dark:bg-red-500/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/20 dark:border-red-500/30',
    hoverBg: 'hover:bg-red-500/20 dark:hover:bg-red-500/30',
    glow: 'shadow-red-500/10',
  },
  sky: {
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-500/20 dark:border-sky-500/30',
    hoverBg: 'hover:bg-sky-500/20 dark:hover:bg-sky-500/30',
    glow: 'shadow-sky-500/10',
  },
  purple: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20 dark:border-purple-500/30',
    hoverBg: 'hover:bg-purple-500/20 dark:hover:bg-purple-500/30',
    glow: 'shadow-purple-500/10',
  },
  violet: {
    bg: 'bg-violet-500/10 dark:bg-violet-500/20',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-500/20 dark:border-violet-500/30',
    hoverBg: 'hover:bg-violet-500/20 dark:hover:bg-violet-500/30',
    glow: 'shadow-violet-500/10',
  },
  cyan: {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/20 dark:border-cyan-500/30',
    hoverBg: 'hover:bg-cyan-500/20 dark:hover:bg-cyan-500/30',
    glow: 'shadow-cyan-500/10',
  },
  slate: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/20 dark:border-slate-500/30',
    hoverBg: 'hover:bg-slate-500/20 dark:hover:bg-slate-500/30',
    glow: 'shadow-slate-500/10',
  },
  neutral: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/20 dark:border-slate-500/30',
    hoverBg: 'hover:bg-slate-500/20 dark:hover:bg-slate-500/30',
    glow: 'shadow-slate-500/10',
  },
};

const sizeStyles: Record<TileSize, { container: string; icon: string }> = {
  xs: { container: 'w-6 h-6 rounded-md', icon: 'w-3 h-3' },
  sm: { container: 'w-7 h-7 rounded-lg', icon: 'w-3.5 h-3.5' },
  md: { container: 'w-8 h-8 rounded-xl', icon: 'w-4 h-4' },
  lg: { container: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' },
  xl: { container: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6' },
};

export interface IconTileProps {
  icon: LucideIcon | React.ElementType;
  color?: SemanticColor;
  size?: TileSize;
  className?: string;
  glow?: boolean;
}

export const IconTile: React.FC<IconTileProps> = ({
  icon: Icon,
  color = 'indigo',
  size = 'md',
  className = '',
  glow = false,
}) => {
  const theme = semanticColorMap[color] || semanticColorMap.indigo;
  const dimension = sizeStyles[size] || sizeStyles.md;

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 border transition-all duration-180 ease-out group-hover:scale-105 ${
        dimension.container
      } ${theme.bg} ${theme.text} ${theme.border} ${
        glow ? `shadow-sm ${theme.glow}` : ''
      } ${className}`}
    >
      <Icon className={`${dimension.icon} transition-transform duration-180`} />
    </div>
  );
};

export interface StatusBadgeProps {
  status:
    | 'online'
    | 'away'
    | 'offline'
    | 'owner'
    | 'member'
    | 'admin'
    | 'e2ee'
    | 'paid'
    | 'overdue'
    | 'upcoming'
    | 'pending'
    | 'high'
    | 'medium'
    | 'low'
    | 'active'
    | 'inactive';
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  className = '',
}) => {
  const statusConfig: Record<
    StatusBadgeProps['status'],
    { color: SemanticColor; text: string; dot?: string }
  > = {
    online: { color: 'emerald', text: 'Online', dot: 'bg-emerald-500' },
    away: { color: 'amber', text: 'Away', dot: 'bg-amber-500' },
    offline: { color: 'slate', text: 'Offline', dot: 'bg-slate-400' },
    owner: { color: 'violet', text: 'Owner' },
    member: { color: 'blue', text: 'Member' },
    admin: { color: 'purple', text: 'Admin' },
    e2ee: { color: 'emerald', text: 'E2EE' },
    paid: { color: 'emerald', text: 'Paid' },
    overdue: { color: 'rose', text: 'Overdue' },
    upcoming: { color: 'amber', text: 'Upcoming' },
    pending: { color: 'sky', text: 'Pending' },
    high: { color: 'rose', text: 'High' },
    medium: { color: 'amber', text: 'Medium' },
    low: { color: 'emerald', text: 'Low' },
    active: { color: 'emerald', text: 'Active' },
    inactive: { color: 'slate', text: 'Inactive' },
  };

  const config = statusConfig[status] || statusConfig.active;
  const theme = semanticColorMap[config.color];
  const sizeClass =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[9px] gap-1'
      : size === 'md'
      ? 'px-2.5 py-1 text-xs gap-1.5'
      : 'px-2 py-0.5 text-[10px] gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight rounded-md border uppercase ${
        theme.bg
      } ${theme.text} ${theme.border} ${sizeClass} ${className}`}
    >
      {config.dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dot} shadow-[0_0_4px_currentColor]`}
        />
      )}
      <span>{label || config.text}</span>
    </span>
  );
};

export interface ActiveTabProps {
  label: string;
  icon?: LucideIcon | React.ElementType;
  active: boolean;
  onClick: () => void;
  color?: SemanticColor;
  count?: number | string;
  className?: string;
}

export const ActiveTab: React.FC<ActiveTabProps> = ({
  label,
  icon: Icon,
  active,
  onClick,
  color = 'indigo',
  count,
  className = '',
}) => {
  const theme = semanticColorMap[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-180 ease-out border ${
        active
          ? `${theme.bg} ${theme.text} ${theme.border} shadow-xs -translate-y-px`
          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
            active
              ? `${theme.text} bg-white/60 dark:bg-slate-900/60`
              : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export default IconTile;
