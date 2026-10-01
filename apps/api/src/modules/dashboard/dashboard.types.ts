export interface DashboardSummaryData {
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
}
