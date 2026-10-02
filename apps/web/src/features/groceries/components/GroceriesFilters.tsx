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
    <div className="space-y-3">
      {/* Top Filter Bar: Status tabs + Search + Dropdowns */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/50 dark:bg-slate-900/60 border border-primary/60 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onStatusChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-panel text-primary shadow-xs border border-primary/50'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>All Items</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-secondary text-secondary font-mono">
              {metrics.totalItems}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-panel text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-500/30'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Need to Buy</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono">
              {metrics.needToBuyCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange('purchased')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'purchased'
                ? 'bg-panel text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-500/30'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Purchased</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono">
              {metrics.purchasedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusChange('urgent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'urgent'
                ? 'bg-panel text-rose-600 dark:text-rose-400 shadow-xs border border-rose-500/30'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Urgent</span>
            {(metrics.urgentCount > 0 || metrics.lowStockCount > 0) && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/15 text-rose-700 dark:text-rose-300 font-mono font-bold">
                {metrics.urgentCount + metrics.lowStockCount}
              </span>
            )}
          </button>
        </div>

        {/* Search & Select dropdowns */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          <GrocerySearch
            value={searchQuery}
            onChange={onSearchChange}
            className="flex-1"
          />

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              aria-label="Filter by Category"
              className="appearance-none pl-3 pr-8 py-2 text-xs bg-secondary/50 dark:bg-slate-900/60 border border-primary/70 rounded-xl text-primary font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as GrocerySortOption)}
              aria-label="Sort groceries"
              className="appearance-none pl-3 pr-8 py-2 text-xs bg-secondary/50 dark:bg-slate-900/60 border border-primary/70 rounded-xl text-primary font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="default">Default Sort</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="urgency-desc">Urgency (High First)</option>
              <option value="qty-desc">Quantity (High-Low)</option>
              <option value="qty-asc">Quantity (Low-High)</option>
              <option value="category">Category</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex items-center flex-wrap gap-2 pt-1 animate-in fade-in duration-150">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
            Active Filters:
          </span>

          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
              <span>Status: {statusFilter === 'pending' ? 'Need to Buy' : statusFilter === 'purchased' ? 'Purchased' : 'Urgent'}</span>
              <button
                type="button"
                onClick={() => onStatusChange('all')}
                className="hover:opacity-75"
                title="Remove status filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {categoryFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <span>Category: {categoryFilter}</span>
              <button
                type="button"
                onClick={() => onCategoryChange('ALL')}
                className="hover:opacity-75"
                title="Remove category filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <span>Query: "{searchQuery}"</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="hover:opacity-75"
                title="Remove search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {sortBy !== 'default' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
              <span>Sort: {sortBy}</span>
              <button
                type="button"
                onClick={() => onSortChange('default')}
                className="hover:opacity-75"
                title="Reset sort"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onClearFilters}
            className="text-[11px] font-bold text-secondary hover:text-primary underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
