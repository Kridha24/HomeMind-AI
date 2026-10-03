import { prisma } from '../../repositories/db';
import {
  AnalyticsPeriod,
  AnalyticsQueryOptions,
  AnalyticsResponse,
  CategoryMetric,
  IncomeSourceMetric,
  MonthlyTrendPoint,
} from './analytics.types';

function safeNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

function safePercentage(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  const pct = (numerator / denominator) * 100;
  return Number.isFinite(pct) ? Math.round(pct * 10) / 10 : 0;
}

export class AnalyticsService {
  /**
   * Generates production household intelligence metrics scoped to an active household.
   */
  public static async getHouseholdAnalytics(
    householdId: string,
    options: AnalyticsQueryOptions = {}
  ): Promise<AnalyticsResponse> {
    const period: AnalyticsPeriod = options.period || '3m';
    const now = new Date();

    // 1. Compute Period Date Boundaries
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let periodStart: Date;
    let periodEnd: Date = now;
    let periodLabel = 'Last 3 Months';

    switch (period) {
      case 'month':
        periodStart = currentMonthStart;
        periodEnd = currentMonthEnd;
        periodLabel = 'This Month';
        break;
      case '3m':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
        periodLabel = 'Last 3 Months';
        break;
      case '6m':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
        periodLabel = 'Last 6 Months';
        break;
      case 'year':
        periodStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        periodLabel = 'This Year';
        break;
      case 'all':
        periodStart = new Date(0);
        periodLabel = 'All Time';
        break;
      case 'custom':
        periodStart = options.startDate ? new Date(options.startDate) : new Date(0);
        periodEnd = options.endDate ? new Date(options.endDate) : now;
        periodEnd.setHours(23, 59, 59, 999);
        periodLabel = 'Custom Range';
        break;
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
        periodLabel = 'Last 3 Months';
    }

    // 2. Fetch Household Data in Parallel (Strictly household-scoped & excluding soft-deleted)
    const [
      expenses,
      incomes,
      transactions,
      bills,
      tasks,
      groceries,
      appliances,
      medicines,
      members,
    ] = await Promise.all([
      prisma.expense.findMany({
        where: { householdId, softDelete: false },
        orderBy: { date: 'desc' },
      }),
      prisma.income.findMany({
        where: { householdId, softDelete: false },
        orderBy: { date: 'desc' },
      }),
      prisma.transaction.findMany({
        where: { householdId, softDelete: false },
        orderBy: { occurredAt: 'desc' },
      }),
      prisma.bill.findMany({
        where: { householdId, softDelete: false },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.task.findMany({
        where: { householdId, softDelete: false },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.groceryItem.findMany({
        where: { householdId, softDelete: false },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.appliance.findMany({
        where: { householdId, softDelete: false },
      }),
      prisma.medicine.findMany({
        where: { householdId, softDelete: false },
      }),
      prisma.user.findMany({
        where: { householdId, softDelete: false, isActive: true },
        select: { id: true, name: true, role: true },
      }),
    ]);

    // 3. Reconcile Financial Records (Canonical Rule: Prevent Double-Counting)
    // Linked Transactions share expenseId or incomeId.
    const expenseLinkedIds = new Set(expenses.map((e) => e.id));
    const incomeLinkedIds = new Set(incomes.map((i) => i.id));

    // Any standalone DEBIT transaction with no linked Expense is treated as an expense event
    const standaloneDebitTxs = transactions.filter(
      (tx) => tx.type === 'DEBIT' && (!tx.expenseId || !expenseLinkedIds.has(tx.expenseId))
    );
    // Any standalone CREDIT transaction with no linked Income is treated as an income event
    const standaloneCreditTxs = transactions.filter(
      (tx) => tx.type === 'CREDIT' && (!tx.incomeId || !incomeLinkedIds.has(tx.incomeId))
    );

    // Canonical financial items list
    interface NormalizedFinancialItem {
      id: string;
      title: string;
      amount: number;
      category: string;
      date: Date;
    }

    const allExpenseItems: NormalizedFinancialItem[] = [
      ...expenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: safeNumber(e.amount),
        category: e.category || 'Other',
        date: new Date(e.date),
      })),
      ...standaloneDebitTxs.map((tx) => ({
        id: tx.id,
        title: tx.merchant || 'Card/UPI Debit',
        amount: safeNumber(tx.amount),
        category: tx.category || 'Other',
        date: new Date(tx.occurredAt),
      })),
    ];

    const allIncomeItems: NormalizedFinancialItem[] = [
      ...incomes.map((i) => ({
        id: i.id,
        title: i.title,
        amount: safeNumber(i.amount),
        category: i.source || 'Other',
        date: new Date(i.date),
      })),
      ...standaloneCreditTxs.map((tx) => ({
        id: tx.id,
        title: tx.merchant || 'Credit Deposit',
        amount: safeNumber(tx.amount),
        category: tx.category || 'Other',
        date: new Date(tx.occurredAt),
      })),
    ];

    // 4. Financial Calculations: Lifetime vs Current-Month vs Period
    // Lifetime (All-Time)
    const allTimeExpenses = allExpenseItems.reduce((acc, curr) => acc + curr.amount, 0);
    const allTimeIncome = allIncomeItems.reduce((acc, curr) => acc + curr.amount, 0);
    const allTimeNetCashFlow = allTimeIncome - allTimeExpenses;
    const totalTransactionCount = allExpenseItems.length + allIncomeItems.length;

    // Current Month
    const monthlyExpenses = allExpenseItems
      .filter((e) => e.date >= currentMonthStart && e.date <= currentMonthEnd)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const monthlyIncome = allIncomeItems
      .filter((i) => i.date >= currentMonthStart && i.date <= currentMonthEnd)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const monthlyNetCashFlow = monthlyIncome - monthlyExpenses;

    // Selected Period
    const periodExpenseItems = allExpenseItems.filter(
      (e) => e.date >= periodStart && e.date <= periodEnd
    );
    const periodIncomeItems = allIncomeItems.filter(
      (i) => i.date >= periodStart && i.date <= periodEnd
    );

    const periodExpenses = periodExpenseItems.reduce((acc, curr) => acc + curr.amount, 0);
    const periodIncome = periodIncomeItems.reduce((acc, curr) => acc + curr.amount, 0);
    const netCashFlow = periodIncome - periodExpenses;
    const periodTransactionCount = periodExpenseItems.length + periodIncomeItems.length;

    // Savings Rate (Division-by-zero protection)
    const savingsRate =
      periodIncome > 0
        ? Math.round(((periodIncome - periodExpenses) / periodIncome) * 1000) / 10
        : null;

    // 5. Expense Category Distribution in Selected Period (or All-Time if period has no entries)
    const effectiveExpenseItems =
      periodExpenseItems.length > 0 ? periodExpenseItems : allExpenseItems;
    const effectiveExpenseTotal =
      periodExpenseItems.length > 0 ? periodExpenses : allTimeExpenses;

    const expenseCategoryMap = new Map<string, { amount: number; count: number }>();
    for (const item of effectiveExpenseItems) {
      const existing = expenseCategoryMap.get(item.category) || { amount: 0, count: 0 };
      expenseCategoryMap.set(item.category, {
        amount: existing.amount + item.amount,
        count: existing.count + 1,
      });
    }

    const expenseCategories: CategoryMetric[] = Array.from(expenseCategoryMap.entries())
      .map(([category, stats]) => ({
        category,
        amount: stats.amount,
        count: stats.count,
        percentage: safePercentage(stats.amount, effectiveExpenseTotal),
      }))
      .sort((a, b) => b.amount - a.amount);

    // 6. Income Sources Distribution in Selected Period (or All-Time if period has no entries)
    const effectiveIncomeItems =
      periodIncomeItems.length > 0 ? periodIncomeItems : allIncomeItems;
    const effectiveIncomeTotal =
      periodIncomeItems.length > 0 ? periodIncome : allTimeIncome;

    const incomeSourceMap = new Map<string, { amount: number; count: number }>();
    for (const item of effectiveIncomeItems) {
      const existing = incomeSourceMap.get(item.category) || { amount: 0, count: 0 };
      incomeSourceMap.set(item.category, {
        amount: existing.amount + item.amount,
        count: existing.count + 1,
      });
    }

    const incomeSources: IncomeSourceMetric[] = Array.from(incomeSourceMap.entries())
      .map(([source, stats]) => ({
        source,
        amount: stats.amount,
        count: stats.count,
        percentage: safePercentage(stats.amount, effectiveIncomeTotal),
      }))
      .sort((a, b) => b.amount - a.amount);

    // 7. Bills Analytics & Settlement Rate
    const totalBills = bills.length;
    const paidBillsList = bills.filter((b) => b.status === 'PAID');
    const unpaidBillsList = bills.filter((b) => b.status === 'UNPAID');
    const overdueBillsList = bills.filter(
      (b) =>
        b.status === 'OVERDUE' ||
        (b.status !== 'PAID' && new Date(b.dueDate).getTime() < now.getTime())
    );

    const paidBillsCount = paidBillsList.length;
    const unpaidBillsCount = unpaidBillsList.length;
    const overdueBillsCount = overdueBillsList.length;
    const billSettlementRate = safePercentage(paidBillsCount, totalBills);

    const totalBillAmount = bills.reduce((acc, curr) => acc + safeNumber(curr.amount), 0);
    const paidBillAmount = paidBillsList.reduce((acc, curr) => acc + safeNumber(curr.amount), 0);
    const unpaidBillAmount = totalBillAmount - paidBillAmount;

    // 8. Tasks Analytics & Completion Rate
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter((t) => t.status === 'PENDING').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate).getTime() < now.getTime()
    ).length;
    const taskCompletionRate = safePercentage(completedTasks, totalTasks);

    // 9. Groceries Inventory Telemetry
    const totalGroceries = groceries.length;
    const lowStockGroceries = groceries.filter(
      (g) => safeNumber(g.quantity) <= safeNumber(g.minThreshold, 1)
    ).length;
    const healthyStockGroceries = Math.max(0, totalGroceries - lowStockGroceries);
    const needToBuyGroceries = lowStockGroceries;
    const purchasedGroceries = groceries.filter((g) => g.purchaseDate !== null).length;
    const urgentGroceries = groceries.filter(
      (g) =>
        safeNumber(g.quantity) <= 0 ||
        (g.expiryDate && new Date(g.expiryDate).getTime() - now.getTime() < 3 * 86400000)
    ).length;

    // 10. Historical Monthly Cash Flow Trend (Last 6 months)
    const monthlyCashFlow: MonthlyTrendPoint[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

      const mExpenses = allExpenseItems
        .filter((e) => e.date >= mStart && e.date <= mEnd)
        .reduce((sum, e) => sum + e.amount, 0);

      const mIncome = allIncomeItems
        .filter((i) => i.date >= mStart && i.date <= mEnd)
        .reduce((sum, i) => sum + i.amount, 0);

      monthlyCashFlow.push({
        month: monthLabel,
        monthKey,
        income: mIncome,
        expenses: mExpenses,
        net: mIncome - mExpenses,
      });
    }

    // 11. Deterministic Household Insights (No fake AI text)
    const insights: string[] = [];
    if (expenseCategories.length > 0) {
      const topCat = expenseCategories[0];
      insights.push(
        `${topCat.category} is your highest spending category at ₹${topCat.amount.toLocaleString(
          'en-IN'
        )} (${topCat.percentage}% of total expenses).`
      );
    }

    if (overdueBillsCount > 0) {
      insights.push(
        `Action needed: ${overdueBillsCount} bill${
          overdueBillsCount > 1 ? 's are' : ' is'
        } overdue totaling ₹${unpaidBillAmount.toLocaleString('en-IN')}.`
      );
    } else if (unpaidBillsCount > 0) {
      insights.push(
        `Upcoming: ${unpaidBillsCount} unpaid bill${
          unpaidBillsCount > 1 ? 's' : ''
        } due soon totaling ₹${unpaidBillAmount.toLocaleString('en-IN')}.`
      );
    }

    if (totalTasks > 0) {
      insights.push(
        `Household tasks completion is at ${taskCompletionRate}% (${completedTasks} of ${totalTasks} tasks resolved).`
      );
    }

    if (lowStockGroceries > 0) {
      insights.push(
        `Pantry alert: ${lowStockGroceries} grocery item${
          lowStockGroceries > 1 ? 's need' : ' needs'
        } restocking.`
      );
    }

    if (monthlyNetCashFlow > 0) {
      insights.push(
        `Positive monthly cash flow: Income exceeds expenses by ₹${monthlyNetCashFlow.toLocaleString(
          'en-IN'
        )} this month.`
      );
    }

    // Category distribution map for legacy callers
    const categoryDistributionMap: Record<string, number> = {};
    for (const ec of expenseCategories) {
      categoryDistributionMap[ec.category] = ec.amount;
    }

    // Return Complete, Normalized, Production-Grade Response
    return {
      period: {
        key: period,
        label: periodLabel,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      },

      finance: {
        monthlyIncome,
        monthlyExpenses,
        monthlyNetCashFlow,
        periodIncome,
        periodExpenses,
        netCashFlow,
        allTimeIncome,
        allTimeExpenses,
        allTimeNetCashFlow,
        transactionCount: totalTransactionCount,
        periodTransactionCount,
        savingsRate,
      },

      categories: {
        expenses: expenseCategories,
        income: incomeSources,
      },

      bills: {
        total: totalBills,
        paid: paidBillsCount,
        unpaid: unpaidBillsCount,
        overdue: overdueBillsCount,
        settlementRate: billSettlementRate,
        totalAmount: totalBillAmount,
        paidAmount: paidBillAmount,
        unpaidAmount: unpaidBillAmount,
      },

      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks,
        completionRate: taskCompletionRate,
      },

      groceries: {
        total: totalGroceries,
        needToBuy: needToBuyGroceries,
        purchased: purchasedGroceries,
        lowStock: lowStockGroceries,
        healthyStock: healthyStockGroceries,
        urgent: urgentGroceries,
      },

      trends: {
        monthlyCashFlow,
      },

      insights,

      // Backward compatibility fields for legacy contracts
      summary: {
        monthlyIncome,
        monthlyExpenses,
        overallIncome: allTimeIncome,
        overallExpenses: allTimeExpenses,
        billSettlementRate,
        taskCompletionRate,
        netSavings: allTimeNetCashFlow,
      },

      expenseCategories,
      incomeSources,

      billsAnalytics: {
        totalBillsCount: totalBills,
        paidCount: paidBillsCount,
        unpaidCount: unpaidBillsCount,
        settlementRate: billSettlementRate,
      },

      tasksAnalytics: {
        totalTasksCount: totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        completionRate: taskCompletionRate,
      },

      inventoryAnalytics: {
        totalItems: totalGroceries,
        healthyStockCount: healthyStockGroceries,
        lowStockCount: lowStockGroceries,
        needToBuyCount: needToBuyGroceries,
      },

      counts: {
        expensesCount: allExpenseItems.length,
        incomesCount: allIncomeItems.length,
        transactionsCount: totalTransactionCount,
        billsCount: totalBills,
        tasksCount: totalTasks,
        groceriesCount: totalGroceries,
        appliancesCount: appliances.length,
        medicinesCount: medicines.length,
      },

      householdMetrics: {
        totalExpense: allTimeExpenses,
        totalIncome: allTimeIncome,
        netSavings: allTimeNetCashFlow,
        monthlyExpenses,
        monthlyIncome,
        monthlySavings: monthlyNetCashFlow,
      },

      operationalMetrics: {
        totalMembers: members.length,
        totalTasks,
        completedTasks,
        taskCompletionRate,
        totalGroceries,
        expiringGroceries: urgentGroceries,
        totalAppliances: appliances.length,
        totalBills,
        pendingBills: unpaidBillsCount,
      },

      categoryDistribution: categoryDistributionMap,
    };
  }
}
