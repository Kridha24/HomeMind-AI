import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Hourglass, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { LiveClockPill } from './LiveClockPill';
import { getGreetingName, getTimeGreeting } from './utils/dashboardUtils';

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
  const greetingName = getGreetingName(user);
  const { greeting } = getTimeGreeting();

  const role = user?.role || 'OWNER';
  const householdName = household?.name || 'Home Residence';

  // Role badge color variants
  const roleBadgeStyles: Record<string, string> = {
    OWNER: 'bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400',
    ADMIN: 'bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400',
    MEMBER: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400',
    GUEST: 'bg-slate-500/10 border-slate-500/25 text-slate-600 dark:text-slate-400',
  };

  const badgeStyle = roleBadgeStyles[role] || roleBadgeStyles.OWNER;

  return (
    <motion.section
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: 'easeOut' }}
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-5 md:p-6 space-y-3"
      aria-label="Household Command Header"
    >
      {/* Top Row: Contextual Greeting & Status Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Greeting & Household Identity */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-[26px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {greeting}, {greetingName} 👋
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${badgeStyle}`}
            >
              {role}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
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
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
              Here's what's happening in your household today.
            </span>
          </p>
        </div>

        {/* Right: Telemetry Status Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Days Remaining Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shadow-2xs">
            <Hourglass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{daysRemaining === 0 ? `Last day of ${monthName}` : `${daysRemaining}d left in ${monthName}`}</span>
          </div>

          {/* Isolated Live Clock Pill */}
          <LiveClockPill />
        </div>
      </div>

      {/* Bottom Sub-Strip: System Status Strip (Real Household Operational State) */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
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
            <span>pending task{pendingTasksCount === 1 ? '' : 's'}</span>
          </span>

          <span className="text-slate-200 dark:text-slate-700">•</span>

          <span className="flex items-center gap-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">{upcomingBillsCount}</span>
            <span>upcoming bill{upcomingBillsCount === 1 ? '' : 's'}</span>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>HomeMind Secure Tenant Guard</span>
        </div>
      </div>
    </motion.section>
  );
};
