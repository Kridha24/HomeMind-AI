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
  const householdName = household?.name || (user?.name ? `${user.name}'s Home` : "Mihir kridha Shekhar Gupta's Home");

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
      {/* Ambient decorative shapes & glows */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-10 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-400/25 to-purple-500/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-1/3 w-80 h-52 rounded-full bg-emerald-300/20 dark:bg-emerald-500/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute top-6 left-[45%] w-32 h-32 rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-2xl" />

      {/* Modern 3D Smart Eco-Villa Illustration on the right */}
      <div className="pointer-events-none absolute right-2 sm:right-6 bottom-0 top-0 w-72 lg:w-96 hidden md:flex items-center justify-end overflow-hidden opacity-90 select-none">
        <svg
          viewBox="0 0 420 280"
          className="w-full h-full max-h-[220px] object-contain drop-shadow-xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="wallLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="glassAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="grassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Backyard Grass & Base Ground */}
          <path d="M10 250 Q210 235 410 250 L410 280 L10 280 Z" fill="url(#grassGrad)" opacity="0.85" />
          <ellipse cx="70" cy="220" rx="35" ry="50" fill="#047857" opacity="0.8" />
          <ellipse cx="60" cy="180" rx="25" ry="38" fill="#10b981" opacity="0.9" />
          <ellipse cx="380" cy="210" rx="28" ry="42" fill="#059669" opacity="0.85" />
          <ellipse cx="390" cy="175" rx="20" ry="30" fill="#34d399" opacity="0.95" />

          {/* Main Villa Building Body */}
          <rect x="110" y="90" width="220" height="150" rx="8" fill="url(#wallLight)" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="90" y="60" width="200" height="85" rx="6" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
          <rect x="80" y="50" width="225" height="14" rx="4" fill="url(#roofGrad)" />
          <rect x="100" y="140" width="235" height="10" rx="3" fill="url(#roofGrad)" />

          {/* Warm Illuminated Glass Windows */}
          <rect x="110" y="75" width="70" height="55" rx="4" fill="url(#glassAmber)" />
          <line x1="145" y1="75" x2="145" y2="130" stroke="#78350f" strokeWidth="1.5" />
          <rect x="195" y="75" width="80" height="55" rx="4" fill="url(#glassAmber)" />
          <line x1="235" y1="75" x2="235" y2="130" stroke="#78350f" strokeWidth="1.5" />

          {/* Ground floor sliding glass patio */}
          <rect x="125" y="160" width="105" height="80" rx="4" fill="url(#glassAmber)" opacity="0.85" />
          <line x1="177" y1="160" x2="177" y2="240" stroke="#b45309" strokeWidth="2" />
          <rect x="250" y="160" width="60" height="80" rx="4" fill="#64748b" opacity="0.25" stroke="#94a3b8" strokeWidth="1.5" />

          {/* Modern front door */}
          <rect x="260" y="175" width="38" height="65" rx="3" fill="#1e293b" />
          <circle cx="290" cy="208" r="2" fill="#fbbf24" />

          {/* Balcony glass railing */}
          <rect x="90" y="125" width="200" height="18" rx="2" fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="90" y1="125" x2="290" y2="125" stroke="#0284c7" strokeWidth="2" strokeOpacity="0.6" />

          {/* Ambient smart-home wifi/ai aura */}
          <path d="M220 30 A24 24 0 0 1 240 42" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
          <path d="M214 24 A32 32 0 0 1 246 40" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          <circle cx="210" cy="40" r="3" fill="#6366f1" />
        </svg>
      </div>

      <div className="relative p-4 sm:p-6 space-y-3.5 z-10">
        {/* Top Row: Contextual Greeting & Telemetry */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3 sm:gap-4 max-w-xl">
            {/* Home tile */}
            <div className="hidden sm:flex w-12 h-12 rounded-2xl items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 text-white shadow-lg shadow-indigo-500/30">
              <HomeIcon className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-[1.75rem] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  {localizedGreeting}, {greetingName} 👋
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${roleConfig.badgeBg} ${roleConfig.textColor} ${roleConfig.borderColor}`}
                >
                  {roleConfig.label}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                Here’s what your home needs today. Everything’s under control! ✨
              </p>

              {/* Date / time / place chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 border border-indigo-200/90 dark:border-indigo-500/30 text-[11px] sm:text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  {localizedDateStr}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 border border-sky-200/90 dark:border-sky-500/30 font-mono text-[11px] font-bold text-sky-700 dark:text-sky-300 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                  {currentTimeStr || '02:57:38 pm'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 border border-emerald-200/90 dark:border-emerald-500/30 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {householdName}
                  <span className="text-emerald-600/70 dark:text-emerald-400/70 font-medium">
                    • {countryName || 'India'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Days remaining floating card */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap md:self-start z-10">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-amber-200/90 dark:border-amber-500/35 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/30">
                <Hourglass className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="block text-sm font-black text-slate-900 dark:text-white">
                  {daysRemaining === 0 ? 'Today' : `${daysRemaining} days`}
                </span>
                <span className="block text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  left in {monthName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Home status strip */}
        <div className="flex items-center justify-between gap-2 flex-wrap rounded-2xl px-3.5 py-2.5 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-indigo-200/60 dark:border-indigo-500/25">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-bold shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-500 text-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-amber-500'}`} />
              Home running smoothly
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25 text-xs font-bold shadow-2xs">
              <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
              <span><b>{pendingTasksCount}</b> Tasks Pending</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold shadow-2xs">
              <Receipt className="w-3.5 h-3.5 text-amber-500" />
              <span><b>{upcomingBillsCount}</b> Bills Due Soon</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Private to your household</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default DashboardGreeting;
