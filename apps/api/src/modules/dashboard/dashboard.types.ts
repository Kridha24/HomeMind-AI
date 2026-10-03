export interface DashboardSummaryData {
  // Legacy / Direct Root Accessors (100% backward compatibility)
  isNewUser: boolean;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  overallIncome: number;
  overallExpenses: number;
  overallSavings: number;
  upcomingBillsTotal: number;
  summary: {
    totalExpense: number;
    totalIncome: number;
    savings: number;
    overallSavings: number;
    savingsRate: number;
    sustainabilityScore: number;
  };
  recent5History: any[];

  // Modular Phase 2/3 Metrics Object
  metrics: {
    monthlyExpenses: number;
    monthlyIncome: number;
    allTimeExpenses: number;
    allTimeIncome: number;
    netBalance: number;
    savingsRate: number;
    monthlyBudgetLimit: number;
    budgetUtilizationPercent: number;
    recordCount: number;
    healthScore: number;
  };

  upcomingBills: any[];
  pendingTasks: any[];
  expiringGroceries: any[];
  lowStockGroceries: any[];
  upcomingApplianceServices: any[];
  expiringMedicines: any[];
  recentNotifications: any[];
  aiRecommendations: any[];
  latestExpenses: any[];
  latestIncomes: any[];
  cached?: boolean;
  generatedAt: string;

  // Role-Aware Privacy Fields
  isRoleRestricted?: boolean;
  myTasks?: any[];
  mySummary?: {
    personalMonthlyExpense: number;
    personalMonthlyIncome: number;
    personalSavings: number;
    assignedTasksCount: number;
  };
}
