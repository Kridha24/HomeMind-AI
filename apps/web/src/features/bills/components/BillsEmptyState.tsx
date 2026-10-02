import React from 'react';
import { Plus, CheckCircle2, FileText, Search, Sparkles } from 'lucide-react';
import { QuickFilterKey } from './BillsFilters';

interface BillsEmptyStateProps {
  totalBills: number;
  activeFilter: QuickFilterKey;
  searchQuery: string;
  onAddBill: () => void;
  onResetFilters: () => void;
}

export const BillsEmptyState: React.FC<BillsEmptyStateProps> = ({
  totalBills,
  activeFilter,
  searchQuery,
  onAddBill,
  onResetFilters,
}) => {
  // 1. If household has no bills at all
  if (totalBills === 0) {
    return (
      <div className="glass-panel p-8 sm:p-12 text-center rounded-3xl border-primary/80 space-y-4 max-w-lg mx-auto my-6">
        <div className="w-14 h-14 rounded-3xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
          <FileText className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-primary">
            You're all caught up.
          </h3>
          <p className="text-xs text-secondary max-w-md mx-auto leading-relaxed">
            Add your recurring household bills, room rent, and utilities so HomeMind.AI can help you stay ahead of due dates and avoid late penalties.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddBill}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-amber-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add First Bill</span>
        </button>
      </div>
    );
  }

  // 2. Positive empty state when filter is 'overdue' and there are 0 overdue bills
  if (activeFilter === 'overdue') {
    return (
      <div className="glass-panel p-8 text-center rounded-3xl border-emerald-500/30 bg-emerald-500/5 space-y-3 max-w-md mx-auto my-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
            ✓ Nothing Overdue
          </h3>
          <p className="text-xs text-secondary">
            Great job! All household utility bills and rent are current and on schedule.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-xs font-bold text-emerald-600 hover:underline pt-1"
        >
          View all bills
        </button>
      </div>
    );
  }

  // 3. Positive empty state when filter is 'due-soon' and no bills due soon
  if (activeFilter === 'due-soon') {
    return (
      <div className="glass-panel p-8 text-center rounded-3xl border-blue-500/30 bg-blue-500/5 space-y-3 max-w-md mx-auto my-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-blue-700 dark:text-blue-400">
            No Bills Due This Week
          </h3>
          <p className="text-xs text-secondary">
            Your schedule is clear for the next 7 days.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-xs font-bold text-blue-600 hover:underline pt-1"
        >
          View all bills
        </button>
      </div>
    );
  }

  // 4. Search query or other filter empty state
  return (
    <div className="glass-panel p-8 text-center rounded-3xl border-primary/80 space-y-3 max-w-md mx-auto my-6">
      <div className="w-12 h-12 rounded-2xl bg-secondary/50 text-secondary flex items-center justify-center mx-auto">
        <Search className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-primary">
          No matching bills found
        </h3>
        <p className="text-xs text-secondary">
          {searchQuery
            ? `No records matching "${searchQuery}". Try a different keyword.`
            : 'No bills found matching the selected filter criteria.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onResetFilters}
        className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary hover:bg-secondary/40 border border-primary/80 transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );
};
