import { prisma } from '../../repositories/db';
import { roundMoney } from '@homemind/shared';
import { DashboardSummaryData } from './dashboard.types';

export class DashboardRepository {
  public static async aggregateHouseholdData(householdId: string): Promise<DashboardSummaryData> {
    const startTime = Date.now();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const groceryExpiryLimit = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    // Optimized aggregation: Consolidated 16 queries down to 10 queries
    // 1. Combined expense all-time sum + record count in a single aggregate
    // 2. Merged expiring groceries + low stock groceries in a single OR query
    const [
      expensesThisMonth,
      incomesThisMonth,
      allTimeExpensesAndCount,
      allTimeIncomesAggregate,
      upcomingBills,
      pendingTasks,
      flaggedGroceries,
      upcomingApplianceServices,
      expiringMedicines,
      recentNotifications,
      aiRecommendations,
      latestExpenses,
      latestIncomes,
      budgets,
    ] = await Promise.all([
      // 1. Monthly expenses sum
      prisma.expense.aggregate({
        where: { householdId, softDelete: false, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      // 2. Monthly income sum
      prisma.income.aggregate({
        where: { householdId, softDelete: false, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      // 3. All-time expenses sum AND total record count (consolidated 2 queries into 1)
      prisma.expense.aggregate({
        where: { householdId, softDelete: false },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // 4. All-time income sum
      prisma.income.aggregate({
        where: { householdId, softDelete: false },
        _sum: { amount: true },
      }),
      // 5. Upcoming bills
      prisma.bill.findMany({
        where: { householdId, softDelete: false, status: 'UNPAID' },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      // 6. Pending tasks
      prisma.task.findMany({
        where: { householdId, softDelete: false, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      // 7. Flagged groceries (consolidated expiring + low-stock into 1 single query)
      prisma.groceryItem.findMany({
        where: {
          householdId,
          softDelete: false,
          OR: [
            { expiryDate: { lte: groceryExpiryLimit } },
            { quantity: { lte: 2 } },
          ],
        },
        take: 10,
      }),
      // 8. Appliances due for service
      prisma.appliance.findMany({
        where: {
          householdId,
          softDelete: false,
          nextServiceDueDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
        take: 5,
      }),
      // 9. Expiring medicines
      prisma.medicine.findMany({
        where: {
          householdId,
          softDelete: false,
          expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
        take: 5,
      }),
      // 10. Recent notifications
      prisma.notification.findMany({
        where: { householdId, softDelete: false },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      // 11. Active AI recommendations
      prisma.aIRecommendation.findMany({
        where: { householdId, softDelete: false, isDismissed: false },
        take: 4,
      }),
      // 12. Latest expenses
      prisma.expense.findMany({
        where: { householdId, softDelete: false },
        orderBy: { date: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
      // 13. Latest incomes
      prisma.income.findMany({
        where: { householdId, softDelete: false },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      // 14. Budgets
      prisma.budget.findMany({
        where: { householdId, softDelete: false },
      }),
    ]);

    // Split consolidated groceries into expiring and low-stock subsets
    const expiringGroceries = flaggedGroceries
      .filter((g) => g.expiryDate && new Date(g.expiryDate) <= groceryExpiryLimit)
      .slice(0, 5);
    const lowStockGroceries = flaggedGroceries
      .filter((g) => g.quantity <= 2)
      .slice(0, 5);

    const monthlyExpenses = roundMoney(expensesThisMonth._sum.amount || 0);
    const monthlyIncome = roundMoney(incomesThisMonth._sum.amount || 0);
    const allTimeExpenses = roundMoney(allTimeExpensesAndCount._sum.amount || 0);
    const allTimeIncome = roundMoney(allTimeIncomesAggregate._sum.amount || 0);
    const totalRecordCount = allTimeExpensesAndCount._count.id || 0;
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

    const durationSec = (Date.now() - startTime) / 1000;
    try {
      const { dbQueryDurationSeconds } = await import('@homemind/observability');
      dbQueryDurationSeconds.observe(durationSec, {
        service: 'homemind-api',
        operation: 'aggregateHouseholdData',
        model: 'Dashboard',
      });
    } catch {}

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
