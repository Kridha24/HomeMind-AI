import { Bill } from '../../../types';

export type BillDisplayStatusKey = 'PAID' | 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'UPCOMING';

export interface BillDisplayStatus {
  key: BillDisplayStatusKey;
  label: string;
  badgeClass: string;
  pillClass: string;
  daysDifference: number;
  formattedDueDate: string;
}

/**
 * Centralized bill status derivation.
 * Eliminates UTC edge bugs by comparing calendar day values in the user's local timezone.
 */
export function deriveBillDisplayStatus(bill: Bill, refDate: Date = new Date()): BillDisplayStatus {
  const due = new Date(bill.dueDate);
  const formattedDueDate = due.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: due.getFullYear() !== refDate.getFullYear() ? 'numeric' : undefined,
  });

  if (bill.status === 'PAID') {
    const paidDate = bill.paidAt ? new Date(bill.paidAt) : null;
    const paidLabel = paidDate
      ? `Paid ${paidDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : 'Paid';

    return {
      key: 'PAID',
      label: paidLabel,
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
      daysDifference: 0,
      formattedDueDate,
    };
  }

  // Calculate calendar day differences safely
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const refMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();
  const diffDays = Math.round((dueMidnight - refMidnight) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      key: 'OVERDUE',
      label: `Overdue by ${overdueDays}d`,
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
      pillClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60 font-semibold',
      daysDifference: diffDays,
      formattedDueDate,
    };
  }

  if (diffDays === 0) {
    return {
      key: 'DUE_TODAY',
      label: 'Due today',
      badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30 font-bold',
      pillClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/60 font-bold',
      daysDifference: 0,
      formattedDueDate,
    };
  }

  if (diffDays === 1) {
    return {
      key: 'DUE_SOON',
      label: 'Due tomorrow',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium',
      pillClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
      daysDifference: 1,
      formattedDueDate,
    };
  }

  if (diffDays <= 3) {
    return {
      key: 'DUE_SOON',
      label: `Due in ${diffDays} days`,
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium',
      pillClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
      daysDifference: diffDays,
      formattedDueDate,
    };
  }

  return {
    key: 'UPCOMING',
    label: `Due ${formattedDueDate}`,
    badgeClass: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    pillClass: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700',
    daysDifference: diffDays,
    formattedDueDate,
  };
}

export interface BillSummaryMetrics {
  totalDue: number;
  unpaidCount: number;
  dueThisWeekCount: number;
  dueThisWeekAmount: number;
  overdueCount: number;
  overdueAmount: number;
  paidThisMonthAmount: number;
  paidThisMonthCount: number;
  totalBills: number;
}

/**
 * Calculates genuine summary metrics from actual household bills.
 */
export function calculateBillSummary(bills: Bill[], refDate: Date = new Date()): BillSummaryMetrics {
  const now = refDate;
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let totalDue = 0;
  let unpaidCount = 0;
  let dueThisWeekCount = 0;
  let dueThisWeekAmount = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  let paidThisMonthAmount = 0;
  let paidThisMonthCount = 0;

  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const next7DaysMidnight = nowMidnight + 7 * 24 * 60 * 60 * 1000;

  for (const bill of bills) {
    const amount = Number(bill.amount) || 0;

    if (bill.status === 'PAID') {
      const paidDate = bill.paidAt ? new Date(bill.paidAt) : new Date(bill.updatedAt || bill.dueDate);
      if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
        paidThisMonthAmount += amount;
        paidThisMonthCount++;
      }
      continue;
    }

    // Bill is UNPAID or OVERDUE
    totalDue += amount;
    unpaidCount++;

    const due = new Date(bill.dueDate);
    const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();

    if (dueMidnight < nowMidnight) {
      overdueCount++;
      overdueAmount += amount;
    } else if (dueMidnight <= next7DaysMidnight) {
      dueThisWeekCount++;
      dueThisWeekAmount += amount;
    }
  }

  return {
    totalDue: Math.round(totalDue * 100) / 100,
    unpaidCount,
    dueThisWeekCount,
    dueThisWeekAmount: Math.round(dueThisWeekAmount * 100) / 100,
    overdueCount,
    overdueAmount: Math.round(overdueAmount * 100) / 100,
    paidThisMonthAmount: Math.round(paidThisMonthAmount * 100) / 100,
    paidThisMonthCount,
    totalBills: bills.length,
  };
}

export type UrgencyGroupKey = 'OVERDUE' | 'DUE_TODAY' | 'DUE_THIS_WEEK' | 'LATER_THIS_MONTH' | 'PAID';

export interface UrgencyGroup {
  key: UrgencyGroupKey;
  title: string;
  count: number;
  totalAmount: number;
  bills: Bill[];
  accentColor: string;
}

/**
 * Group bills by urgency for timeline display.
 */
export function groupBillsByUrgency(bills: Bill[], refDate: Date = new Date()): UrgencyGroup[] {
  const groups: Record<UrgencyGroupKey, Bill[]> = {
    OVERDUE: [],
    DUE_TODAY: [],
    DUE_THIS_WEEK: [],
    LATER_THIS_MONTH: [],
    PAID: [],
  };

  const nowMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();
  const next7DaysMidnight = nowMidnight + 7 * 24 * 60 * 60 * 1000;
  const endOfMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getTime();

  for (const bill of bills) {
    if (bill.status === 'PAID') {
      groups.PAID.push(bill);
      continue;
    }

    const due = new Date(bill.dueDate);
    const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();

    if (dueMidnight < nowMidnight) {
      groups.OVERDUE.push(bill);
    } else if (dueMidnight === nowMidnight) {
      groups.DUE_TODAY.push(bill);
    } else if (dueMidnight <= next7DaysMidnight) {
      groups.DUE_THIS_WEEK.push(bill);
    } else {
      groups.LATER_THIS_MONTH.push(bill);
    }
  }

  // Sort each group by dueDate ascending
  const sortByDate = (a: Bill, b: Bill) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  groups.OVERDUE.sort(sortByDate);
  groups.DUE_TODAY.sort(sortByDate);
  groups.DUE_THIS_WEEK.sort(sortByDate);
  groups.LATER_THIS_MONTH.sort(sortByDate);
  groups.PAID.sort((a, b) => new Date(b.paidAt || b.dueDate).getTime() - new Date(a.paidAt || a.dueDate).getTime());

  const calcGroupAmount = (list: Bill[]) => list.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);

  const groupsList: UrgencyGroup[] = [
    {
      key: 'OVERDUE',
      title: 'Overdue Bills',
      count: groups.OVERDUE.length,
      totalAmount: calcGroupAmount(groups.OVERDUE),
      bills: groups.OVERDUE,
      accentColor: 'rose',
    },
    {
      key: 'DUE_TODAY',
      title: 'Due Today',
      count: groups.DUE_TODAY.length,
      totalAmount: calcGroupAmount(groups.DUE_TODAY),
      bills: groups.DUE_TODAY,
      accentColor: 'orange',
    },
    {
      key: 'DUE_THIS_WEEK',
      title: 'Due This Week',
      count: groups.DUE_THIS_WEEK.length,
      totalAmount: calcGroupAmount(groups.DUE_THIS_WEEK),
      bills: groups.DUE_THIS_WEEK,
      accentColor: 'amber',
    },
    {
      key: 'LATER_THIS_MONTH',
      title: 'Later This Month & Upcoming',
      count: groups.LATER_THIS_MONTH.length,
      totalAmount: calcGroupAmount(groups.LATER_THIS_MONTH),
      bills: groups.LATER_THIS_MONTH,
      accentColor: 'blue',
    },
    {
      key: 'PAID',
      title: 'Settled & Paid Bills',
      count: groups.PAID.length,
      totalAmount: calcGroupAmount(groups.PAID),
      bills: groups.PAID,
      accentColor: 'emerald',
    },
  ];

  return groupsList.filter((g) => g.count > 0);
}
