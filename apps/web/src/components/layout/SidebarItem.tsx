import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

export interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
  accent?: 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'neutral';
  badge?: string;
  isCollapsed?: boolean;
  onHover?: (e: React.MouseEvent<HTMLElement>) => void;
  onLeave?: () => void;
  onClick?: () => void;
}

const accentHoverMap: Record<string, string> = {
  blue: 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10',
  emerald: 'hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10',
  amber: 'hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10',
  purple: 'hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/10',
  cyan: 'hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10',
  neutral: 'hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800',
};

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  href,
  active = false,
  accent = 'blue',
  badge,
  isCollapsed = true,
  onHover,
  onLeave,
  onClick,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const hoverClass = accentHoverMap[accent] || accentHoverMap.neutral;

  return (
    <NavLink
      to={href}
      aria-label={label}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="group relative flex items-center w-full px-2 py-1 outline-none"
    >
      <div
        className={`relative flex items-center w-full rounded-xl transition-all duration-180 ease-out ${
          isCollapsed ? 'justify-center p-1.5' : 'gap-3 px-3 py-2'
        } ${
          active
            ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/25 shadow-2xs'
            : `text-slate-500 dark:text-slate-400 font-medium ${hoverClass}`
        } ${shouldReduceMotion ? '' : 'group-hover:scale-[1.04] group-hover:translate-x-[2px]'}`}
      >
        {/* Active Pill Indicator (3px blue/violet vertical pill on the left) */}
        {active && (
          <motion.div
            layoutId={shouldReduceMotion ? undefined : 'sidebarActivePill'}
            className="absolute -left-2 w-[3px] h-6 rounded-r-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_#3b82f6]"
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 400, damping: 30 }
            }
          />
        )}

        {/* Icon */}
        <div
          className={`flex items-center justify-center rounded-lg transition-colors ${
            active
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
          }`}
        >
          <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        </div>

        {/* Expanded Label */}
        {!isCollapsed && (
          <span className="text-xs truncate flex-1 tracking-tight">{label}</span>
        )}

        {/* Badge when expanded */}
        {!isCollapsed && badge && (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-500/20 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
    </NavLink>
  );
};
