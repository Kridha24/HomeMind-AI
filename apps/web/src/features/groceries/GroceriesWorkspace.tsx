import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGroceries } from './hooks/useGroceries';
import { useShoppingProgress } from './hooks/useShoppingProgress';
import { useGroceryFilters } from './hooks/useGroceryFilters';
import { GroceryItem } from '../../types';

// Workspace components
import { GroceriesHeader } from './components/GroceriesHeader';
import { GroceriesSummary } from './components/GroceriesSummary';
import { GroceriesFilters } from './components/GroceriesFilters';
import { GroceryCategoryGroup } from './components/GroceryCategoryGroup';
import { AddEditGroceryModal } from './components/AddEditGroceryModal';
import { DeleteGroceryModal } from './components/DeleteGroceryModal';
import { ShoppingMode } from './components/ShoppingMode';
import { GroceriesSkeleton } from './components/GroceriesSkeleton';
import { GroceriesEmptyState } from './components/GroceriesEmptyState';
import { GroceriesErrorState } from './components/GroceriesErrorState';

export const GroceriesWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Data hook
  const {
    items,
    isLoading,
    isError,
    error,
    refetch,
    householdId,
    addItem,
    editItem,
    togglePurchase,
    updateQuantity,
    deleteItem,
  } = useGroceries();

  // Progress metrics hook
  const metrics = useShoppingProgress(items);

  // Filters hook
  const {
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
  } = useGroceryFilters(items);

  // Modals & Overlay state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<GroceryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isShoppingModeOpen, setIsShoppingModeOpen] = useState(
    searchParams.get('mode') === 'shopping'
  );

  // Sync mode parameter with Shopping Mode
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'shopping' && !isShoppingModeOpen) {
      setIsShoppingModeOpen(true);
    }
  }, [searchParams, isShoppingModeOpen]);

  // Android hardware back button handler
  useEffect(() => {
    const handlePopState = () => {
      if (isShoppingModeOpen) {
        setIsShoppingModeOpen(false);
        const next = new URLSearchParams(searchParams);
        next.delete('mode');
        setSearchParams(next, { replace: true });
      } else if (isAddEditOpen) {
        setIsAddEditOpen(false);
      } else if (isDeleteOpen) {
        setIsDeleteOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isShoppingModeOpen, isAddEditOpen, isDeleteOpen, searchParams, setSearchParams]);

  const handleOpenShoppingMode = () => {
    setIsShoppingModeOpen(true);
    const next = new URLSearchParams(searchParams);
    next.set('mode', 'shopping');
    setSearchParams(next, { replace: true });
  };

  const handleExitShoppingMode = () => {
    setIsShoppingModeOpen(false);
    const next = new URLSearchParams(searchParams);
    next.delete('mode');
    setSearchParams(next, { replace: true });
  };

  // Quick Add handler
  const handleQuickAdd = async (name: string) => {
    await addItem({
      name,
      category: 'Other',
      quantity: 1,
      unit: 'pcs',
      minThreshold: 1,
    });
  };

  // Add/Edit Submit handler
  const handleModalSubmit = async (data: Partial<GroceryItem>) => {
    if (editingItem?.id) {
      await editItem({ id: editingItem.id, data });
    } else {
      await addItem(data);
    }
    setIsAddEditOpen(false);
    setEditingItem(null);
  };

  // Delete Confirm handler
  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) return;
    try {
      setIsDeleting(true);
      await deleteItem(itemToDelete.id);
      setIsDeleteOpen(false);
      setItemToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = useCallback((item: GroceryItem) => {
    setEditingItem(item);
    setIsAddEditOpen(true);
  }, []);

  // Open Delete Modal
  const handleOpenDelete = useCallback((item: GroceryItem) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  }, []);

  // Checkbox toggle handler
  const handleTogglePurchase = useCallback(
    async (id: string, purchased: boolean) => {
      await togglePurchase({ id, purchased });
    },
    [togglePurchase]
  );

  // Quantity adjuster handler
  const handleUpdateQuantity = useCallback(
    async (id: string, quantity: number) => {
      await updateQuantity({ id, quantity });
    },
    [updateQuantity]
  );

  // If Shopping Mode is active, render full-screen shopping mode
  if (isShoppingModeOpen) {
    return (
      <ShoppingMode
        items={items}
        onTogglePurchase={handleTogglePurchase}
        onExit={handleExitShoppingMode}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <GroceriesHeader
        onAddItem={() => {
          setEditingItem(null);
          setIsAddEditOpen(true);
        }}
        onQuickAdd={handleQuickAdd}
        onOpenShoppingMode={handleOpenShoppingMode}
        onRefresh={() => refetch()}
        isRefreshing={isLoading}
        totalPending={metrics.needToBuyCount}
      />

      {/* 2. Loading Skeleton State */}
      {isLoading && items.length === 0 ? (
        <GroceriesSkeleton />
      ) : isError ? (
        /* 3. Error State */
        <GroceriesErrorState onRetry={() => refetch()} error={error} />
      ) : (
        <>
          {/* 4. Real Metrics Summary Strip */}
          <GroceriesSummary
            metrics={metrics}
            onFilterChange={handleStatusChange}
            activeFilter={statusFilter}
          />

          {/* 5. Filters, Search & Sort */}
          {items.length > 0 && (
            <GroceriesFilters
              statusFilter={statusFilter}
              onStatusChange={handleStatusChange}
              categoryFilter={categoryFilter}
              onCategoryChange={handleCategoryChange}
              availableCategories={availableCategories}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              metrics={metrics}
            />
          )}

          {/* 6. List Content Area */}
          {items.length === 0 ? (
            <GroceriesEmptyState
              type="no-items"
              onAddItem={() => {
                setEditingItem(null);
                setIsAddEditOpen(true);
              }}
            />
          ) : filteredItems.length === 0 ? (
            <GroceriesEmptyState
              type={
                searchQuery
                  ? 'no-search-results'
                  : statusFilter === 'urgent'
                  ? 'no-urgent'
                  : statusFilter === 'pending' && metrics.isShoppingComplete
                  ? 'all-purchased'
                  : 'no-search-results'
              }
              searchQuery={searchQuery}
              onClearFilters={clearFilters}
              onAddItem={() => {
                setEditingItem(null);
                setIsAddEditOpen(true);
              }}
            />
          ) : (
            <div className="space-y-4">
              {groupedByCategory.map(([category, categoryItems]) => (
                <GroceryCategoryGroup
                  key={`${householdId}-${category}`}
                  category={category}
                  items={categoryItems}
                  onTogglePurchase={handleTogglePurchase}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Grocery Modal */}
      <AddEditGroceryModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={editingItem}
      />

      {/* Delete Confirmation Modal */}
      <DeleteGroceryModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        item={itemToDelete}
        loading={isDeleting}
      />
    </div>
  );
};
export default GroceriesWorkspace;
