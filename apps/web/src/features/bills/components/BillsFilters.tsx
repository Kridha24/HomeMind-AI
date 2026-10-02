import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';

export type QuickFilterKey = 'all' | 'due-soon' | 'overdue' | 'paid' | 'this-month' | 'unpaid';

interface BillsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeQuickFilter: QuickFilterKey;
  onQuickFilterChange: (filter: QuickFilterKey) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  totalFilteredCount: number;
}

export const BillsFilters: React.FC<BillsFiltersProps> = ({
  searchQuery,
  onSearchChange,
  activeQuickFilter,
  onQuickFilterChange,
  selectedCategory,
  onCategoryChange,
  categories,
  totalFilteredCount,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, onSearchChange]);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const quickFilterOptions: { key: QuickFilterKey; label: string }[] = [
    { key: 'all', label: 'All Bills' },
    { key: 'due-soon', label: 'Due Soon' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'unpaid', label: 'Unpaid' },
    { key: 'paid', label: 'Settled & Paid' },
    { key: 'this-month', label: 'This Month' },
  ];

  return (
    <div className="space-y-3">
      {/* Search and Category Filter Row */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by title, provider, category, notes..."
            className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl pl-9 pr-9 py-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-amber-500 font-medium"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary p-0.5 rounded-md"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[140px]">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full appearance-none bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary font-medium focus:outline-none focus:border-amber-500 pr-8 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <span className="text-[11px] font-semibold text-secondary whitespace-nowrap px-2.5 py-1.5 bg-secondary/40 rounded-xl border border-primary/60">
            {totalFilteredCount} result{totalFilteredCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
        {quickFilterOptions.map((opt) => {
          const isActive = activeQuickFilter === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onQuickFilterChange(opt.key)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-secondary/40 text-secondary hover:text-primary border-primary/80 hover:bg-secondary/70'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
