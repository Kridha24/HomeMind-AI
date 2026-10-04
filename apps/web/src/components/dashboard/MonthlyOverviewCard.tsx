import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ChevronDown, ArrowRight } from 'lucide-react';

interface MonthlyOverviewCardProps {
  monthlyIncome?: number;
  monthlyExpenses?: number;
  format?: (amount: number) => string;
}

export const MonthlyOverviewCard: React.FC<MonthlyOverviewCardProps> = ({
  monthlyIncome = 0,
  monthlyExpenses = 4000,
  format,
}) => {
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState('This Month');

  const netBalance = monthlyIncome - monthlyExpenses;

  // Chart data intervals for October: Oct 1, Oct 8, Oct 15, Oct 22, Oct 31
  const chartIntervals = [
    { label: 'Oct 1', expensePct: 80, gradient: 'from-rose-500 to-pink-500' },
    { label: 'Oct 8', expensePct: 40, gradient: 'from-blue-500 to-indigo-500' },
    { label: 'Oct 15', expensePct: 65, gradient: 'from-amber-400 to-orange-500' },
    { label: 'Oct 22', expensePct: 50, gradient: 'from-teal-400 to-emerald-500' },
    { label: 'Oct 31', expensePct: 75, gradient: 'from-purple-500 to-violet-600' },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all duration-200">
      {/* Top ambient highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-90" />

      <div>
        {/* Header with Title and Dropdown */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Monthly Overview
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Expenses, income and savings
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span>{selectedRange}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Top Summary Chips */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-center">
            <span className="text-[11px] sm:text-xs font-black text-rose-600 dark:text-rose-400 block font-mono">
              ₹4,000
            </span>
            <span className="text-[9px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Expenses
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/25 text-center">
            <span className="text-[11px] sm:text-xs font-black text-slate-700 dark:text-slate-300 block font-mono">
              ₹0
            </span>
            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Income
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-center">
            <span className="text-[11px] sm:text-xs font-black text-amber-600 dark:text-amber-400 block font-mono">
              ₹−4,000
            </span>
            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Net Balance
            </span>
          </div>
        </div>

        {/* Vertical Bar Chart with Colorful Gradient Bars */}
        <div className="pt-5 pb-1">
          <div className="h-28 flex items-end justify-between gap-3 px-2">
            {chartIntervals.map((interval) => (
              <div key={interval.label} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-800 rounded-full h-full p-1 flex items-end relative overflow-hidden">
                  <div
                    style={{ height: `${interval.expensePct}%` }}
                    className={`w-full rounded-full bg-gradient-to-t ${interval.gradient} shadow-xs transition-all duration-500 group-hover:opacity-90`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                  {interval.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[10px] font-medium text-slate-400">
          Updated in real-time
        </span>

        <button
          type="button"
          onClick={() => navigate('/analytics')}
          className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors flex items-center gap-1 group"
        >
          <span>View Analytics</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default MonthlyOverviewCard;
