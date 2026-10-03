import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Hourglass, ShieldCheck, Calendar, Clock } from 'lucide-react';
import { getGreetingName, getTimeGreeting } from './utils/dashboardUtils';
import { useI18n } from '../../utils/i18n';
import { getRoleConfig } from '../../features/household/utils/householdFormatters';

interface DashboardGreetingProps {
  user: any;
  household: any;
  countryName?: string;
  flag?: string;
  daysRemaining: number;
  monthName: string;
  pendingTasksCount?: number;
  upcomingBillsCount?: number;
  isReady?: boolean;
}

export const DashboardGreeting: React.FC<DashboardGreetingProps> = ({
  user,
  household,
  countryName,
  flag,
  daysRemaining,
  monthName,
  pendingTasksCount = 0,
  upcomingBillsCount = 0,
  isReady = true,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { t, language, formatDate } = useI18n();
  const greetingName = getGreetingName(user);
  const { period } = getTimeGreeting();

  // Dynamic live time
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const localizedGreeting =
    period === 'morning'
      ? t('dash.goodMorning', 'Good morning')
      : period === 'afternoon'
      ? t('dash.goodAfternoon', 'Good afternoon')
      : t('dash.goodEvening', 'Good evening');

  const role = user?.role || 'MEMBER';
  const roleConfig = getRoleConfig(role);
  const householdName = household?.name || 'Home Residence';

  // Visually strong, localized date (Part 24 & Part 30)
  const localizedDateStr = formatDate(new Date(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.section
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeOut' }}
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-2.5"
      aria-label="Household Command Header"
    >
      {/* Top Row: Contextual Greeting & Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Greeting & Strong Date + Household Identity */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {localizedGreeting}, {greetingName} 👋
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${roleConfig.badgeBg} ${roleConfig.textColor} ${roleConfig.borderColor}`}
            >
              {roleConfig.label}
            </span>
          </div>

          {/* Visually Stronger Bolder Date & Clock (Parts 7, 24, 25, 30) */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span className="font-semibold tracking-tight">{localizedDateStr}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400">
              <Clock className="w-3 h-3 text-blue-500 flex-shrink-0" />
              <span>{currentTimeStr || '--:--:--'}</span>
            </div>
          </div>

          {/* Subtitle / Location */}
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
              <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              <span>{householdName}</span>
            </span>
            {countryName && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {flag ? `${flag} ` : ''}
                  {countryName}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Right: Telemetry Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Days Remaining Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shadow-2xs">
            <Hourglass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {daysRemaining === 0
                ? `${t('dash.today', 'Today')} (${monthName})`
                : `${daysRemaining}${t('dash.daysLeft', 'd left')} (${monthName})`}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Strip: Status & Operational Summary */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isReady ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="font-semibold">{isReady ? 'All systems ready' : 'Syncing data...'}</span>
          </div>

          <span className="text-slate-200 dark:text-slate-700">•</span>

          <span className="flex items-center gap-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">{pendingTasksCount}</span>
            <span>{t('dash.tasksPending', 'tasks pending')}</span>
          </span>

          <span className="text-slate-200 dark:text-slate-700">•</span>

          <span className="flex items-center gap-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">{upcomingBillsCount}</span>
            <span>{t('dash.billsDueSoon', 'bills due soon')}</span>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>HomeMind.AI RBAC Privacy Engine</span>
        </div>
      </div>
    </motion.section>
  );
};
