export type AnalyticsPeriod = 'month' | '3m' | '6m' | 'year' | 'all' | 'custom';

export interface AnalyticsQueryOptions {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
}

export interface CategoryMetric {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface IncomeSourceMetric {
  source: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrendPoint {
  month: string;
  monthKey: string; // YYYY-MM
  income: number;
  expenses: number;
  net: number;
}

export interface AnalyticsResponse {
  period: {
    key: AnalyticsPeriod;
    label: string;
    startDate: string;
    endDate: string;
  };

  finance: {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyNetCashFlow: number;
    periodIncome: number;
    periodExpenses: number;
    netCashFlow: number;
    allTimeIncome: number;
    allTimeExpenses: number;
    allTimeNetCashFlow: number;
    transactionCount: number;
    periodTransactionCount: number;
    savingsRate: number | null;
  };

  categories: {
    expenses: CategoryMetric[];
    income: IncomeSourceMetric[];
  };

  bills: {
    total: number;
    paid: number;
    unpaid: number;
    overdue: number;
    settlementRate: number;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
  };

  tasks: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
  };

  groceries: {
    total: number;
    needToBuy: number;
    purchased: number;
    lowStock: number;
    healthyStock: number;
    urgent: number;
  };

  trends: {
    monthlyCashFlow: MonthlyTrendPoint[];
  };

  insights: string[];

  // Backward compatibility fields for legacy contracts
  summary: {
    monthlyIncome: number;
    monthlyExpenses: number;
    overallIncome: number;
    overallExpenses: number;
    billSettlementRate: number;
    taskCompletionRate: number;
    netSavings: number;
  };

  expenseCategories: CategoryMetric[];
  incomeSources: IncomeSourceMetric[];

  billsAnalytics: {
    totalBillsCount: number;
    paidCount: number;
    unpaidCount: number;
    settlementRate: number;
  };

  tasksAnalytics: {
    totalTasksCount: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completionRate: number;
  };

  inventoryAnalytics: {
    totalItems: number;
    healthyStockCount: number;
    lowStockCount: number;
    needToBuyCount: number;
  };

  counts: {
    expensesCount: number;
    incomesCount: number;
    transactionsCount: number;
    billsCount: number;
    tasksCount: number;
    groceriesCount: number;
    appliancesCount: number;
    medicinesCount: number;
  };

  householdMetrics: {
    totalExpense: number;
    totalIncome: number;
    netSavings: number;
    monthlyExpenses: number;
    monthlyIncome: number;
    monthlySavings: number;
  };

  operationalMetrics: {
    totalMembers: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
    totalGroceries: number;
    expiringGroceries: number;
    totalAppliances: number;
    totalBills: number;
    pendingBills: number;
  };

  categoryDistribution: Record<string, number>;
}
