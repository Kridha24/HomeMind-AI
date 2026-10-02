import React from 'react';
import {
  Zap,
  Droplet,
  Wifi,
  Flame,
  Home,
  Smartphone,
  Wrench,
  Shield,
  RefreshCw,
  FileText,
  CreditCard,
  Building,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Bill } from '../../../types';

/**
 * Format Indian Rupee currency safely without float drift.
 */
export function formatINR(amount: number): string {
  const safeNum = Math.abs(Number(amount) || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: safeNum % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(safeNum);
}

/**
 * Return category visual metadata (Lucide icon, accent colors).
 */
export function getCategoryVisuals(category: string = ''): {
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  const norm = category.toLowerCase().trim();

  if (norm.includes('rent') || norm.includes('house') || norm.includes('flat')) {
    return {
      icon: Home,
      bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      borderClass: 'border-emerald-500/25',
    };
  }

  if (norm.includes('electric') || norm.includes('power') || norm.includes('bescom')) {
    return {
      icon: Zap,
      bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
      textClass: 'text-amber-600 dark:text-amber-400',
      borderClass: 'border-amber-500/25',
    };
  }

  if (norm.includes('water')) {
    return {
      icon: Droplet,
      bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/15',
      textClass: 'text-cyan-600 dark:text-cyan-400',
      borderClass: 'border-cyan-500/25',
    };
  }

  if (norm.includes('internet') || norm.includes('wifi') || norm.includes('broadband') || norm.includes('fiber')) {
    return {
      icon: Wifi,
      bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      textClass: 'text-indigo-600 dark:text-indigo-400',
      borderClass: 'border-indigo-500/25',
    };
  }

  if (norm.includes('gas') || norm.includes('fuel') || norm.includes('lpg')) {
    return {
      icon: Flame,
      bgClass: 'bg-orange-500/10 dark:bg-orange-500/15',
      textClass: 'text-orange-600 dark:text-orange-400',
      borderClass: 'border-orange-500/25',
    };
  }

  if (norm.includes('phone') || norm.includes('mobile') || norm.includes('recharge')) {
    return {
      icon: Smartphone,
      bgClass: 'bg-blue-500/10 dark:bg-blue-500/15',
      textClass: 'text-blue-600 dark:text-blue-400',
      borderClass: 'border-blue-500/25',
    };
  }

  if (norm.includes('maintenance') || norm.includes('repair')) {
    return {
      icon: Wrench,
      bgClass: 'bg-slate-500/10 dark:bg-slate-500/15',
      textClass: 'text-slate-600 dark:text-slate-400',
      borderClass: 'border-slate-500/25',
    };
  }

  if (norm.includes('sub') || norm.includes('netflix') || norm.includes('spotify') || norm.includes('prime')) {
    return {
      icon: RefreshCw,
      bgClass: 'bg-purple-500/10 dark:bg-purple-500/15',
      textClass: 'text-purple-600 dark:text-purple-400',
      borderClass: 'border-purple-500/25',
    };
  }

  if (norm.includes('insurance')) {
    return {
      icon: Shield,
      bgClass: 'bg-rose-500/10 dark:bg-rose-500/15',
      textClass: 'text-rose-600 dark:text-rose-400',
      borderClass: 'border-rose-500/25',
    };
  }

  if (norm.includes('education') || norm.includes('school') || norm.includes('tuition')) {
    return {
      icon: GraduationCap,
      bgClass: 'bg-teal-500/10 dark:bg-teal-500/15',
      textClass: 'text-teal-600 dark:text-teal-400',
      borderClass: 'border-teal-500/25',
    };
  }

  return {
    icon: FileText,
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/25',
  };
}

/**
 * Clean CSV export for Bills.
 */
export function exportBillsToCSV(bills: Bill[]): void {
  const headers = ['Title', 'Category', 'Provider', 'Amount (INR)', 'Due Date', 'Status', 'Paid At', 'Notes'];
  const rows = bills.map((b) => [
    `"${(b.title || '').replace(/"/g, '""')}"`,
    `"${(b.category || '').replace(/"/g, '""')}"`,
    `"${(b.provider || '').replace(/"/g, '""')}"`,
    b.amount,
    b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : '',
    b.status,
    b.paidAt ? new Date(b.paidAt).toISOString().split('T')[0] : '',
    `"${(b.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `homemind_bills_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
