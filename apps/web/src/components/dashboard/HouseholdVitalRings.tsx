import React from 'react';
import { Sparkles, TrendingUp, ShieldCheck, ShoppingBag, CheckSquare, Wallet, ArrowUpRight } from 'lucide-react';
import { useSettingStore } from '../../stores/useSettingStore';
import { useI18n } from '../../utils/i18n';

interface HouseholdVitalRingsProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  taskStats?: { total: number; completed: number };
  pantryStats?: { total: number; fresh: number; expiringSoon: number };
}

export const HouseholdVitalRings: React.FC<HouseholdVitalRingsProps> = ({
  monthlyIncome,
  monthlyExpenses,
  monthlySavings,
  taskStats = { total: 10, completed: 8 },
  pantryStats = { total: 24, fresh: 21, expiringSoon: 3 },
}) => {
  const { format } = useSettingStore();
  const { t } = useI18n();

  // 1. Savings & Budget Score (Percentage of Income saved)
  const hasBudgetData = monthlyIncome > 0;
  const budgetRatio = hasBudgetData
    ? Math.max(0, Math.min(100, Math.round((monthlySavings / monthlyIncome) * 100)))
    : null;

  // 2. Kitchen Food Freshness (Percentage of items fresh)
  const hasPantryData = !!(pantryStats && pantryStats.total > 0);
  const pantryRatio = hasPantryData
    ? Math.max(0, Math.min(100, Math.round((pantryStats.fresh / pantryStats.total) * 100)))
    : null;

  // 3. Home Chores & Tasks (Percentage of completed chores)
  const hasTaskData = !!(taskStats && taskStats.total > 0);
  const taskRatio = hasTaskData
    ? Math.max(0, Math.min(100, Math.round((taskStats.completed / taskStats.total) * 100)))
    : null;

  // Overall Home Health Score (Average of available verified metrics)
  const availableRatios = [budgetRatio, pantryRatio, taskRatio].filter(
    (r): r is number => r !== null && !isNaN(r) && isFinite(r)
  );
  const overallScore =
    availableRatios.length > 0
      ? Math.round(availableRatios.reduce((acc, r) => acc + r, 0) / availableRatios.length)
      : null;

  // SVG Geometry Calculation
  const size = 220;
  const strokeWidth = 14;
  const center = size / 2;

  // Radii
  const r1 = 88; // Outer (Savings & Budget)
  const r2 = 68; // Middle (Food Freshness)
  const r3 = 48; // Inner (Chores & Tasks)

  const circ1 = 2 * Math.PI * r1;
  const circ2 = 2 * Math.PI * r2;
  const circ3 = 2 * Math.PI * r3;

  const strokeDash1 = budgetRatio !== null ? (budgetRatio / 100) * circ1 : 0;
  const strokeDash2 = pantryRatio !== null ? (pantryRatio / 100) * circ2 : 0;
  const strokeDash3 = taskRatio !== null ? (taskRatio / 100) * circ3 : 0;

  return (
    <div className="glass-panel p-4 sm:p-6 md:p-7 border-primary/80 rounded-2xl sm:rounded-3xl relative overflow-hidden bg-panel/90 backdrop-blur-xl shadow-sm dark:shadow-2xl space-y-4 sm:space-y-6">
      {/* Header with Explanation & Status */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-primary tracking-tight">
              {t('vitals.title', 'Home Health Score')}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('vitals.status', 'Household Summary')}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-secondary">
            {t('vitals.subtitle', 'Calculated from actual budget savings, pantry food freshness, and completed chores')}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          {overallScore !== null ? (
            <>
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-primary font-mono tracking-tight block">
                {overallScore}%
              </span>
              <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                {overallScore >= 70 ? t('vitals.great', 'Looking Great 👍') : t('vitals.attention', 'Attention Needed ⚠️')}
              </span>
            </>
          ) : (
            <span className="text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 italic block">
              Not enough data yet
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Concentric Rings + Metrics Legend */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center">
        {/* Left: Concentric Activity Rings */}
        <div className="md:col-span-5 flex justify-center items-center relative py-1 sm:py-2">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-36 h-36 sm:w-44 sm:h-44 md:w-[220px] md:h-[220px] transform -rotate-90">
            {/* Background Tracks */}
            <circle
              cx={center}
              cy={center}
              r={r1}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-blue-500/10 dark:text-blue-500/15"
            />
            <circle
              cx={center}
              cy={center}
              r={r2}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-emerald-500/10 dark:text-emerald-500/15"
            />
            <circle
              cx={center}
              cy={center}
              r={r3}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-purple-500/10 dark:text-purple-500/15"
            />

            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="budgetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="pantryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="taskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>

            {/* Outer Progress Ring: Savings & Budget */}
            <circle
              cx={center}
              cy={center}
              r={r1}
              fill="transparent"
              stroke="url(#budgetGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circ1}
              strokeDashoffset={circ1 - strokeDash1}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />

            {/* Middle Progress Ring: Food Freshness */}
            <circle
              cx={center}
              cy={center}
              r={r2}
              fill="transparent"
              stroke="url(#pantryGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circ2}
              strokeDashoffset={circ2 - strokeDash2}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />

            {/* Inner Progress Ring: Chores Done */}
            <circle
              cx={center}
              cy={center}
              r={r3}
              fill="transparent"
              stroke="url(#taskGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circ3}
              strokeDashoffset={circ3 - strokeDash3}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Title */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span className="text-[10px] font-extrabold text-muted uppercase tracking-widest mt-0.5">
              {overallScore !== null ? `${overallScore}%` : 'Vitals'}
            </span>
          </div>
        </div>

        {/* Right: Detailed Metric Calculations */}
        <div className="md:col-span-7 space-y-3">
          {/* 1. Monthly Savings Card */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-primary block">
                  Money Saved
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                  Budget target vs actual spending
                </span>
                <span className="text-[11px] text-secondary font-mono mt-0.5 block">
                  {hasBudgetData
                    ? monthlySavings >= 0 ? `+${format(monthlySavings)} saved` : `-${format(Math.abs(monthlySavings))} deficit`
                    : 'Log income to calculate budget'}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {budgetRatio !== null ? (
                <>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono block">
                    {budgetRatio}%
                  </span>
                  <span className="text-[10px] text-muted font-medium">{t('dash.saved', 'Saved')}</span>
                </>
              ) : (
                <span className="text-[11px] font-medium text-slate-400 italic">Not enough data yet</span>
              )}
            </div>
          </div>

          {/* 2. Kitchen Food Freshness Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-primary block">
                  Kitchen Food Freshness
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                  Fresh / total tracked grocery items
                </span>
                <span className="text-[11px] text-secondary font-mono mt-0.5 block">
                  {hasPantryData
                    ? `${pantryStats!.fresh} fresh of ${pantryStats!.total} tracked`
                    : 'Add items in pantry inventory'}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {pantryRatio !== null ? (
                <>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                    {pantryRatio}%
                  </span>
                  <span className="text-[10px] text-muted font-medium">Fresh</span>
                </>
              ) : (
                <span className="text-[11px] font-medium text-slate-400 italic">Not enough data yet</span>
              )}
            </div>
          </div>

          {/* 3. Home Chores & Tasks Card */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-primary block">
                  Home Chores & Tasks
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                  Completed / due tasks
                </span>
                <span className="text-[11px] text-secondary font-mono mt-0.5 block">
                  {hasTaskData
                    ? `${taskStats!.completed} completed of ${taskStats!.total} total`
                    : 'Assign tasks to track chore completion'}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {taskRatio !== null ? (
                <>
                  <span className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono block">
                    {taskRatio}%
                  </span>
                  <span className="text-[10px] text-muted font-medium">Done</span>
                </>
              ) : (
                <span className="text-[11px] font-medium text-slate-400 italic">Not enough data yet</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseholdVitalRings;
