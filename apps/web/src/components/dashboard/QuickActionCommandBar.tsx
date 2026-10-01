import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  ShoppingBasket,
  CheckSquare,
  Command,
  Plus,
} from 'lucide-react';

interface QuickActionCommandBarProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddBill: () => void;
  onAddGrocery: () => void;
  onAddTask: () => void;
  onOpenCommandPalette?: () => void;
}

export const QuickActionCommandBar: React.FC<QuickActionCommandBarProps> = ({
  onAddIncome,
  onAddExpense,
  onAddBill,
  onAddGrocery,
  onAddTask,
  onOpenCommandPalette,
}) => {
  return (
    <nav
      className="flex items-center justify-between px-3 sm:px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm"
      aria-label="Quick Actions Command Bar"
    >
      <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden lg:block mr-1 flex-shrink-0">
          Quick Actions
        </span>

        {/* Primary Action 1: Income */}
        <button
          onClick={onAddIncome}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] sm:text-[12px] font-bold shadow-sm shadow-emerald-500/20 hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-500/25 active:scale-[0.98] transition-all duration-150 flex-shrink-0"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+ Income</span>
        </button>

        {/* Primary Action 2: Expense */}
        <button
          onClick={onAddExpense}
          className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[11px] sm:text-[12px] font-bold shadow-sm shadow-rose-500/20 hover:-translate-y-0.5 hover:shadow-md hover:shadow-rose-500/25 active:scale-[0.98] transition-all duration-150 flex-shrink-0"
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>+ Expense</span>
        </button>

        {/* Secondary Action: Bill */}
        <button
          onClick={onAddBill}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] sm:text-[12px] font-semibold hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all duration-150 flex-shrink-0"
        >
          <Receipt className="w-3.5 h-3.5 text-amber-500" />
          <span>+ Bill</span>
        </button>

        {/* Secondary Action: Grocery */}
        <button
          onClick={onAddGrocery}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] sm:text-[12px] font-semibold hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all duration-150 flex-shrink-0"
        >
          <ShoppingBasket className="w-3.5 h-3.5 text-emerald-500" />
          <span>+ Grocery</span>
        </button>

        {/* Secondary Action: Task */}
        <button
          onClick={onAddTask}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] sm:text-[12px] font-semibold hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] transition-all duration-150 flex-shrink-0"
        >
          <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
          <span>+ Task</span>
        </button>
      </div>

      {/* Right Command Palette Shortcut Hint */}
      {onOpenCommandPalette && (
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex-shrink-0"
        >
          <Command className="w-3 h-3 text-blue-500" />
          <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-[10px] shadow-2xs">
            ⌘K
          </kbd>
          <span className="text-[11px] font-medium">Command Strip</span>
        </button>
      )}
    </nav>
  );
};
