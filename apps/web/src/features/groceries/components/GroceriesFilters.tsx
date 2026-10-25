import React from 'react';
import { Filter, X, ArrowUpDown } from 'lucide-react';
import { GroceryStatusFilter, GrocerySortOption } from '../hooks/useGroceryFilters';
import { ShoppingMetrics } from '../hooks/useShoppingProgress';
import { GrocerySearch } from './GrocerySearch';

interface GroceriesFiltersProps {
  statusFilter: GroceryStatusFilter;
  onStatusChange: (status: GroceryStatusFilter) => void;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  availableCategories: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: GrocerySortOption;
  onSortChange: (sort: GrocerySortOption) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  metrics: ShoppingMetrics;
}

export const GroceriesFilters: React.FC<GroceriesFiltersProps> = ({
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  availableCategories,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
  metrics,
}) => {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      {/* 5. Unified Control Bar */}
      <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl glass-panel border border-primary/70 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2 sm:gap-2.5">
        {/* LEFT: Status Tabs */}
        <div className="flex items-center gap-1 p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-secondary/30 dark:bg-slate-900/60 border border-primary/50 overflow-x-auto no-scrollbar shrink-0">
          {/* All Items */}
          <button
            type="button"
            onClick={() => onStatusChange('all')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-panel text-primary shadow-xs border border-primary/60'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>All Items</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-secondary text-secondary font-mono">
              {metrics.totalItems}
            </span>
          </button>

          {/* Need to Buy */}
          <button
            type="button"
            onClick={() => onStatusChange('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-xs border border-rose-500/30'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Need to Buy</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono">
              {metrics.needToBuyCount}
            </span>
          </button>

          {/* Purchased */}
          <button
            type="button"
            onClick={() => onStatusChange('purchased')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'purchased'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-500/30'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Purchased</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
              {metrics.purchasedCount}
            </span>
          </button>

          {/* Urgent */}
          <button
            type="button"
            onClick={() => onStatusChange('urgent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'urgent'
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs border border-amber-500/30'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Urgent</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold">
              {metrics.urgentCount + metrics.lowStockCount}
            </span>
          </button>
        </div>

        {/* RIGHT: Search, Category & Sort */}
        <div className="flex items-center gap-2 flex-1 xl:max-w-xl">
          <GrocerySearch
            value={searchQuery}
            onChange={onSearchChange}
            className="flex-1 min-w-[130px]"
          />

          {/* Category Dropdown */}
          <div className="relative shrink-0">
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              aria-label="Filter by Category"
              className="appearance-none pl-2.5 pr-7 py-2 text-xs bg-secondary/40 dark:bg-slate-900/60 border border-primary/70 rounded-xl text-primary font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-secondary absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as GrocerySortOption)}
              aria-label="Sort groceries"
              className="appearance-none pl-2.5 pr-7 py-2 text-xs bg-secondary/40 dark:bg-slate-900/60 border border-primary/70 rounded-xl text-primary font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="default">Sort ▾</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="urgency-desc">Urgency (High First)</option>
              <option value="qty-desc">Quantity (High-Low)</option>
              <option value="qty-asc">Quantity (Low-High)</option>
              <option value="category">Category</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-secondary absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 6. Active Filters (Only displayed when actual filters are applied) */}
      {hasActiveFilters ? (
        <div className="flex items-center flex-wrap gap-2 px-1 text-xs animate-in fade-in duration-150">
          <span className="text-[11px] font-semibold text-secondary">
            Filtered by:
          </span>

          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              <span>{statusFilter === 'pending' ? 'Need to Buy' : statusFilter === 'purchased' ? 'Purchased' : 'Urgent'}</span>
              <button
                type="button"
                onClick={() => onStatusChange('all')}
                className="hover:opacity-75"
                title="Remove status filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {categoryFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span>{categoryFilter}</span>
              <button
                type="button"
                onClick={() => onCategoryChange('ALL')}
                className="hover:opacity-75"
                title="Remove category filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <span>"{searchQuery}"</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="hover:opacity-75"
                title="Remove search query"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {sortBy !== 'default' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              <span>Sort: {sortBy}</span>
              <button
                type="button"
                onClick={() => onSortChange('default')}
                className="hover:opacity-75"
                title="Reset sort"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onClearFilters}
            className="text-[11px] font-semibold text-secondary hover:text-primary underline ml-1"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
};

