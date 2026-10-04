import React from 'react';
import {
  Plus,
  CreditCard,
  Receipt,
  ShoppingBag,
  CheckSquare,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '../../utils/i18n';

interface QuickActionCommandBarProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddBill: () => void;
  onAddGrocery: () => void;
  onAddTask: () => void;
  onOpenAIChat?: () => void;
  onOpenCommandPalette?: () => void;
  userRole?: string;
}

export const QuickActionCommandBar: React.FC<QuickActionCommandBarProps> = ({
  onAddIncome,
  onAddExpense,
  onAddBill,
  onAddGrocery,
  onAddTask,
  onOpenAIChat,
  onOpenCommandPalette,
  userRole = 'MEMBER',
}) => {
  const { t } = useI18n();
  const isGuest = userRole === 'GUEST';

  if (isGuest) {
    return null;
  }

  const handleAIClick = () => {
    if (onOpenAIChat) {
      onOpenAIChat();
    } else if (onOpenCommandPalette) {
      onOpenCommandPalette();
    } else {
      window.dispatchEvent(new CustomEvent('open-ai-chat'));
    }
  };

  return (
    <section className="space-y-2.5" aria-label="Quick Actions">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Quick Actions
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Manage your home in seconds
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* 1. Add Income */}
        <button
          type="button"
          onClick={onAddIncome}
          className="group relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-left overflow-hidden border border-emerald-400/30"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <span className="truncate">Add Income</span>
        </button>

        {/* 2. Add Expense */}
        <button
          type="button"
          onClick={onAddExpense}
          className="group relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-rose-500 via-coral-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/35 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-left overflow-hidden border border-rose-400/30"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <span className="truncate">Add Expense</span>
        </button>

        {/* 3. Add Bill */}
        <button
          type="button"
          onClick={onAddBill}
          className="group relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/35 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-left overflow-hidden border border-amber-400/30"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Receipt className="w-4 h-4 text-white" />
          </div>
          <span className="truncate">Add Bill</span>
        </button>

        {/* 4. Add Grocery */}
        <button
          type="button"
          onClick={onAddGrocery}
          className="group relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-500/25 hover:shadow-lg hover:shadow-teal-500/35 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-left overflow-hidden border border-teal-400/30"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <span className="truncate">Add Grocery</span>
        </button>

        {/* 5. Add Task */}
        <button
          type="button"
          onClick={onAddTask}
          className="group relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-left overflow-hidden border border-purple-400/30"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <CheckSquare className="w-4 h-4 text-white" />
          </div>
          <span className="truncate">Add Task</span>
        </button>

        {/* 6. AI Helper Tile */}
        <button
          type="button"
          onClick={handleAIClick}
          className="group relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-indigo-200/90 dark:border-indigo-500/30 hover:border-indigo-500/60 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs shadow-indigo-500/30 group-hover:rotate-6 transition-transform">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider block">
              Need help?
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
              Ask HomeMind AI
            </span>
          </div>
        </button>
      </div>
    </section>
  );
};

export default QuickActionCommandBar;
