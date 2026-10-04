import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  ShoppingBasket,
  CheckSquare,
  Command,
} from 'lucide-react';
import { useI18n } from '../../utils/i18n';
import { canViewHouseholdFinancials } from '../../utils/permissions';

interface QuickActionCommandBarProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddBill: () => void;
  onAddGrocery: () => void;
  onAddTask: () => void;
  onOpenCommandPalette?: () => void;
  userRole?: string;
}

export const QuickActionCommandBar: React.FC<QuickActionCommandBarProps> = ({
  onAddIncome,
  onAddExpense,
  onAddBill,
  onAddGrocery,
  onAddTask,
  onOpenCommandPalette,
  userRole = 'MEMBER',
}) => {
  const { t } = useI18n();
  const isGuest = userRole === 'GUEST';
  const isFullFinanceAdmin = canViewHouseholdFinancials(userRole);

  if (isGuest) {
    return null; // Guests have read-only access
  }

  return (
    <nav
      className="flex items-center justify-between px-3 sm:px-4 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs"
      aria-label="Quick Actions Command Bar"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
        <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:block mr-1 flex-shrink-0">
          {t('dash.quickActions', 'Quick Actions')}
        </span>

        {/* Primary Action 1: Income */}
        <button
          type="button"
          onClick={onAddIncome}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 via-emerald-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white rounded-xl text-[11px] sm:text-xs font-bold shadow-xs shadow-emerald-500/25 hover:-translate-y-px active:scale-[0.98] transition-all flex-shrink-0"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{t('dash.addIncome', '+ Income')}</span>
        </button>

        {/* Primary Action 2: Expense */}
        <button
          type="button"
          onClick={onAddExpense}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 via-red-600 to-pink-500 hover:from-rose-500 hover:to-red-400 text-white rounded-xl text-[11px] sm:text-xs font-bold shadow-xs shadow-rose-500/25 hover:-translate-y-px active:scale-[0.98] transition-all flex-shrink-0"
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>{t('dash.addExpense', '+ Expense')}</span>
        </button>

        {/* Action 3: Bill */}
        <button
          type="button"
          onClick={onAddBill}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/35 rounded-xl text-[11px] sm:text-xs font-bold hover:-translate-y-px active:scale-[0.98] transition-all flex-shrink-0 shadow-2xs"
        >
          <Receipt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{t('dash.addBill', '+ Bill')}</span>
        </button>

        {/* Action 4: Grocery */}
        <button
          type="button"
          onClick={onAddGrocery}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border border-emerald-500/35 rounded-xl text-[11px] sm:text-xs font-bold hover:-translate-y-px active:scale-[0.98] transition-all flex-shrink-0 shadow-2xs"
        >
          <ShoppingBasket className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{t('dash.addGrocery', '+ Grocery')}</span>
        </button>

        {/* Action 5: Task */}
        <button
          type="button"
          onClick={onAddTask}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/15 hover:bg-violet-500/25 text-violet-800 dark:text-violet-200 border border-violet-500/35 rounded-xl text-[11px] sm:text-xs font-bold hover:-translate-y-px active:scale-[0.98] transition-all flex-shrink-0 shadow-2xs"
        >
          <CheckSquare className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span>{t('dash.addTask', '+ Task')}</span>
        </button>
      </div>

      {/* Right Command Palette Shortcut Hint */}
      {onOpenCommandPalette && (
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex-shrink-0"
        >
          <Command className="w-3 h-3 text-blue-500" />
          <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-[10px] shadow-2xs">
            ⌘K
          </kbd>
        </button>
      )}
    </nav>
  );
};
