import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface FinancialSummaryCardProps {
  title: string;
  period?: string;
  value: number;
  formattedValue: string;
  icon: React.ElementType;
  contextLine: string;
  accent: 'emerald' | 'rose' | 'teal' | 'violet' | 'amber' | 'blue';
  delay?: number;
  isFullWidthOnMobile?: boolean;
}

const accentMap = {
  emerald: {
    container: 'bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.03] to-white dark:from-emerald-500/[0.14] dark:via-emerald-950/20 dark:to-slate-900 border-emerald-500/30 dark:border-emerald-500/35 hover:border-emerald-500/50 shadow-emerald-500/5',
    text: 'text-emerald-700 dark:text-emerald-300',
    valText: 'text-emerald-700 dark:text-emerald-300',
    iconTile: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-600 group-hover:text-white',
    topBar: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400',
    chip: 'text-emerald-700 dark:text-emerald-300 font-semibold',
  },
  rose: {
    container: 'bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.03] to-white dark:from-rose-500/[0.14] dark:via-rose-950/20 dark:to-slate-900 border-rose-500/30 dark:border-rose-500/35 hover:border-rose-500/50 shadow-rose-500/5',
    text: 'text-rose-700 dark:text-rose-300',
    valText: 'text-rose-700 dark:text-rose-300',
    iconTile: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 group-hover:bg-rose-600 group-hover:text-white',
    topBar: 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400',
    chip: 'text-rose-700 dark:text-rose-300 font-semibold',
  },
  teal: {
    container: 'bg-gradient-to-br from-teal-500/[0.08] via-teal-500/[0.03] to-white dark:from-teal-500/[0.14] dark:via-teal-950/20 dark:to-slate-900 border-teal-500/30 dark:border-teal-500/35 hover:border-teal-500/50 shadow-teal-500/5',
    text: 'text-teal-700 dark:text-teal-300',
    valText: 'text-teal-700 dark:text-teal-300',
    iconTile: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 group-hover:bg-teal-600 group-hover:text-white',
    topBar: 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400',
    chip: 'text-teal-700 dark:text-teal-300 font-semibold',
  },
  violet: {
    container: 'bg-gradient-to-br from-violet-500/[0.08] via-violet-500/[0.03] to-white dark:from-violet-500/[0.14] dark:via-violet-950/20 dark:to-slate-900 border-violet-500/30 dark:border-violet-500/35 hover:border-violet-500/50 shadow-violet-500/5',
    text: 'text-violet-700 dark:text-violet-300',
    valText: 'text-violet-700 dark:text-violet-300',
    iconTile: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30 group-hover:bg-violet-600 group-hover:text-white',
    topBar: 'bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-400',
    chip: 'text-violet-700 dark:text-violet-300 font-semibold',
  },
  amber: {
    container: 'bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.03] to-white dark:from-amber-500/[0.14] dark:via-amber-950/20 dark:to-slate-900 border-amber-500/30 dark:border-amber-500/35 hover:border-amber-500/50 shadow-amber-500/5',
    text: 'text-amber-700 dark:text-amber-300',
    valText: 'text-amber-700 dark:text-amber-300',
    iconTile: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 group-hover:bg-amber-600 group-hover:text-white',
    topBar: 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-400',
    chip: 'text-amber-700 dark:text-amber-300 font-semibold',
  },
  blue: {
    container: 'bg-gradient-to-br from-blue-500/[0.08] via-blue-500/[0.03] to-white dark:from-blue-500/[0.14] dark:via-blue-950/20 dark:to-slate-900 border-blue-500/30 dark:border-blue-500/35 hover:border-blue-500/50 shadow-blue-500/5',
    text: 'text-blue-700 dark:text-blue-300',
    valText: 'text-blue-700 dark:text-blue-300',
    iconTile: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 group-hover:bg-blue-600 group-hover:text-white',
    topBar: 'bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-400',
    chip: 'text-blue-700 dark:text-blue-300 font-semibold',
  },
};

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  title,
  period,
  formattedValue,
  icon: Icon,
  contextLine,
  accent,
  delay = 0,
  isFullWidthOnMobile = false,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const styles = accentMap[accent] || accentMap.emerald;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
      }}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      className={`group relative rounded-2xl ${styles.container} border p-3.5 min-h-[122px] sm:h-[136px] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden ${
        isFullWidthOnMobile ? 'col-span-2 sm:col-span-1' : ''
      }`}
    >
      {/* Luminous top accent line */}
      <div className={`h-[3px] w-full ${styles.topBar} absolute top-0 left-0 right-0 opacity-90 group-hover:opacity-100 transition-opacity`} />

      {/* Category + Icon Tile */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="min-w-0">
          <span
            className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider block truncate ${styles.text}`}
          >
            {title}
          </span>
          {period && (
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-mono block truncate">
              {period}
            </span>
          )}
        </div>
        <div
          className={`w-8 h-8 rounded-xl ${styles.iconTile} flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-xs`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Main Monetary Value */}
      <div className="min-w-0">
        <p
          className={`text-lg sm:text-xl lg:text-[22px] xl:text-2xl font-black font-mono tracking-tight truncate leading-tight ${styles.valText}`}
          title={formattedValue}
        >
          {formattedValue}
        </p>
      </div>

      {/* Context line */}
      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center justify-between">
        <span>{contextLine}</span>
      </div>
    </motion.div>
  );
};
