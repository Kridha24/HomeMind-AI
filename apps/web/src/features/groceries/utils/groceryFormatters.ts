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
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    };
  }
  if (normalized.includes('fruit')) {
    return {
      bg: 'bg-orange-500/10 dark:bg-orange-500/15',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-500/30',
      badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
    };
  }
  if (normalized.includes('dairy') || normalized.includes('milk') || normalized.includes('egg')) {
    return {
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-500/30',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    };
  }
  if (normalized.includes('bread') || normalized.includes('grain') || normalized.includes('rice') || normalized.includes('bakery')) {
    return {
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/30',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    };
  }
  if (normalized.includes('oil') || normalized.includes('spice')) {
    return {
      bg: 'bg-yellow-500/10 dark:bg-yellow-500/15',
      text: 'text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-500/30',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300',
    };
  }
  if (normalized.includes('clean') || normalized.includes('hygiene')) {
    return {
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
      text: 'text-cyan-700 dark:text-cyan-400',
      border: 'border-cyan-500/30',
      badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300',
    };
  }
  if (normalized.includes('snack') || normalized.includes('beverage')) {
    return {
      bg: 'bg-purple-500/10 dark:bg-purple-500/15',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-500/30',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    };
  }
  return {
    bg: 'bg-slate-500/10 dark:bg-slate-500/15',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-500/30',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  };
}
