import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

export type SidebarAccent =
  | 'indigo'
  | 'emerald'
  | 'teal'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'purple'
  | 'violet'
  | 'neutral';

export interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
  accent?: SidebarAccent;
  badge?: string;
  isCollapsed?: boolean;
  onHover?: (e: React.MouseEvent<HTMLElement>) => void;
  onLeave?: () => void;
  onClick?: () => void;
}

const accentTileMap: Record<SidebarAccent, { tile: string; activeBg: string; activeText: string; indicator: string }> = {
  indigo: {
    tile: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/20',
    activeBg: 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/20 text-indigo-900 dark:text-indigo-200',
    activeText: 'text-indigo-600 dark:text-indigo-400',
    indicator: 'bg-indigo-600 dark:bg-indigo-400',
  },
  emerald: {
    tile: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20',
    activeBg: 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20 text-emerald-900 dark:text-emerald-200',
    activeText: 'text-emerald-600 dark:text-emerald-400',
    indicator: 'bg-emerald-600 dark:bg-emerald-400',
  },
  teal: {
    tile: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:bg-teal-500/20',
    activeBg: 'bg-teal-500/10 dark:bg-teal-500/15 border-teal-500/20 text-teal-900 dark:text-teal-200',
    activeText: 'text-teal-600 dark:text-teal-400',
    indicator: 'bg-teal-600 dark:bg-teal-400',
  },
  amber: {
    tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20',
    activeBg: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20 text-amber-900 dark:text-amber-200',
    activeText: 'text-amber-600 dark:text-amber-400',
    indicator: 'bg-amber-600 dark:bg-amber-400',
  },
  rose: {
    tile: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500/20',
    activeBg: 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20 text-rose-900 dark:text-rose-200',
    activeText: 'text-rose-600 dark:text-rose-400',
    indicator: 'bg-rose-600 dark:bg-rose-400',
  },
  sky: {
    tile: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500/20',
    activeBg: 'bg-sky-500/10 dark:bg-sky-500/15 border-sky-500/20 text-sky-900 dark:text-sky-200',
    activeText: 'text-sky-600 dark:text-sky-400',
    indicator: 'bg-sky-600 dark:bg-sky-400',
  },
  purple: {
    tile: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20',
    activeBg: 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/20 text-purple-900 dark:text-purple-200',
    activeText: 'text-purple-600 dark:text-purple-400',
    indicator: 'bg-purple-600 dark:bg-purple-400',
  },
  violet: {
    tile: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500/20',
    activeBg: 'bg-violet-500/10 dark:bg-violet-500/15 border-violet-500/20 text-violet-900 dark:text-violet-200',
    activeText: 'text-violet-600 dark:text-violet-400',
    indicator: 'bg-violet-600 dark:bg-violet-400',
  },
  neutral: {
    tile: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 group-hover:bg-slate-500/20',
    activeBg: 'bg-slate-500/10 dark:bg-slate-500/15 border-slate-500/20 text-slate-900 dark:text-slate-200',
    activeText: 'text-slate-700 dark:text-slate-300',
    indicator: 'bg-slate-600 dark:bg-slate-400',
  },
};

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  href,
  active = false,
  accent = 'indigo',
  badge,
  isCollapsed = false,
  onHover,
  onLeave,
  onClick,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const theme = accentTileMap[accent] || accentTileMap.indigo;

  return (
    <NavLink
      to={href}
      aria-label={label}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="group relative flex items-center w-full px-1.5 py-0.5 outline-none select-none"
    >
      <div
        className={`relative flex items-center w-full rounded-xl transition-all duration-150 ease-out border ${
          isCollapsed ? 'justify-center p-1.5' : 'gap-2.5 px-2.5 py-1.5'
        } ${
          active
            ? `${theme.activeBg} font-semibold shadow-xs`
            : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium'
        }`}
      >
        {/* Subtle left indicator */}
        {active && (
          <motion.div
            layoutId={shouldReduceMotion ? undefined : 'sidebarActiveIndicator'}
            className={`absolute left-0 w-1 h-4 rounded-r-full ${theme.indicator}`}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 500, damping: 35 }
            }
          />
        )}

        {/* Colorful Icon Container */}
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 flex-shrink-0 ${
            active ? theme.tile : `${theme.tile} opacity-85 group-hover:opacity-100`
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>

        {/* Expanded Label */}
        {!isCollapsed && (
          <span
            className={`text-xs truncate flex-1 tracking-tight ${
              active
                ? 'font-bold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
            }`}
          >
            {label}
          </span>
        )}

        {/* Badge when expanded */}
        {!isCollapsed && badge && (
          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
    </NavLink>
  );
};

export default SidebarItem;
