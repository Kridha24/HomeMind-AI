import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Layers, AlertCircle, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { Bill } from '../../types';
import { useAuthStore } from '../../stores/useAuthStore';

// Subcomponents
import { BillsHeader } from './components/BillsHeader';
import { BillsSummary } from './components/BillsSummary';
import { BillsFilters, QuickFilterKey } from './components/BillsFilters';
import { BillRow } from './components/BillRow';
import { BillCard } from './components/BillCard';
import { BillsCalendar } from './components/BillsCalendar';
import { BillDetailDrawer } from './components/BillDetailDrawer';
import { AddEditBillModal } from './components/AddEditBillModal';
import { MarkBillPaidModal } from './components/MarkBillPaidModal';
import { DeleteBillModal } from './components/DeleteBillModal';
import { BillsSkeleton } from './components/BillsSkeleton';
import { BillsEmptyState } from './components/BillsEmptyState';
import { BillsErrorState } from './components/BillsErrorState';

// Utilities
import {
  calculateBillSummary,
  groupBillsByUrgency,
  deriveBillDisplayStatus,
} from './utils/billStatus';
import { exportBillsToCSV, formatINR } from './utils/billFormatters';

export const BillsWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { household } = useAuthStore();

  const householdId = household?.id || 'default';

  // Read URL params or default
  const paramFilter = (searchParams.get('filter') || searchParams.get('status') || 'all') as QuickFilterKey;
  const paramView = (searchParams.get('view') || 'list') as 'list' | 'timeline' | 'calendar';

  const [activeFilter, setActiveFilter] = useState<QuickFilterKey>(paramFilter);
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'calendar'>(paramView);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals and Drawers state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);

  const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
  const [billToPay, setBillToPay] = useState<Bill | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);

  const [selectedDetailBill, setSelectedDetailBill] = useState<Bill | null>(null);

  // Sync state with URL params
  useEffect(() => {
    const filterFromUrl = (searchParams.get('filter') || searchParams.get('status')) as QuickFilterKey;
    if (filterFromUrl && filterFromUrl !== activeFilter) {
      setActiveFilter(filterFromUrl);
    }
    const viewFromUrl = searchParams.get('view') as 'list' | 'timeline' | 'calendar';
    if (viewFromUrl && viewFromUrl !== viewMode) {
      setViewMode(viewFromUrl);
    }
  }, [searchParams]);

  // Update URL params when user changes filter or view
  const handleFilterChange = (newFilter: QuickFilterKey) => {
    setActiveFilter(newFilter);
    const nextParams = new URLSearchParams(searchParams);
    if (newFilter === 'all') {
      nextParams.delete('filter');
      nextParams.delete('status');
    } else {
      nextParams.set('filter', newFilter);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleViewModeChange = (newView: 'list' | 'timeline' | 'calendar') => {
    setViewMode(newView);
    const nextParams = new URLSearchParams(searchParams);
    if (newView === 'list') {
      nextParams.delete('view');
    } else {
      nextParams.set('view', newView);
    }
    setSearchParams(nextParams, { replace: true });
  };

  // React Query Fetch Bills (strictly household scoped)
  const {
    data: bills = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Bill[]>({
    queryKey: ['bills', householdId],
    queryFn: async () => {
      const res = await apiClient.get('/bills');
      const list = Array.isArray(res.data) ? res.data : res.data?.bills || [];
      return list;
    },
    staleTime: 1000 * 30, // 30s fresh
  });

  // Calculate Real Summary Metrics
  const summaryMetrics = useMemo(() => {
    return calculateBillSummary(bills);
  }, [bills]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const b of bills) {
      if (b.category) set.add(b.category);
    }
    return Array.from(set).sort();
  }, [bills]);

  // Filter and Search Bills
  const filteredBills = useMemo(() => {
    const now = new Date();
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const next7DaysMidnight = nowMidnight + 7 * 24 * 60 * 60 * 1000;
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return bills.filter((b) => {
      // 1. Category Filter
      if (selectedCategory !== 'ALL' && b.category !== selectedCategory) {
        return false;
      }

      // 2. Quick Filter
      if (activeFilter === 'paid' && b.status !== 'PAID') return false;
      if (activeFilter === 'unpaid' && b.status === 'PAID') return false;

      const due = new Date(b.dueDate);
      const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();

      if (activeFilter === 'overdue') {
        if (b.status === 'PAID' || dueMidnight >= nowMidnight) return false;
      }

      if (activeFilter === 'due-soon') {
        if (b.status === 'PAID') return false;
        if (dueMidnight < nowMidnight || dueMidnight > next7DaysMidnight) return false;
      }

      if (activeFilter === 'this-month') {
        const isDueThisMonth = due.getMonth() === currentMonth && due.getFullYear() === currentYear;
        const paidDate = b.paidAt ? new Date(b.paidAt) : null;
        const isPaidThisMonth = paidDate && paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
        if (!isDueThisMonth && !isPaidThisMonth) return false;
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (b.title || '').toLowerCase().includes(q);
        const providerMatch = (b.provider || '').toLowerCase().includes(q);
        const categoryMatch = (b.category || '').toLowerCase().includes(q);
        const notesMatch = (b.notes || '').toLowerCase().includes(q);
        if (!titleMatch && !providerMatch && !categoryMatch && !notesMatch) {
          return false;
        }
      }

      return true;
    });
  }, [bills, activeFilter, selectedCategory, searchQuery]);

  // Urgency Groups for Timeline View
  const urgencyGroups = useMemo(() => {
    return groupBillsByUrgency(filteredBills);
  }, [filteredBills]);

  // Invalidate relevant React Query caches after mutation
  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['bills', householdId] });
    queryClient.invalidateQueries({ queryKey: ['dashboardSummary', householdId] });
    queryClient.invalidateQueries({ queryKey: ['finance-summary', householdId] });
    queryClient.invalidateQueries({ queryKey: ['transactions', householdId] });
    queryClient.invalidateQueries({ queryKey: ['expenses', householdId] });
  };

  // Handlers
  const handleAddBill = () => {
    setBillToEdit(null);
    setIsAddEditOpen(true);
  };

  const handleEditBill = (bill: Bill) => {
    setBillToEdit(bill);
    setIsAddEditOpen(true);
  };

  const handleMarkPaid = (bill: Bill) => {
    setBillToPay(bill);
    setIsMarkPaidOpen(true);
  };

  const handleDeleteBill = (bill: Bill) => {
    setBillToDelete(bill);
    setIsDeleteOpen(true);
  };

  const handleSelectBill = (bill: Bill) => {
    setSelectedDetailBill(bill);
  };

  const handleExportCSV = () => {
    exportBillsToCSV(filteredBills);
  };

  const handleResetFilters = () => {
    setActiveFilter('all');
    setSelectedCategory('ALL');
    setSearchQuery('');
    setSearchParams({}, { replace: true });
  };

  if (isLoading) {
    return <BillsSkeleton />;
  }

  if (isError) {
    return (
      <BillsErrorState
        onRetry={() => refetch()}
        errorMessage={(error as any)?.message || 'Failed to fetch bills from server.'}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-16">
      {/* 1. Header with View Toggle & Action */}
      <BillsHeader
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onAddBill={handleAddBill}
        onExport={handleExportCSV}
        totalBills={bills.length}
      />

      {/* 2. Real Data Summary Strip */}
      <BillsSummary
        metrics={summaryMetrics}
        activeFilter={activeFilter}
        onFilterSelect={(filterKey) => handleFilterChange(filterKey as QuickFilterKey)}
      />

      {/* 3. Search Bar, Category Filter, Quick Filter Chips */}
      <BillsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeQuickFilter={activeFilter}
        onQuickFilterChange={handleFilterChange}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        totalFilteredCount={filteredBills.length}
      />

      {/* 4. Main Content Area according to viewMode */}
      {filteredBills.length === 0 ? (
        <BillsEmptyState
          totalBills={bills.length}
          activeFilter={activeFilter}
          searchQuery={searchQuery}
          onAddBill={handleAddBill}
          onResetFilters={handleResetFilters}
        />
      ) : viewMode === 'calendar' ? (
        <BillsCalendar
          bills={bills}
          onSelectBill={handleSelectBill}
          onMarkPaid={handleMarkPaid}
        />
      ) : viewMode === 'timeline' ? (
        /* Timeline Urgency Grouping View */
        <div className="space-y-6">
          {urgencyGroups.map((group) => {
            const isOverdue = group.key === 'OVERDUE';
            const isDueToday = group.key === 'DUE_TODAY';

            return (
              <div key={group.key} className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-primary/60">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                        isOverdue
                          ? 'text-rose-600 dark:text-rose-400'
                          : isDueToday
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-secondary'
                      }`}
                    >
                      {isOverdue && <AlertCircle className="w-4 h-4" />}
                      {isDueToday && <Clock className="w-4 h-4" />}
                      <span>{group.title}</span>
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-secondary/50 text-secondary border border-primary/60">
                      {group.count}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-secondary">
                    Total: {formatINR(group.totalAmount)}
                  </span>
                </div>

                {/* Rows on desktop, cards on mobile */}
                <div className="hidden sm:block space-y-2">
                  {group.bills.map((bill) => (
                    <BillRow
                      key={bill.id}
                      bill={bill}
                      onSelect={handleSelectBill}
                      onMarkPaid={handleMarkPaid}
                      onEdit={handleEditBill}
                      onDelete={handleDeleteBill}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:hidden gap-3">
                  {group.bills.map((bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      onSelect={handleSelectBill}
                      onMarkPaid={handleMarkPaid}
                      onEdit={handleEditBill}
                      onDelete={handleDeleteBill}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Standard List View */
        <div className="space-y-3">
          {/* Desktop Table / List Rows */}
          <div className="hidden sm:block space-y-2">
            {filteredBills.map((bill) => (
              <BillRow
                key={bill.id}
                bill={bill}
                onSelect={handleSelectBill}
                onMarkPaid={handleMarkPaid}
                onEdit={handleEditBill}
                onDelete={handleDeleteBill}
              />
            ))}
          </div>

          {/* Mobile Card Grid */}
          <div className="grid grid-cols-1 sm:hidden gap-3">
            {filteredBills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onSelect={handleSelectBill}
                onMarkPaid={handleMarkPaid}
                onEdit={handleEditBill}
                onDelete={handleDeleteBill}
              />
            ))}
          </div>
        </div>
      )}

      {/* Detail Slide-in Drawer */}
      <BillDetailDrawer
        isOpen={Boolean(selectedDetailBill)}
        bill={selectedDetailBill}
        onClose={() => setSelectedDetailBill(null)}
        onMarkPaid={handleMarkPaid}
        onEdit={handleEditBill}
        onDelete={handleDeleteBill}
      />

      {/* Add / Edit Bill Modal */}
      <AddEditBillModal
        isOpen={isAddEditOpen}
        initialBill={billToEdit}
        onClose={() => {
          setIsAddEditOpen(false);
          setBillToEdit(null);
        }}
        onSuccess={handleMutationSuccess}
      />

      {/* Record Payment / Mark Paid Modal */}
      <MarkBillPaidModal
        isOpen={isMarkPaidOpen}
        bill={billToPay}
        onClose={() => {
          setIsMarkPaidOpen(false);
          setBillToPay(null);
        }}
        onSuccess={handleMutationSuccess}
      />

      {/* Delete Confirmation Modal */}
      <DeleteBillModal
        isOpen={isDeleteOpen}
        bill={billToDelete}
        onClose={() => {
          setIsDeleteOpen(false);
          setBillToDelete(null);
        }}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
};

export default BillsWorkspace;
