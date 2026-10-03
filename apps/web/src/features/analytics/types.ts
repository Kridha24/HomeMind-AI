export type AnalyticsPeriod = 'month' | '3m' | '6m' | 'year' | 'all' | 'custom';

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
  monthKey: string;
  income: number;
  expenses: number;
  net: number;
}

export interface HouseholdAnalyticsData {
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

  // Counts summary
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
}
