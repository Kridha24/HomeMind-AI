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
  | 'cyan'
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

const accentTileMap: Record<SidebarAccent, { tile: string; activeTile: string; activeBg: string; activeText: string; indicator: string }> = {
  indigo: {
    tile: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 group-hover:bg-indigo-500/25',
    activeTile: 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/30 border-transparent',
    activeBg: 'bg-indigo-500/15 dark:bg-indigo-500/25 border-indigo-500/40 text-indigo-950 dark:text-indigo-100 shadow-2xs',
    activeText: 'text-indigo-950 dark:text-indigo-100',
    indicator: 'bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_8px_#6366f1]',
  },
  emerald: {
    tile: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-500/25',
    activeTile: 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30 border-transparent',
    activeBg: 'bg-emerald-500/15 dark:bg-emerald-500/25 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 shadow-2xs',
    activeText: 'text-emerald-950 dark:text-emerald-100',
    indicator: 'bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_#10b981]',
  },
  teal: {
    tile: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 group-hover:bg-teal-500/25',
    activeTile: 'bg-teal-600 text-white shadow-xs shadow-teal-500/30 border-transparent',
    activeBg: 'bg-teal-500/15 dark:bg-teal-500/25 border-teal-500/40 text-teal-950 dark:text-teal-100 shadow-2xs',
    activeText: 'text-teal-950 dark:text-teal-100',
    indicator: 'bg-teal-600 dark:bg-teal-400 shadow-[0_0_8px_#14b8a6]',
  },
  amber: {
    tile: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 group-hover:bg-amber-500/25',
    activeTile: 'bg-amber-500 text-white shadow-xs shadow-amber-500/30 border-transparent',
    activeBg: 'bg-amber-500/15 dark:bg-amber-500/25 border-amber-500/40 text-amber-950 dark:text-amber-100 shadow-2xs',
    activeText: 'text-amber-950 dark:text-amber-100',
    indicator: 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_#f59e0b]',
  },
  rose: {
    tile: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 group-hover:bg-rose-500/25',
    activeTile: 'bg-rose-600 text-white shadow-xs shadow-rose-500/30 border-transparent',
    activeBg: 'bg-rose-500/15 dark:bg-rose-500/25 border-rose-500/40 text-rose-950 dark:text-rose-100 shadow-2xs',
    activeText: 'text-rose-950 dark:text-rose-100',
    indicator: 'bg-rose-500 dark:bg-rose-400 shadow-[0_0_8px_#f43f5e]',
  },
  sky: {
    tile: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 group-hover:bg-sky-500/25',
    activeTile: 'bg-sky-600 text-white shadow-xs shadow-sky-500/30 border-transparent',
    activeBg: 'bg-sky-500/15 dark:bg-sky-500/25 border-sky-500/40 text-sky-950 dark:text-sky-100 shadow-2xs',
    activeText: 'text-sky-950 dark:text-sky-100',
    indicator: 'bg-sky-500 dark:bg-sky-400 shadow-[0_0_8px_#0ea5e9]',
  },
  purple: {
    tile: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 group-hover:bg-purple-500/25',
    activeTile: 'bg-purple-600 text-white shadow-xs shadow-purple-500/30 border-transparent',
    activeBg: 'bg-purple-500/15 dark:bg-purple-500/25 border-purple-500/40 text-purple-950 dark:text-purple-100 shadow-2xs',
    activeText: 'text-purple-950 dark:text-purple-100',
    indicator: 'bg-purple-600 dark:bg-purple-400 shadow-[0_0_8px_#a855f7]',
  },
  violet: {
    tile: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30 group-hover:bg-violet-500/25',
    activeTile: 'bg-violet-600 text-white shadow-xs shadow-violet-500/30 border-transparent',
    activeBg: 'bg-violet-500/15 dark:bg-violet-500/25 border-violet-500/40 text-violet-950 dark:text-violet-100 shadow-2xs',
    activeText: 'text-violet-950 dark:text-violet-100',
    indicator: 'bg-violet-600 dark:bg-violet-400 shadow-[0_0_8px_#8b5cf6]',
  },
  cyan: {
    tile: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 group-hover:bg-cyan-500/25',
    activeTile: 'bg-cyan-600 text-white shadow-xs shadow-cyan-500/30 border-transparent',
    activeBg: 'bg-cyan-500/15 dark:bg-cyan-500/25 border-cyan-500/40 text-cyan-950 dark:text-cyan-100 shadow-2xs',
    activeText: 'text-cyan-950 dark:text-cyan-100',
    indicator: 'bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_#06b6d4]',
  },
  neutral: {
    tile: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30 group-hover:bg-slate-500/25',
    activeTile: 'bg-slate-700 dark:bg-slate-600 text-white shadow-xs border-transparent',
    activeBg: 'bg-slate-500/15 dark:bg-slate-500/25 border-slate-500/40 text-slate-950 dark:text-slate-100 shadow-2xs',
    activeText: 'text-slate-950 dark:text-slate-100',
    indicator: 'bg-slate-600 dark:bg-slate-400 shadow-[0_0_8px_#64748b]',
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
        className={`relative flex items-center w-full rounded-xl transition-all duration-180 ease-out border ${
          isCollapsed ? 'justify-center p-1.5' : 'gap-2.5 px-2.5 py-1.5'
        } ${
          active
            ? `${theme.activeBg} font-bold shadow-xs`
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
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105 flex-shrink-0 ${
            active ? theme.activeTile : theme.tile
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
