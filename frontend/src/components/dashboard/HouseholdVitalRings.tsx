import React from 'react';
import { Sparkles, TrendingUp, ShieldCheck, ShoppingBag, CheckSquare, Wallet, ArrowUpRight } from 'lucide-react';
import { useSettingStore } from '../../stores/useSettingStore';

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

  // 1. Savings & Budget Score (Percentage of Income not spent)
  const budgetRatio =
    monthlyIncome > 0
      ? Math.max(0, Math.min(100, Math.round((monthlySavings / monthlyIncome) * 100)))
      : 75;

  // 2. Kitchen Food Freshness (Percentage of items fresh)
  const pantryRatio =
    pantryStats.total > 0
      ? Math.max(0, Math.min(100, Math.round((pantryStats.fresh / pantryStats.total) * 100)))
      : 88;

  // 3. Home Chores & Tasks (Percentage of completed chores)
  const taskRatio =
    taskStats.total > 0
      ? Math.max(0, Math.min(100, Math.round((taskStats.completed / taskStats.total) * 100)))
      : 80;

  // Overall Home Health Score
  const overallScore = Math.round((budgetRatio + pantryRatio + taskRatio) / 3);

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

  const strokeDash1 = (budgetRatio / 100) * circ1;
  const strokeDash2 = (pantryRatio / 100) * circ2;
  const strokeDash3 = (taskRatio / 100) * circ3;

  return (
    <div className="glass-panel p-6 sm:p-7 border-primary/80 rounded-3xl relative overflow-hidden bg-panel/90 backdrop-blur-xl shadow-sm dark:shadow-2xl space-y-6">
      {/* Header with Simple, Friendly Words */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-primary tracking-tight">
              Home Health Score
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Status
            </span>
          </div>
          <p className="text-xs text-secondary">
            Quick 1-second view of your savings, kitchen food, and home chores
          </p>
        </div>

        <div className="text-right">
          <span className="text-2xl sm:text-3xl font-black text-primary font-mono tracking-tight block">
            {overallScore}%
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
            {overallScore >= 70 ? 'Looking Great 👍' : 'Attention Needed ⚠️'}
          </span>
        </div>
      </div>

      {/* Main Grid: Concentric Rings + Metrics Legend */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Concentric Activity Rings */}
        <div className="md:col-span-5 flex justify-center items-center relative py-2">
          <svg width={size} height={size} className="transform -rotate-90">
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
              Score
            </span>
          </div>
        </div>

        {/* Right: Detailed Ring Breakdowns (Simple and Clear) */}
        <div className="md:col-span-7 space-y-3">
          {/* 1. Monthly Savings Card */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-primary block">1. Money Saved (Budget)</span>
                <span className="text-[11px] text-secondary">
                  {monthlySavings >= 0 ? `${format(monthlySavings)} saved this month` : `${format(Math.abs(monthlySavings))} over budget`}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono block">
                {budgetRatio}%
              </span>
              <span className="text-[10px] text-muted font-medium">Saved</span>
            </div>
          </div>

          {/* 2. Kitchen Food Freshness Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-primary block">2. Kitchen Food Freshness</span>
                <span className="text-[11px] text-secondary">
                  {pantryStats.fresh} of {pantryStats.total} items completely fresh
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                {pantryRatio}%
              </span>
              <span className="text-[10px] text-muted font-medium">Fresh</span>
            </div>
          </div>

          {/* 3. Home Chores & Tasks Card */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-primary block">3. Home Chores & Tasks</span>
                <span className="text-[11px] text-secondary">
                  {taskStats.completed} of {taskStats.total} tasks completed this week
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono block">
                {taskRatio}%
              </span>
              <span className="text-[10px] text-muted font-medium">Done</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
