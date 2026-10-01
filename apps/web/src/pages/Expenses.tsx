import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  TrendingUp,
  Tag,
  Trash2,
  Edit3,
  MessageSquare,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Terminal,
  Filter
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { Expense } from '../types';
import { useSettingStore } from '../stores/useSettingStore';
import { EmptyState } from '../components/common/EmptyState';
import { AddExpenseModal } from '../components/common/AddExpenseModal';
import { DetectedTransactionCard } from '../components/sms/DetectedTransactionCard';
import { SmsDebugModal } from '../components/sms/SmsDebugModal';
import { SmsSyncManager } from '../services/sms/smsSyncManager';
import { StoredTransaction } from '../services/sms/types';

export const Expenses: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'sms' ? 'sms' : 'expenses';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // SMS Transactions state
  const [smsTransactions, setSmsTransactions] = useState<StoredTransaction[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsFilter, setSmsFilter] = useState<'ALL' | 'NEEDS_REVIEW' | 'CONFIRMED'>('ALL');
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const { format, currencySymbol } = useSettingStore();

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/expenses');
      const list = Array.isArray(res.data) ? res.data : res.data?.expenses || [];
      setExpenses(list);
    } catch (e) {
      console.error(e);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmsTransactions = async () => {
    try {
      setSmsLoading(true);
      const res = await apiClient.get('/transactions');
      setSmsTransactions(res.data?.transactions || []);
    } catch (e) {
      console.error('Failed to load detected transactions:', e);
      setSmsTransactions([]);
    } finally {
      setSmsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchSmsTransactions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await apiClient.delete(`/expenses/${id}`);
      fetchExpenses();
      fetchSmsTransactions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingExpense(null);
    setShowModal(true);
  };

  // Detected SMS Actions
  const handleConfirmDetected = async (tx: StoredTransaction) => {
    try {
      await apiClient.put(`/transactions/${tx.id}`, { status: 'CONFIRMED' });
      await fetchSmsTransactions();
      await fetchExpenses();
    } catch (e) {
      console.error('Failed to confirm transaction:', e);
    }
  };

  const handleUpdateDetected = async (
    tx: StoredTransaction,
    updates: { merchant?: string; category?: string; status?: string }
  ) => {
    try {
      await apiClient.put(`/transactions/${tx.id}`, updates);
      await fetchSmsTransactions();
      await fetchExpenses();
    } catch (e) {
      console.error('Failed to update detected transaction:', e);
    }
  };

  const handleDeleteDetected = async (tx: StoredTransaction) => {
    if (!confirm('Are you sure you want to delete this detected transaction?')) return;
    try {
      await apiClient.delete(`/transactions/${tx.id}`);
      await fetchSmsTransactions();
      await fetchExpenses();
    } catch (e) {
      console.error('Failed to delete transaction:', e);
    }
  };

  const handleIgnoreDetected = async (tx: StoredTransaction) => {
    try {
      await apiClient.put(`/transactions/${tx.id}`, { status: 'IGNORED' });
      await fetchSmsTransactions();
      await fetchExpenses();
    } catch (e) {
      console.error('Failed to ignore transaction:', e);
    }
  };

  const handleTriggerScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const result = await SmsSyncManager.scanAndSync();
      await fetchSmsTransactions();
      await fetchExpenses();
      setScanMessage(
        `Scanned inbox: ${result.detected} detected, ${result.imported} imported, ${result.duplicates} duplicates.`
      );
      setTimeout(() => setScanMessage(null), 5000);
    } catch (err: any) {
      setScanMessage(`Scan error: ${err.message || 'Unable to scan inbox'}`);
    } finally {
      setIsScanning(false);
    }
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const needsReviewCount = smsTransactions.filter((t) => t.status === 'NEEDS_REVIEW').length;

  const filteredSmsTransactions = smsTransactions.filter((tx) => {
    if (smsFilter === 'NEEDS_REVIEW') return tx.status === 'NEEDS_REVIEW';
    if (smsFilter === 'CONFIRMED') return tx.status === 'CONFIRMED';
    return tx.status !== 'IGNORED';
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Household Expense Ledger
          </h1>
          <p className="text-xs text-secondary">
            Track and manage every household transaction & automatically detect bank and UPI SMS
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-md shadow-blue-600/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 border-red-500/30 bg-red-50/50 dark:bg-gradient-to-tr dark:from-slate-900 dark:via-red-950/20 dark:to-slate-900 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider block">
              Total Logged Spend
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 font-mono mt-1 block">
              -{format(totalSpent)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 border-primary/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider block">
              Total Transactions
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-primary font-mono mt-1 block">
              {expenses.length} Records
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setSearchParams({ tab: 'sms' })}
          className="glass-panel p-5 border-primary/80 hover:border-blue-500/50 cursor-pointer flex items-center justify-between shadow-sm transition-all"
        >
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider block">
              Auto-Detected SMS
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary font-mono block">
                {smsTransactions.length}
              </span>
              {needsReviewCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  {needsReviewCount} review
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Needs Review Alert Banner */}
      {needsReviewCount > 0 && currentTab !== 'sms' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {needsReviewCount} detected bank/UPI transaction{needsReviewCount > 1 ? 's' : ''} require your review
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'sms' })}
            className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 self-start sm:self-auto transition-all"
          >
            Review Detected
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center justify-between gap-2 border-b border-primary/20 pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'expenses' })}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              currentTab === 'expenses'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-secondary hover:text-primary hover:bg-surface-elevated'
            }`}
          >
            All Expenses ({expenses.length})
          </button>

          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'sms' })}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              currentTab === 'sms'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-secondary hover:text-primary hover:bg-surface-elevated'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Detected SMS & UPI ({smsTransactions.length})</span>
            {needsReviewCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-mono font-extrabold">
                {needsReviewCount}
              </span>
            )}
          </button>
        </div>

        {currentTab === 'sms' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isScanning}
              onClick={handleTriggerScan}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-surface-elevated border border-primary/20 text-primary hover:border-blue-500/40 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Scan Inbox</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDebugModalOpen(true)}
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-dashed border-amber-500/40 text-amber-500 hover:bg-amber-500/10 transition-colors"
              title="Open Parser Debugger"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Debugger</span>
            </button>
          </div>
        )}
      </div>

      {scanMessage && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
          {scanMessage}
        </div>
      )}

      {/* TAB 1: ALL EXPENSES TABLE */}
      {currentTab === 'expenses' && (
        <>
          {loading ? (
            <div className="text-center py-12 text-xs text-muted">Loading household expenses from database...</div>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No expenses added yet"
              description="Start tracking your household outlays, grocery purchases, and bill receipts in your dynamic ledger."
              actionLabel="+ Add Expense"
              onAction={handleAddNew}
            />
          ) : (
            <div className="glass-panel border-primary/80 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-primary/80 font-bold text-sm text-primary flex items-center justify-between bg-secondary/30">
                <span>Expenses List</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold">
                  {expenses.length} Entries
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/60 border-b border-primary/80 text-secondary uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Title</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5 text-right">Amount ({currencySymbol})</th>
                      <th className="px-6 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-secondary font-medium">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-primary flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-blue-500" />
                          {expense.title}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400 uppercase tracking-wider">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted font-mono text-[11px]">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-right text-red-600 dark:text-red-400">
                          -{format(expense.amount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="p-1.5 text-secondary hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Edit Expense"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="p-1.5 text-secondary hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: DETECTED BANK / UPI SMS TRANSACTIONS */}
      {currentTab === 'sms' && (
        <div className="space-y-4">
          {/* Sub-filter chips */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSmsFilter('ALL')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                smsFilter === 'ALL'
                  ? 'bg-primary text-background border-transparent font-bold'
                  : 'bg-surface-elevated text-secondary border-primary/15'
              }`}
            >
              All Detected ({smsTransactions.length})
            </button>

            <button
              type="button"
              onClick={() => setSmsFilter('NEEDS_REVIEW')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                smsFilter === 'NEEDS_REVIEW'
                  ? 'bg-amber-500 text-slate-950 border-transparent font-bold'
                  : 'bg-surface-elevated text-secondary border-primary/15'
              }`}
            >
              <span>Needs Review</span>
              <span className="text-[10px] font-bold px-1.5 rounded-full bg-amber-400/30">
                {needsReviewCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSmsFilter('CONFIRMED')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                smsFilter === 'CONFIRMED'
                  ? 'bg-green-600 text-white border-transparent font-bold'
                  : 'bg-surface-elevated text-secondary border-primary/15'
              }`}
            >
              Auto-Imported ({smsTransactions.filter((t) => t.status === 'CONFIRMED').length})
            </button>
          </div>

          {/* List of Detected Transaction Cards */}
          {smsLoading ? (
            <div className="text-center py-12 text-xs text-muted">
              Loading detected bank SMS transactions...
            </div>
          ) : filteredSmsTransactions.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title={
                smsFilter === 'NEEDS_REVIEW'
                  ? 'No transactions need review'
                  : 'No bank SMS transactions detected yet'
              }
              description="Enable Automatic Transaction Tracking in Settings or use the Debugger below to test sample bank & UPI SMS."
              actionLabel="Open SMS Debugger"
              onAction={() => setIsDebugModalOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {filteredSmsTransactions.map((tx) => (
                <DetectedTransactionCard
                  key={tx.id}
                  transaction={tx}
                  onConfirm={handleConfirmDetected}
                  onUpdate={handleUpdateDetected}
                  onDelete={handleDeleteDetected}
                  onIgnore={handleIgnoreDetected}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={showModal}
        initialData={editingExpense}
        onClose={() => {
          setShowModal(false);
          setEditingExpense(null);
        }}
        onSuccess={() => {
          fetchExpenses();
          fetchSmsTransactions();
        }}
      />

      {/* SMS Parser Debugger Modal */}
      <SmsDebugModal
        isOpen={isDebugModalOpen}
        onClose={() => setIsDebugModalOpen(false)}
        onTransactionImported={() => {
          fetchExpenses();
          fetchSmsTransactions();
        }}
      />
    </div>
  );
};

export default Expenses;
