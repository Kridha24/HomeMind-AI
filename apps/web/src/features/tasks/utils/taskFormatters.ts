import {
  Sparkles,
  ShoppingBasket,
  Wrench,
  CookingPot,
  ClipboardList,
  CheckSquare,
} from 'lucide-react';
import React from 'react';

export type TaskCategoryType = 'Cleaning' | 'Shopping' | 'Maintenance' | 'Cooking' | 'Bills/Admin' | 'Other';

export interface TaskCategoryInfo {
  name: TaskCategoryType;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

/**
 * Infer category from task title and description
 */
export function inferTaskCategory(title: string, description?: string | null): TaskCategoryInfo {
  const text = `${title} ${description || ''}`.toLowerCase();

  if (
    text.includes('clean') ||
    text.includes('sweep') ||
    text.includes('mop') ||
    text.includes('dust') ||
    text.includes('vacuum') ||
    text.includes('wash') ||
    text.includes('laundry') ||
    text.includes('dishes') ||
    text.includes('trash') ||
    text.includes('garbage')
  ) {
    return { name: 'Cleaning', icon: Sparkles, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' };
  }

  if (
    text.includes('buy') ||
    text.includes('shop') ||
    text.includes('grocery') ||
    text.includes('groceries') ||
    text.includes('market') ||
    text.includes('store') ||
    text.includes('order') ||
    text.includes('cylinder') ||
    text.includes('milk')
  ) {
    return { name: 'Shopping', icon: ShoppingBasket, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
  }

  if (
    text.includes('repair') ||
    text.includes('fix') ||
    text.includes('filter') ||
    text.includes('hvac') ||
    text.includes('plumb') ||
    text.includes('battery') ||
    text.includes('maintain') ||
    text.includes('paint') ||
    text.includes('tool') ||
    text.includes('leak')
  ) {
    return { name: 'Maintenance', icon: Wrench, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
  }

  if (
    text.includes('cook') ||
    text.includes('meal') ||
    text.includes('prep') ||
    text.includes('dinner') ||
    text.includes('lunch') ||
    text.includes('breakfast') ||
    text.includes('bake') ||
    text.includes('recipe')
  ) {
    return { name: 'Cooking', icon: CookingPot, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' };
  }

  if (
    text.includes('bill') ||
    text.includes('pay') ||
    text.includes('rent') ||
    text.includes('utility') ||
    text.includes('electricity') ||
    text.includes('insurance') ||
    text.includes('tax') ||
    text.includes('subscription') ||
    text.includes('form') ||
    text.includes('document')
  ) {
    return { name: 'Bills/Admin', icon: ClipboardList, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
  }

  return { name: 'Other', icon: CheckSquare, color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' };
}

export interface DueDateStatus {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  isThisWeek: boolean;
  daysDifference: number; // negative if overdue, 0 if today, positive if future
}

/**
 * Parse date into calendar year, month, and day components, avoiding UTC off-by-one shifts.
 */
export function parseCalendarDate(input: string | Date): { year: number; month: number; day: number } | null {
  if (typeof input === 'string') {
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10) - 1,
        day: parseInt(match[3], 10),
      };
    }
  }

  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return null;

  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
  };
}

/**
 * Calculate timezone-aware due date label and status.
 * Handles boundary conditions: yesterday, today, tomorrow, month boundary, without UTC shifts.
 */
export function getDueDateStatus(dueDateStr?: string | null, referenceDate: Date = new Date()): DueDateStatus {
  if (!dueDateStr) {
    return {
      label: 'No due date',
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      isThisWeek: false,
      daysDifference: Infinity,
    };
  }

  const target = parseCalendarDate(dueDateStr);
  const ref = parseCalendarDate(referenceDate);

  if (!target || !ref) {
    return {
      label: 'Invalid date',
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      isThisWeek: false,
      daysDifference: Infinity,
    };
  }

  const targetDateOnly = new Date(target.year, target.month, target.day);
  const refDateOnly = new Date(ref.year, ref.month, ref.day);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysDifference = Math.round((targetDateOnly.getTime() - refDateOnly.getTime()) / msPerDay);

  if (daysDifference < 0) {
    const overdueDays = Math.abs(daysDifference);
    return {
      label: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
      isThisWeek: false,
      daysDifference,
    };
  }

  if (daysDifference === 0) {
    return {
      label: 'Due today',
      isOverdue: false,
      isToday: true,
      isTomorrow: false,
      isThisWeek: true,
      daysDifference: 0,
    };
  }

  if (daysDifference === 1) {
    return {
      label: 'Due tomorrow',
      isOverdue: false,
      isToday: false,
      isTomorrow: true,
      isThisWeek: true,
      daysDifference: 1,
    };
  }

  if (daysDifference <= 7) {
    return {
      label: `Due in ${daysDifference} days`,
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      isThisWeek: true,
      daysDifference,
    };
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    label: `Due ${monthNames[target.month]} ${target.day}`,
    isOverdue: false,
    isToday: false,
    isTomorrow: false,
    isThisWeek: false,
    daysDifference,
  };
}

/**
 * Format date for input elements (YYYY-MM-DD)
 */
export function formatDateForInput(date?: string | Date | null): string {
  if (!date) return '';
  const parsed = parseCalendarDate(date);
  if (!parsed) return '';
  const year = parsed.year;
  const month = String(parsed.month + 1).padStart(2, '0');
  const day = String(parsed.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
