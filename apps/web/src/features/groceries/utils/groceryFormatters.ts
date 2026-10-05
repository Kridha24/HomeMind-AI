import { GroceryItem } from '../../../types';

export type GroceryUrgency = 'URGENT' | 'LOW_STOCK' | 'IN_STOCK' | 'PURCHASED';

export function getGroceryUrgency(item: GroceryItem): GroceryUrgency {
  if (item.purchaseDate) {
    return 'PURCHASED';
  }

  // If item is completely out of stock or expiring in <= 2 days
  if (item.quantity <= 0) {
    return 'URGENT';
  }

  if (item.expiryDate) {
    const expiry = new Date(item.expiryDate).getTime();
    const now = Date.now();
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    if (diffDays <= 2) {
      return 'URGENT';
    }
  }

  // If quantity is at or below threshold
  if (item.quantity <= item.minThreshold) {
    return 'LOW_STOCK';
  }

  return 'IN_STOCK';
}

export function formatQuantityWithUnit(quantity: number, unit: string): string {
  const formattedQty = Number.isInteger(quantity) ? quantity.toString() : quantity.toFixed(1);
  return `${formattedQty} ${unit}`;
}

export function formatPurchaseTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24 && date.getDate() === now.getDate()) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export function formatExpiryStatus(dateStr?: string | null): { text: string; isUrgent: boolean; isExpired: boolean } | null {
  if (!dateStr) return null;
  const expiry = new Date(dateStr).getTime();
  const now = Date.now();
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Expired ${Math.abs(diffDays)}d ago`, isUrgent: true, isExpired: true };
  } else if (diffDays === 0) {
    return { text: 'Expires today', isUrgent: true, isExpired: false };
  } else if (diffDays === 1) {
    return { text: 'Expires tomorrow', isUrgent: true, isExpired: false };
  } else if (diffDays <= 3) {
    return { text: `Expires in ${diffDays} days`, isUrgent: true, isExpired: false };
  } else {
    return {
      text: `Expires on ${new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
      isUrgent: false,
      isExpired: false,
    };
  }
}

export const GROCERY_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Dairy & Eggs',
  'Grains & Bread',
  'Spices & Oils',
  'Meat & Poultry',
  'Snacks & Beverages',
  'Hygiene & Cleaning',
  'Personal Care',
  'Other',
] as const;

export const GROCERY_UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'pack'] as const;

export function getCategoryColor(category: string): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  const normalized = category.toLowerCase();
  if (normalized.includes('veg') || normalized.includes('produce')) {
    return {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    };
  }
  if (normalized.includes('fruit')) {
    return {
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25',
    };
  }
  if (normalized.includes('dairy') || normalized.includes('milk') || normalized.includes('egg')) {
    return {
      bg: 'bg-sky-500/10 dark:bg-sky-500/15',
      text: 'text-sky-700 dark:text-sky-400',
      border: 'border-sky-500/30',
      badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25',
    };
  }
  if (normalized.includes('bread') || normalized.includes('grain') || normalized.includes('rice') || normalized.includes('bakery')) {
    return {
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/30',
      badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25',
    };
  }
  if (normalized.includes('snack') || normalized.includes('beverage')) {
    return {
      bg: 'bg-violet-500/10 dark:bg-violet-500/15',
      text: 'text-violet-700 dark:text-violet-400',
      border: 'border-violet-500/30',
      badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25',
    };
  }
  if (normalized.includes('personal') || normalized.includes('hygiene') || normalized.includes('care')) {
    return {
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
      text: 'text-cyan-700 dark:text-cyan-400',
      border: 'border-cyan-500/30',
      badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/25',
    };
  }
  if (normalized.includes('house') || normalized.includes('clean') || normalized.includes('kitchen') || normalized.includes('home')) {
    return {
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-500/30',
      badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/25',
    };
  }
  return {
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    text: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-500/30',
    badge: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/25',
  };
}
