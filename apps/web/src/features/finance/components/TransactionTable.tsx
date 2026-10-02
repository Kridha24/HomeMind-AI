import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TransactionRow, TransactionItem } from './TransactionRow';

interface TransactionTableProps {
  transactions: TransactionItem[];
  onSelectTransaction: (tx: TransactionItem) => void;
  sortBy?: 'occurredAt' | 'amount' | 'merchant';
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: 'occurredAt' | 'amount' | 'merchant') => void;
  timeZone?: string;
  className?: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onSelectTransaction,
  sortBy = 'occurredAt',
  sortOrder = 'desc',
  onSortChange,
  timeZone,
  className = '',
}) => {
  const renderSortIndicator = (field: 'occurredAt' | 'amount' | 'merchant') => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 text-muted/60 opacity-0 group-hover/th:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
    );
  };

  return (
    <div className={`glass-panel border-primary/60 rounded-3xl overflow-hidden shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary/40 border-b border-primary/30 text-secondary uppercase font-bold tracking-wider select-none">
            <tr>
              {/* Date Header */}
              <th
                onClick={() => onSortChange?.('occurredAt')}
                className="px-5 py-3.5 cursor-pointer group/th hover:bg-secondary/60 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  {renderSortIndicator('occurredAt')}
                </div>
              </th>

              {/* Merchant / Transaction */}
              <th
                onClick={() => onSortChange?.('merchant')}
                className="px-5 py-3.5 cursor-pointer group/th hover:bg-secondary/60 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Transaction / Merchant</span>
                  {renderSortIndicator('merchant')}
                </div>
              </th>

              <th className="px-5 py-3.5 whitespace-nowrap">Category</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Source</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Type</th>

              {/* Amount Header */}
              <th
                onClick={() => onSortChange?.('amount')}
                className="px-5 py-3.5 text-right cursor-pointer group/th hover:bg-secondary/60 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Amount (INR)</span>
                  {renderSortIndicator('amount')}
                </div>
              </th>

              <th className="px-5 py-3.5 text-center whitespace-nowrap">Status</th>
              <th className="px-4 py-3.5 text-right whitespace-nowrap">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-primary/20 text-secondary font-medium">
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                onSelect={onSelectTransaction}
                timeZone={timeZone}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
