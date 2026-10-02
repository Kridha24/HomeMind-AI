import React from 'react';
import {
  Utensils,
  ShoppingBag,
  Home,
  Car,
  Receipt,
  HeartPulse,
  Film,
  GraduationCap,
  Wrench,
  Smartphone,
  Wallet,
  Briefcase,
  Gift,
  DollarSign,
  CircleDot,
  CreditCard,
  Building2,
  Tv,
  PiggyBank,
  TrendingUp,
  Tag,
} from 'lucide-react';

/**
 * Format amount into Indian Rupee format (e.g., ₹47,000.00 or ₹4,200)
 */
export function formatINR(amount: number | string | null | undefined, showDecimals: boolean = true): string {
  const num = Number(amount);
  if (isNaN(num)) return '₹0';

  const parts = Math.abs(num).toFixed(showDecimals ? 2 : 0).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian numbering system: 3 digits from right, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const result = showDecimals && decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  return num < 0 ? `-₹${result}` : `₹${result}`;
}

/**
 * Format Date relative or localized (Today, Yesterday, or 02 Oct 2026)
 */
export function formatFinanceDate(dateString: string | Date | undefined, timeZone?: string): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: timeZone || undefined,
  });
}

/**
 * Format Full Timestamp (02 Oct 2026, 09:42 PM)
 */
export function formatFinanceTimestamp(dateString: string | Date | undefined, timeZone?: string): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timeZone || undefined,
  });
}

/**
 * Category Icon Resolver using real Lucide icons
 */
export function getCategoryIcon(category?: string | null): React.ElementType {
  const cat = (category || '').toLowerCase().trim();

  if (cat.includes('food') || cat.includes('grocer') || cat.includes('dining') || cat.includes('restaurant')) {
    return Utensils;
  }
  if (cat.includes('shop') || cat.includes('cloth') || cat.includes('e-commerce') || cat.includes('amazon') || cat.includes('flipkart')) {
    return ShoppingBag;
  }
  if (cat.includes('rent') || cat.includes('mortgage') || cat.includes('house') || cat.includes('home')) {
    return Home;
  }
  if (cat.includes('travel') || cat.includes('transport') || cat.includes('fuel') || cat.includes('uber') || cat.includes('ola') || cat.includes('cab')) {
    return Car;
  }
  if (cat.includes('bill') || cat.includes('utilit') || cat.includes('electr') || cat.includes('water') || cat.includes('gas') || cat.includes('wifi') || cat.includes('broadband')) {
    return Receipt;
  }
  if (cat.includes('health') || cat.includes('medic') || cat.includes('doctor') || cat.includes('pharma') || cat.includes('hospital')) {
    return HeartPulse;
  }
  if (cat.includes('entertain') || cat.includes('movie') || cat.includes('game') || cat.includes('ott') || cat.includes('netflix') || cat.includes('spotify')) {
    return Film;
  }
  if (cat.includes('subscript') || cat.includes('software') || cat.includes('app') || cat.includes('recharge')) {
    return Smartphone;
  }
  if (cat.includes('educat') || cat.includes('course') || cat.includes('book') || cat.includes('tuition')) {
    return GraduationCap;
  }
  if (cat.includes('maintain') || cat.includes('repair') || cat.includes('service')) {
    return Wrench;
  }
  if (cat.includes('salary') || cat.includes('wages') || cat.includes('paycheck')) {
    return Briefcase;
  }
  if (cat.includes('freelance') || cat.includes('consult')) {
    return Wallet;
  }
  if (cat.includes('invest') || cat.includes('dividend') || cat.includes('mutual') || cat.includes('stock')) {
    return TrendingUp;
  }
  if (cat.includes('gift') || cat.includes('cashback') || cat.includes('reward')) {
    return Gift;
  }
  if (cat.includes('saving') || cat.includes('deposit')) {
    return PiggyBank;
  }

  return Tag;
}

/**
 * Category color scheme for badges
 */
export function getCategoryColor(category?: string | null): { bg: string; text: string; border: string } {
  const cat = (category || '').toLowerCase().trim();

  if (cat.includes('food') || cat.includes('grocer') || cat.includes('dining')) {
    return {
      bg: 'bg-orange-500/10 dark:bg-orange-500/20',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-500/25',
    };
  }
  if (cat.includes('shop')) {
    return {
      bg: 'bg-pink-500/10 dark:bg-pink-500/20',
      text: 'text-pink-700 dark:text-pink-400',
      border: 'border-pink-500/25',
    };
  }
  if (cat.includes('rent') || cat.includes('home')) {
    return {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      text: 'text-indigo-700 dark:text-indigo-400',
      border: 'border-indigo-500/25',
    };
  }
  if (cat.includes('travel') || cat.includes('transport') || cat.includes('fuel')) {
    return {
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      text: 'text-cyan-700 dark:text-cyan-400',
      border: 'border-cyan-500/25',
    };
  }
  if (cat.includes('bill') || cat.includes('utilit')) {
    return {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/25',
    };
  }
  if (cat.includes('health') || cat.includes('medic')) {
    return {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-500/25',
    };
  }
  if (cat.includes('salary') || cat.includes('invest') || cat.includes('income')) {
    return {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/25',
    };
  }

  return {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-500/25',
  };
}
