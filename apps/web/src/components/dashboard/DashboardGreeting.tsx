import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Hourglass, ShieldCheck, Calendar, Clock, Home as HomeIcon, CheckSquare, Receipt } from 'lucide-react';
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
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border border-indigo-200/70 dark:border-indigo-500/20 shadow-[0_18px_40px_-28px_rgba(79,70,229,0.55)] bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 dark:from-indigo-950/60 dark:via-slate-900 dark:to-emerald-950/40"
      aria-label="Household Command Header"
    >
      {/* Ambient decorative shapes */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-10 w-64 h-64 rounded-full bg-indigo-400/25 dark:bg-indigo-500/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-1/3 w-72 h-48 rounded-full bg-emerald-300/25 dark:bg-emerald-500/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute top-6 left-[45%] w-28 h-28 rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-2xl" />

      {/* Abstract home motif */}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 160"
        className="pointer-events-none absolute right-4 sm:right-10 bottom-0 h-[118%] w-auto text-indigo-500/[0.13] dark:text-indigo-300/[0.10] hidden sm:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M20 150 V78 L100 18 L180 78 V150" />
        <path d="M78 150 V104 H122 V150" />
        <rect x="134" y="92" width="26" height="22" rx="4" />
        <path d="M140 34 V16 H156 V46" />
      </svg>

      <div className="relative p-4 sm:p-5 space-y-3">
        {/* Top Row: Contextual Greeting & Telemetry */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Home tile */}
            <div className="hidden sm:flex w-12 h-12 rounded-2xl items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 text-white shadow-lg shadow-indigo-500/30">
              <HomeIcon className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-[1.65rem] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  {localizedGreeting}, {greetingName} 👋
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${roleConfig.badgeBg} ${roleConfig.textColor} ${roleConfig.borderColor}`}
                >
                  {roleConfig.label}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                {pendingTasksCount === 0 && upcomingBillsCount === 0
                  ? 'Your home is organized and ready.'
                  : 'Here’s what your home needs today.'}
              </p>

              {/* Date / time / place chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 dark:bg-white/5 border border-indigo-200/80 dark:border-indigo-500/25 text-[11px] sm:text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  {localizedDateStr}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 dark:bg-white/5 border border-sky-200/80 dark:border-sky-500/25 font-mono text-[11px] font-bold text-sky-700 dark:text-sky-300 shadow-2xs">
                  <Clock className="w-3 h-3 text-sky-500 flex-shrink-0" />
                  {currentTimeStr || '--:--:--'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 dark:bg-white/5 border border-emerald-200/80 dark:border-emerald-500/25 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                  <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  {householdName}
                  {countryName && (
                    <span className="text-emerald-600/70 dark:text-emerald-400/70 font-medium">
                      · {flag ? `${flag} ` : ''}{countryName}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Days remaining */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap md:self-start">
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/85 dark:bg-white/5 border border-amber-200/90 dark:border-amber-500/25 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/30">
                <Hourglass className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <span className="block text-sm font-black text-slate-900 dark:text-white">
                  {daysRemaining === 0 ? t('dash.today', 'Today') : `${daysRemaining} days`}
                </span>
                <span className="block text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  left in {monthName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Home status strip */}
        <div className="flex items-center justify-between gap-2 flex-wrap rounded-2xl px-3 py-2 bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <span className={`relative w-2 h-2 rounded-full ${isReady ? 'bg-emerald-500 text-emerald-500 hm-ping' : 'bg-amber-500 text-amber-500'}`} />
              {isReady ? 'Home running smoothly' : 'Syncing your home…'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 text-[11px] font-semibold">
              <CheckSquare className="w-3 h-3" />
              <b className="font-black">{pendingTasksCount}</b> {t('dash.tasksPending', 'tasks pending')}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-[11px] font-semibold">
              <Receipt className="w-3 h-3" />
              <b className="font-black">{upcomingBillsCount}</b> {t('dash.billsDueSoon', 'bills due soon')}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-emerald-700/80 dark:text-emerald-400/80">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Private to your household</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
