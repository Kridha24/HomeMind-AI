import React from 'react';
import { CreditCard, Plus, FilterX, RotateCcw, Smartphone } from 'lucide-react';

interface FinanceEmptyStateProps {
  isFiltered?: boolean;
  onClearFilters?: () => void;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onScanSms?: () => void;
}

export const FinanceEmptyState: React.FC<FinanceEmptyStateProps> = ({
  isFiltered = false,
  onClearFilters,
  onAddExpense,
  onAddIncome,
  onScanSms,
}) => {
  if (isFiltered) {
    return (
      <div className="glass-panel p-10 rounded-3xl border-primary/40 text-center space-y-4 max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-muted mx-auto flex items-center justify-center">
          <FilterX className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-black text-primary">No transactions match these filters</h3>
          <p className="text-xs text-muted mt-1">
            Try adjusting your search keywords, clearing selected categories, or expanding the date range.
          </p>
        </div>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-panel p-12 rounded-3xl border-primary/40 text-center space-y-4 max-w-md mx-auto my-8">
      <div className="w-14 h-14 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center border border-blue-500/20 shadow-md">
        <CreditCard className="w-7 h-7" />
      </div>
      <div>
        <h3 className="text-base font-black text-primary">No transactions yet</h3>
        <p className="text-xs text-secondary mt-1">
          Start by adding an expense or enable automatic bank and UPI transaction tracking.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2.5 pt-2 flex-wrap">
        <button
          type="button"
          onClick={onAddExpense}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>

        <button
          type="button"
          onClick={onAddIncome}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-surface-elevated border border-primary/30 text-primary hover:border-primary/50 transition-all active:scale-95"
        >
          <span>Add Income</span>
        </button>

        {onScanSms && (
          <button
            type="button"
            onClick={onScanSms}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold border border-dashed border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-all"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Scan SMS</span>
          </button>
        )}
      </div>
    </div>
  );
};
