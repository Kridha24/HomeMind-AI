import React from 'react';
import { Tag, ChevronRight, PieChart } from 'lucide-react';
import { formatINR, getCategoryIcon } from '../utils/financeFormatters';

export interface CategorySummaryItem {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

interface CategoryBreakdownProps {
  categories: CategorySummaryItem[];
  selectedCategory?: string;
  onSelectCategory: (category: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  categories,
  selectedCategory = 'ALL',
  onSelectCategory,
  isLoading = false,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`glass-panel p-5 rounded-3xl border-primary/40 space-y-3 animate-pulse ${className}`}>
        <div className="h-5 w-40 bg-surface-elevated rounded-lg" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 bg-surface-elevated/40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className={`glass-panel p-5 rounded-3xl border-primary/60 shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-primary/20 pb-3">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-blue-500" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary">
            Monthly Category Breakdown
          </h3>
        </div>
        <span className="text-[11px] font-bold text-muted">
          {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {categories.map((item) => {
          const Icon = getCategoryIcon(item.category);
          const isSelected = selectedCategory === item.category;

          return (
            <button
              key={item.category}
              type="button"
              onClick={() => onSelectCategory(isSelected ? 'ALL' : item.category)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-blue-600/10 border-blue-500/60 ring-1 ring-blue-500/40 shadow-xs'
                  : 'bg-surface-elevated/50 border-primary/20 hover:border-primary/40 hover:bg-surface-elevated'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-primary truncate max-w-[120px]">
                    {item.category}
                  </span>
                </div>
                <span className="text-[11px] font-extrabold font-mono text-muted">
                  {item.percentage}%
                </span>
              </div>

              {/* Mini progress bar */}
              <div className="w-full bg-primary/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between w-full text-[11px] font-mono">
                <span className="font-extrabold text-primary">
                  {formatINR(item.amount)}
                </span>
                <span className="text-[10px] text-muted font-sans font-medium">
                  {item.count} tx
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
