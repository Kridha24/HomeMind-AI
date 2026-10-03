import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface FinancialSummaryCardProps {
  title: string;
  period?: string;
  value: number;
  formattedValue: string;
  icon: React.ElementType;
  contextLine: string;
  accent: 'emerald' | 'rose' | 'teal' | 'violet';
  delay?: number;
  isFullWidthOnMobile?: boolean;
}

const accentMap = {
  emerald: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    borderHover: 'hover:border-emerald-500/40',
    iconBgHover: 'group-hover:bg-emerald-500/20',
  },
  rose: {
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    borderHover: 'hover:border-rose-500/40',
    iconBgHover: 'group-hover:bg-rose-500/20',
  },
  teal: {
    text: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    borderHover: 'hover:border-teal-500/40',
    iconBgHover: 'group-hover:bg-teal-500/20',
  },
  violet: {
    text: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    borderHover: 'hover:border-violet-500/40',
    iconBgHover: 'group-hover:bg-violet-500/20',
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
  const styles = accentMap[accent];

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.28,
        delay: shouldReduceMotion ? 0 : delay / 1000,
        ease: 'easeOut',
      }}
      whileHover={shouldReduceMotion ? undefined : { y: -3 }}
      className={`group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 ${styles.borderHover} p-3 sm:p-3.5 min-h-[118px] sm:h-[132px] shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between ${
        isFullWidthOnMobile ? 'col-span-2 sm:col-span-1' : ''
      }`}
    >
      {/* Category + Icon */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span
            className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider block truncate ${styles.text}`}
          >
            {title}
          </span>
          {period && (
            <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono block truncate">
              {period}
            </span>
          )}
        </div>
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${styles.bg} ${styles.iconBgHover} flex items-center justify-center ${styles.text} flex-shrink-0 transition-colors duration-200`}
        >
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>

      {/* Main Monetary Value */}
      <div className="min-w-0">
        <p
          className={`text-base sm:text-xl lg:text-[22px] xl:text-2xl font-black font-mono tracking-tight truncate leading-tight ${styles.text}`}
          title={formattedValue}
        >
          {formattedValue}
        </p>
      </div>

      {/* Context line */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
        {contextLine}
      </div>
    </motion.div>
  );
};
