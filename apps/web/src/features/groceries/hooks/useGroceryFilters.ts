import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GroceryItem } from '../../../types';
import { getGroceryUrgency } from '../utils/groceryFormatters';

export type GroceryStatusFilter = 'all' | 'pending' | 'purchased' | 'urgent';
export type GrocerySortOption = 'default' | 'name-asc' | 'urgency-desc' | 'qty-desc' | 'qty-asc' | 'category';

export function useGroceryFilters(items: GroceryItem[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params
  const initialStatus = (searchParams.get('status') || searchParams.get('filter') || 'all') as GroceryStatusFilter;
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = (searchParams.get('sort') || 'default') as GrocerySortOption;

  const [statusFilter, setStatusFilter] = useState<GroceryStatusFilter>(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<GrocerySortOption>(initialSort);

  // Sync state if URL query params change (e.g. browser back/forward)
  useEffect(() => {
    const urlStatus = (searchParams.get('status') || searchParams.get('filter') || 'all') as GroceryStatusFilter;
    if (urlStatus !== statusFilter) setStatusFilter(urlStatus);

    const urlCategory = searchParams.get('category') || 'ALL';
    if (urlCategory !== categoryFilter) setCategoryFilter(urlCategory);

    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchQuery) setSearchQuery(urlSearch);

    const urlSort = (searchParams.get('sort') || 'default') as GrocerySortOption;
    if (urlSort !== sortBy) setSortBy(urlSort);
  }, [searchParams]);

  // Update URL helper
  const updateUrlParam = (key: string, value: string, defaultValue: string = '') => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleStatusChange = (status: GroceryStatusFilter) => {
    setStatusFilter(status);
    updateUrlParam('status', status, 'all');
  };

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category);
    updateUrlParam('category', category, 'ALL');
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateUrlParam('search', query, '');
  };

  const handleSortChange = (sort: GrocerySortOption) => {
    setSortBy(sort);
    updateUrlParam('sort', sort, 'default');
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('ALL');
    setSearchQuery('');
    setSortBy('default');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Derive unique categories from existing items
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.category) set.add(item.category);
    }
    return Array.from(set).sort();
  }, [items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items
      .filter((item) => {
        // Status filter
        if (statusFilter === 'pending' && item.purchaseDate) return false;
        if (statusFilter === 'purchased' && !item.purchaseDate) return false;
        if (statusFilter === 'urgent') {
          if (item.purchaseDate) return false;
          const urgency = getGroceryUrgency(item);
          if (urgency !== 'URGENT' && urgency !== 'LOW_STOCK') return false;
        }

        // Category filter
        if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
          return false;
        }

        // Search query
        if (query) {
          const matchName = item.name.toLowerCase().includes(query);
          const matchCategory = item.category?.toLowerCase().includes(query);
          const matchUnit = item.unit?.toLowerCase().includes(query);
          if (!matchName && !matchCategory && !matchUnit) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sorting logic
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'qty-desc') {
          return b.quantity - a.quantity;
        }
        if (sortBy === 'qty-asc') {
          return a.quantity - b.quantity;
        }
        if (sortBy === 'category') {
          return (a.category || '').localeCompare(b.category || '');
        }
        if (sortBy === 'urgency-desc') {
          const urgencyRank: Record<string, number> = {
            URGENT: 3,
            LOW_STOCK: 2,
            IN_STOCK: 1,
            PURCHASED: 0,
          };
          return (urgencyRank[getGroceryUrgency(b)] || 0) - (urgencyRank[getGroceryUrgency(a)] || 0);
        }

        // Default sort: pending first, then urgent, then most recently updated
        const aPurchased = Boolean(a.purchaseDate);
        const bPurchased = Boolean(b.purchaseDate);
        if (aPurchased !== bPurchased) {
          return aPurchased ? 1 : -1;
        }

        const aUrgency = getGroceryUrgency(a);
        const bUrgency = getGroceryUrgency(b);
        if (aUrgency === 'URGENT' && bUrgency !== 'URGENT') return -1;
        if (bUrgency === 'URGENT' && aUrgency !== 'URGENT') return 1;

        return (new Date(b.updatedAt || 0).getTime()) - (new Date(a.updatedAt || 0).getTime());
      });
  }, [items, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Group filtered items by category
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, GroceryItem[]> = {};

    for (const item of filteredItems) {
      const cat = item.category || 'Other';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(item);
    }

    return Object.entries(groups).sort(([catA], [catB]) => catA.localeCompare(catB));
  }, [filteredItems]);

  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'ALL' || searchQuery.trim() !== '' || sortBy !== 'default';

  return {
    statusFilter,
    categoryFilter,
    searchQuery,
    sortBy,
    availableCategories,
    filteredItems,
    groupedByCategory,
    hasActiveFilters,
    handleStatusChange,
    handleCategoryChange,
    handleSearchChange,
    handleSortChange,
    clearFilters,
  };
}
