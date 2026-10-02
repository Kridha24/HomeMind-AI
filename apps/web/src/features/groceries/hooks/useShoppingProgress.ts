import { useMemo } from 'react';
import { GroceryItem } from '../../../types';
import { getGroceryUrgency } from '../utils/groceryFormatters';

export interface ShoppingMetrics {
  totalItems: number;
  needToBuyCount: number;
  purchasedCount: number;
  urgentCount: number;
  lowStockCount: number;
  progressPercent: number;
  isShoppingComplete: boolean;
  categoryStats: Record<string, { total: number; needToBuy: number; purchased: number }>;
}

export function useShoppingProgress(items: GroceryItem[]): ShoppingMetrics {
  return useMemo(() => {
    const totalItems = items.length;
    let needToBuyCount = 0;
    let purchasedCount = 0;
    let urgentCount = 0;
    let lowStockCount = 0;
    const categoryStats: Record<string, { total: number; needToBuy: number; purchased: number }> = {};

    for (const item of items) {
      const isPurchased = Boolean(item.purchaseDate);
      const cat = item.category || 'Other';

      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, needToBuy: 0, purchased: 0 };
      }
      categoryStats[cat].total += 1;

      if (isPurchased) {
        purchasedCount += 1;
        categoryStats[cat].purchased += 1;
      } else {
        needToBuyCount += 1;
        categoryStats[cat].needToBuy += 1;

        const urgency = getGroceryUrgency(item);
        if (urgency === 'URGENT') {
          urgentCount += 1;
        } else if (urgency === 'LOW_STOCK') {
          lowStockCount += 1;
        }
      }
    }

    const progressPercent = totalItems > 0 ? Math.round((purchasedCount / totalItems) * 100) : 0;
    const isShoppingComplete = totalItems > 0 && needToBuyCount === 0;

    return {
      totalItems,
      needToBuyCount,
      purchasedCount,
      urgentCount,
      lowStockCount,
      progressPercent,
      isShoppingComplete,
      categoryStats,
    };
  }, [items]);
}
