import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Wallet,
  Smartphone,
  PieChart,
  LayoutList,
  Table as TableIcon,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingStore } from '../../stores/useSettingStore';
import { SmsSyncManager } from '../../services/sms/smsSyncManager';
import { SmsDebugModal } from '../../components/sms/SmsDebugModal';

// Subcomponents
import { FinanceHeader } from './components/FinanceHeader';
import { FinanceSummary } from './components/FinanceSummary';
import { TransactionSearch } from './components/TransactionSearch';
import { TransactionFilters, FilterState } from './components/TransactionFilters';
import { TransactionTable } from './components/TransactionTable';
import { TransactionCard } from './components/TransactionCard';
import { TransactionItem } from './components/TransactionRow';
import { TransactionDetailDrawer } from './components/TransactionDetailDrawer';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { EditTransactionModal } from './components/EditTransactionModal';
import { FinanceEmptyState } from './components/FinanceEmptyState';
import { FinanceSkeleton } from './components/FinanceSkeleton';
import { FinanceErrorState } from './components/FinanceErrorState';
import { AddExpenseModal } from '../../components/common/AddExpenseModal';
import { AddIncomeModal } from '../../components/common/AddIncomeModal';

type TabType = 'all' | 'expenses' | 'income' | 'sms' | 'categories';

export const FinanceWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { household } = useAuthStore();
  const { timeZone, reducedMotion, compactMode } = useSettingStore();

  // Active Tab from URL
  const activeTab: TabType = useMemo(() => {
    const t = searchParams.get('tab');
    if (t === 'expenses' || t === 'income' || t === 'sms' || t === 'categories') {
      return t;
    }
    return 'all';
  }, [searchParams]);

  // Initial Filters from URL
  const initialPeriod = searchParams.get('date') === 'today' ? 'today' : searchParams.get('period') || 'this-month';
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialType = searchParams.get('type') || (activeTab === 'expenses' ? 'DEBIT' : activeTab === 'income' ? 'CREDIT' : 'ALL');
  const initialSearch = searchParams.get('search') || '';

  const [filters, setFilters] = useState<FilterState>({
    period: initialPeriod,
    type: initialType,
    source: activeTab === 'sms' ? 'SMS' : 'ALL',
    category: initialCategory,
    status: 'ALL',
    search: initialSearch,
  });

  // Debounced search text
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // View mode preference (Table on desktop, Cards on mobile by default)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    return window.innerWidth < 768 ? 'cards' : 'table';
  });

  // Modals & Drawer State
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionItem | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<TransactionItem | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);

  // SMS Scanning State
  const [isScanningSms, setIsScanningSms] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Data Loading State
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync URL search params
  const updateUrlParams = useCallback(
    (newTab?: string, newFilters?: Partial<FilterState>) => {
      const params = new URLSearchParams(searchParams);
      if (newTab) {
        if (newTab === 'all') params.delete('tab');
        else params.set('tab', newTab);
      }
      if (newFilters) {
        if (newFilters.period && newFilters.period !== 'this-month') params.set('period', newFilters.period);
        else params.delete('period');

        if (newFilters.category && newFilters.category !== 'ALL') params.set('category', newFilters.category);
        else params.delete('category');

        if (newFilters.type && newFilters.type !== 'ALL') params.set('type', newFilters.type);
        else params.delete('type');

        if (newFilters.search) params.set('search', newFilters.search);
        else params.delete('search');
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Tab change handler
  const handleTabChange = (tab: TabType) => {
    let nextType = 'ALL';
    let nextSource = 'ALL';

    if (tab === 'expenses') nextType = 'DEBIT';
    else if (tab === 'income') nextType = 'CREDIT';
    else if (tab === 'sms') nextSource = 'SMS';

    setFilters((prev) => ({
      ...prev,
      type: nextType,
      source: nextSource,
    }));
    updateUrlParams(tab, { type: nextType });
  };

  // Calculate Date bounds for Period filter
  const dateRange = useMemo(() => {
    const now = new Date();
    if (filters.period === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (filters.period === 'this-month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (filters.period === 'last-month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (filters.period === '30d') {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    if (filters.period === '90d') {
      const start = new Date();
      start.setDate(start.getDate() - 90);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    return {};
  }, [filters.period]);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    if (!household?.id) return;
    try {
      setIsLoading(true);
      setIsError(false);

      const params: any = {
        limit: 100,
        search: debouncedSearch.trim() || undefined,
        type: filters.type !== 'ALL' ? filters.type : undefined,
        source: filters.source !== 'ALL' ? filters.source : undefined,
        category: filters.category !== 'ALL' ? filters.category : undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        ...dateRange,
      };

      const [txRes, statsRes] = await Promise.all([
        apiClient.get('/transactions', { params }),
        apiClient.get('/transactions/stats'),
      ]);

      const fetchedTx = txRes.data?.transactions || [];
      setTransactions(fetchedTx);
      setTotalCount(txRes.data?.total || fetchedTx.length);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [household?.id, debouncedSearch, filters.type, filters.source, filters.category, filters.status, dateRange]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Extract distinct category list
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    if (stats?.categoryBreakdown) {
      stats.categoryBreakdown.forEach((item: any) => {
        if (item.category) set.add(item.category);
      });
    }
    transactions.forEach((tx) => {
      if (tx.category) set.add(tx.category);
    });
    // Add standard categories
    ['Groceries', 'Dining & Food', 'Utilities', 'Shopping', 'Transport', 'Home & Maintenance', 'Health & Medicine', 'Entertainment', 'Salary', 'Freelance'].forEach((c) => set.add(c));
    return Array.from(set).sort();
  }, [stats, transactions]);

  // Row selection for drawer
  const handleSelectTransaction = (tx: TransactionItem) => {
    setSelectedTransaction(tx);
    setIsDetailDrawerOpen(true);
  };

  // Confirm SMS Transaction
  const handleConfirmTransaction = async (tx: TransactionItem) => {
    try {
      await apiClient.put(`/transactions/${tx.id}`, { status: 'CONFIRMED' });
      fetchTransactions();
      if (selectedTransaction?.id === tx.id) {
        setSelectedTransaction((prev) => (prev ? { ...prev, status: 'CONFIRMED' } : null));
      }
    } catch (e) {
      console.error('Failed to confirm transaction', e);
    }
  };

  // Ignore SMS Transaction
  const handleIgnoreTransaction = async (tx: TransactionItem) => {
    try {
      await apiClient.put(`/transactions/${tx.id}`, { status: 'IGNORED' });
      fetchTransactions();
      setIsDetailDrawerOpen(false);
    } catch (e) {
      console.error('Failed to ignore transaction', e);
    }
  };

  // Quick Category Change
  const handleChangeCategory = async (tx: TransactionItem, newCategory: string) => {
    try {
      await apiClient.put(`/transactions/${tx.id}`, { category: newCategory });
      fetchTransactions();
      if (selectedTransaction?.id === tx.id) {
        setSelectedTransaction((prev) => (prev ? { ...prev, category: newCategory } : null));
      }
    } catch (e) {
      console.error('Failed to change category', e);
    }
  };

  // Delete Transaction
  const handleConfirmDelete = async (tx: TransactionItem) => {
    try {
      setIsDeleting(true);
      await apiClient.delete(`/transactions/${tx.id}`);
      setTransactionToDelete(null);
      setIsDetailDrawerOpen(false);
      fetchTransactions();
    } catch (e) {
      console.error('Failed to delete transaction', e);
      alert('Unable to delete transaction. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save Edit Transaction
  const handleSaveEdit = async (
    id: string,
    updates: { merchant?: string; category?: string; amount?: number; occurredAt?: string }
  ) => {
    await apiClient.put(`/transactions/${id}`, updates);
    fetchTransactions();
    if (selectedTransaction?.id === id) {
      setSelectedTransaction((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  // Trigger SMS scan on Android / Web
  const handleTriggerScan = async () => {
    setIsScanningSms(true);
    setScanMessage(null);
    try {
      const result = await SmsSyncManager.scanAndSync();
      await fetchTransactions();
      setScanMessage(
        `Sync complete: ${result.detected} detected, ${result.imported} imported, ${result.duplicates} duplicates.`
      );
      setTimeout(() => setScanMessage(null), 5000);
    } catch (err: any) {
      setScanMessage(`Scan error: ${err.message || 'Unable to scan inbox'}`);
    } finally {
      setIsScanningSms(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      period: 'this-month',
      type: 'ALL',
      source: 'ALL',
      category: 'ALL',
      status: 'ALL',
      search: '',
    });
    updateUrlParams('all', { period: 'this-month', type: 'ALL', category: 'ALL', search: '' });
  };

  return (
    <div className={`space-y-5 animate-in fade-in duration-200 ${compactMode ? 'compact-density' : ''}`}>
      {/* 1. Header */}
      <FinanceHeader
        onAddExpense={() => setIsAddExpenseOpen(true)}
        onAddIncome={() => setIsAddIncomeOpen(true)}
        isScanningSms={isScanningSms}
        onScanSms={handleTriggerScan}
        onOpenDebugger={() => setIsDebugModalOpen(true)}
        showSmsControls={activeTab === 'sms'}
      />

      {/* SMS Scan notification toast if present */}
      {scanMessage && (
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-between">
          <span>{scanMessage}</span>
          <button type="button" onClick={() => setScanMessage(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Financial Summary Strip */}
      <FinanceSummary
        thisMonthSpent={stats?.thisMonthSpent || 0}
        thisMonthIncome={stats?.thisMonthIncome || 0}
        netCashFlow={stats?.netCashFlow || 0}
        transactionsCount={stats?.totalCount || totalCount}
        needsReviewCount={stats?.needsReviewCount || 0}
        largestExpense={stats?.largestExpense}
        isLoading={isLoading && !stats}
      />

      {/* 3. Navigation Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/20 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-secondary hover:text-primary hover:bg-surface-elevated'
            }`}
          >
            All Activity ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('expenses')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-secondary hover:text-primary hover:bg-surface-elevated'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Expenses</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('income')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-secondary hover:text-primary hover:bg-surface-elevated'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Income</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('sms')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sms'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-secondary hover:text-primary hover:bg-surface-elevated'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Bank & UPI SMS</span>
            {stats?.needsReviewCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-mono font-extrabold">
                {stats.needsReviewCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('categories')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-secondary hover:text-primary hover:bg-surface-elevated'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Categories</span>
          </button>
        </div>

        {/* View Toggle (Table / Cards) */}
        <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-primary/20 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-panel text-primary shadow-xs'
                : 'text-muted hover:text-primary'
            }`}
            title="Table View"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'cards'
                ? 'bg-panel text-primary shadow-xs'
                : 'text-muted hover:text-primary'
            }`}
            title="Card View"
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Category Breakdown Section (Interactive) */}
      {(activeTab === 'all' || activeTab === 'categories' || activeTab === 'expenses') && (
        <CategoryBreakdown
          categories={stats?.categoryBreakdown || []}
          selectedCategory={filters.category}
          onSelectCategory={(cat) => {
            setFilters((prev) => ({ ...prev, category: cat }));
            updateUrlParams(undefined, { category: cat });
          }}
          isLoading={isLoading && !stats}
        />
      )}

      {/* 5. Search & Filters Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border-primary/60 space-y-3.5 shadow-sm">
        <TransactionSearch
          value={filters.search}
          onChange={(search) => {
            setFilters((prev) => ({ ...prev, search }));
            updateUrlParams(undefined, { search });
          }}
        />

        <TransactionFilters
          filters={filters}
          onChange={(partial) => {
            setFilters((prev) => ({ ...prev, ...partial }));
            updateUrlParams(undefined, partial);
          }}
          onReset={handleResetFilters}
          availableCategories={availableCategories}
          totalResults={totalCount}
        />
      </div>

      {/* 6. Main Transaction Content Area */}
      {isLoading ? (
        <FinanceSkeleton />
      ) : isError ? (
        <FinanceErrorState onRetry={fetchTransactions} />
      ) : transactions.length === 0 ? (
        <FinanceEmptyState
          isFiltered={
            filters.period !== 'this-month' ||
            filters.type !== 'ALL' ||
            filters.source !== 'ALL' ||
            filters.category !== 'ALL' ||
            filters.status !== 'ALL' ||
            Boolean(filters.search)
          }
          onClearFilters={handleResetFilters}
          onAddExpense={() => setIsAddExpenseOpen(true)}
          onAddIncome={() => setIsAddIncomeOpen(true)}
          onScanSms={activeTab === 'sms' ? handleTriggerScan : undefined}
        />
      ) : viewMode === 'table' ? (
        <TransactionTable
          transactions={transactions}
          onSelectTransaction={handleSelectTransaction}
          timeZone={timeZone}
        />
      ) : (
        <div className="space-y-2.5">
          {transactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              onSelect={handleSelectTransaction}
              timeZone={timeZone}
            />
          ))}
        </div>
      )}

      {/* 7. Slide-in Detail Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTransaction}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        onEdit={(tx) => {
          setTransactionToEdit(tx);
        }}
        onDelete={(tx) => {
          setTransactionToDelete(tx);
        }}
        onConfirm={handleConfirmTransaction}
        onIgnore={handleIgnoreTransaction}
        onChangeCategory={handleChangeCategory}
        timeZone={timeZone}
        reducedMotion={reducedMotion}
      />

      {/* 8. Modals */}
      <EditTransactionModal
        isOpen={Boolean(transactionToEdit)}
        transaction={transactionToEdit}
        onClose={() => setTransactionToEdit(null)}
        onSave={handleSaveEdit}
        availableCategories={availableCategories}
      />

      <DeleteConfirmModal
        isOpen={Boolean(transactionToDelete)}
        transaction={transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={() => {
          fetchTransactions();
        }}
      />

      <AddIncomeModal
        isOpen={isAddIncomeOpen}
        onClose={() => setIsAddIncomeOpen(false)}
        onSuccess={() => {
          fetchTransactions();
        }}
      />

      <SmsDebugModal
        isOpen={isDebugModalOpen}
        onClose={() => setIsDebugModalOpen(false)}
      />
    </div>
  );
};
