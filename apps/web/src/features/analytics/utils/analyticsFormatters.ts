/**
 * Safe numeric formatters for HomeMind Household Intelligence Analytics
 */

export function safeNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

export function formatINR(val: any, showDecimal = false): string {
  if (val === null || val === undefined) return '₹0';
  const num = Number(val);
  if (!Number.isFinite(num)) return '₹0';

  const isNegative = num < 0;
  const absVal = Math.abs(num);

  const formatted = absVal.toLocaleString('en-IN', {
    maximumFractionDigits: showDecimal ? 2 : 0,
    minimumFractionDigits: showDecimal ? 2 : 0,
  });

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatPercentage(val: any, fallback = '0%'): string {
  if (val === null || val === undefined) return fallback;
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return `${num}%`;
}

export function formatCount(val: any, singular: string, plural?: string): string {
  const count = safeNumber(val, 0);
  const noun = count === 1 ? singular : plural || `${singular}s`;
  return `${count} ${noun}`;
}
