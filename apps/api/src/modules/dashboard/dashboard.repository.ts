import { prisma } from '../../repositories/db';
import { roundMoney } from '@homemind/shared';
import { DashboardSummaryData } from './dashboard.types';

export class DashboardRepository {
  public static async aggregateHouseholdData(householdId: string): Promise<DashboardSummaryData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      expensesThisMonth,
      incomesThisMonth,
      allTimeExpensesAggregate,
      allTimeIncomesAggregate,
      upcomingBills,
      pendingTasks,
      expiringGroceries,
      lowStockGroceries,
      upcomingApplianceServices,
      expiringMedicines,
      recentNotifications,
      aiRecommendations,
      totalRecordCount,
      latestExpenses,
      latestIncomes,
      budgets,
    ] = await Promise.all([
      prisma.expense.aggregate({
        where: { householdId, softDelete: false, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.income.aggregate({
        where: { householdId, softDelete: false, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { householdId, softDelete: false },
        _sum: { amount: true },
      }),
      prisma.income.aggregate({
        where: { householdId, softDelete: false },
        _sum: { amount: true },
      }),
      prisma.bill.findMany({
        where: { householdId, softDelete: false, status: 'UNPAID' },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      prisma.task.findMany({
        where: { householdId, softDelete: false, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      prisma.groceryItem.findMany({
        where: {
          householdId,
          softDelete: false,
          expiryDate: { lte: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
        },
        take: 5,
      }),
      prisma.groceryItem.findMany({
        where: { householdId, softDelete: false, quantity: { lte: 2 } },
        take: 5,
      }),
      prisma.appliance.findMany({
        where: {
          householdId,
          softDelete: false,
          nextServiceDueDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
        take: 5,
      }),
      prisma.medicine.findMany({
        where: {
          householdId,
          softDelete: false,
          expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
        take: 5,
      }),
      prisma.notification.findMany({
        where: { householdId, softDelete: false },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.aIRecommendation.findMany({
        where: { householdId, softDelete: false, isDismissed: false },
        take: 4,
      }),
      prisma.expense.count({ where: { householdId, softDelete: false } }),
      prisma.expense.findMany({
        where: { householdId, softDelete: false },
        orderBy: { date: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
      prisma.income.findMany({
        where: { householdId, softDelete: false },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.budget.findMany({
        where: { householdId, softDelete: false },
      }),
    ]);

    const monthlyExpenses = roundMoney(expensesThisMonth._sum.amount || 0);
    const monthlyIncome = roundMoney(incomesThisMonth._sum.amount || 0);
    const allTimeExpenses = roundMoney(allTimeExpensesAggregate._sum.amount || 0);
    const allTimeIncome = roundMoney(allTimeIncomesAggregate._sum.amount || 0);
    const netBalance = roundMoney(allTimeIncome - allTimeExpenses);

    const totalBudgetLimit = budgets.reduce((acc, b) => acc + (b.monthlyLimit || 0), 0);
    const budgetUtilization = totalBudgetLimit > 0
      ? Math.round((monthlyExpenses / totalBudgetLimit) * 100)
      : 0;

    const savingsRate = monthlyIncome > 0
      ? Math.max(0, Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100))
      : 0;

    let healthScore = 80;
    if (monthlyExpenses > monthlyIncome && monthlyIncome > 0) healthScore -= 20;
    if (upcomingBills.length > 3) healthScore -= 10;
    if (pendingTasks.length > 5) healthScore -= 5;
    if (expiringGroceries.length > 2) healthScore -= 5;
    healthScore = Math.max(10, Math.min(100, healthScore));

    return {
      metrics: {
        monthlyExpenses,
        monthlyIncome,
        allTimeExpenses,
        allTimeIncome,
        netBalance,
        savingsRate,
        monthlyBudgetLimit: roundMoney(totalBudgetLimit),
        budgetUtilizationPercent: budgetUtilization,
        recordCount: totalRecordCount,
        healthScore,
      },
      upcomingBills,
      pendingTasks,
      expiringGroceries,
      lowStockGroceries,
      upcomingApplianceServices,
      expiringMedicines,
      recentNotifications,
      aiRecommendations,
      latestExpenses,
      latestIncomes,
      generatedAt: new Date().toISOString(),
    };
  }
}
