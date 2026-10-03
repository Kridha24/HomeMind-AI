import React from 'react';
import { BarChart3, Plus, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AnalyticsEmptyStateProps {
  onResetFilter?: () => void;
  isFiltered?: boolean;
}

export const AnalyticsEmptyState: React.FC<AnalyticsEmptyStateProps> = ({
  onResetFilter,
  isFiltered,
}) => {
  const navigate = useNavigate();

  return (
    <div className="glass-panel p-12 text-center border-primary space-y-4 max-w-lg mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-muted">
        <BarChart3 className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-primary">
          {isFiltered
            ? 'No Financial Activity for This Period'
            : 'No Household Activity Recorded'}
        </h3>
        <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
          {isFiltered
            ? 'Try selecting a wider timeframe or All Time to inspect historical records.'
            : 'Add your household expenses, incomes, or bills to begin generating intelligence.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {isFiltered && onResetFilter && (
          <button
            onClick={onResetFilter}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-primary transition-colors"
          >
            View All Time
          </button>
        )}
        <button
          onClick={() => navigate('/expenses')}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Expense</span>
        </button>
        <button
          onClick={() => navigate('/finance')}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-900/20"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Add Income</span>
        </button>
      </div>
    </div>
  );
};
