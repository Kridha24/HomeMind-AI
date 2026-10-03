import { prisma } from '../../repositories/db';
import { roundMoney } from '@homemind/shared';
import { DashboardSummaryData } from './dashboard.types';

export class DashboardRepository {
  public static async aggregateHouseholdData(householdId: string): Promise<DashboardSummaryData> {
    const startTime = Date.now();
    const now = new Date();

    // Query household timezone if available
    const setting = await prisma.setting.findFirst({
      where: { householdId, softDelete: false },
      select: { timeZone: true },
    });

    // Month boundary calculation
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const groceryExpiryLimit = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    // Optimized aggregation: Consolidated queries
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
      // 3. All-time expenses sum AND total record count
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
        take: 10,
      }),
      // 6. Pending tasks
      prisma.task.findMany({
        where: { householdId, softDelete: false, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      // 7. Flagged groceries (expiring + low stock)
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
    const monthlySavings = roundMoney(monthlyIncome - monthlyExpenses);

    // Sum of all unpaid upcoming bills
    const upcomingBillsTotal = roundMoney(
      upcomingBills.reduce((acc, curr) => acc + (curr.amount || 0), 0)
    );

    // Combine latest expenses & incomes into 5 Recent History entries
    const combinedHistory = [
      ...latestExpenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        type: 'EXPENSE',
        category: e.category,
        date: e.date,
        userName: (e as any).user?.name || 'Household Member',
      })),
      ...latestIncomes.map((i) => ({
        id: i.id,
        title: i.title,
        amount: i.amount,
        type: 'INCOME',
        category: i.source,
        date: i.date,
        userName: 'Verified Revenue',
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

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

    const isNewUser = totalRecordCount === 0 && upcomingBills.length === 0 && pendingTasks.length === 0;

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
      // Legacy / Direct Root Accessors (100% backward & forward compatible)
      isNewUser,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      overallIncome: allTimeIncome,
      overallExpenses: allTimeExpenses,
      overallSavings: netBalance,
      upcomingBillsTotal,
      summary: {
        totalExpense: monthlyExpenses,
        totalIncome: monthlyIncome,
        savings: monthlySavings,
        overallSavings: netBalance,
        savingsRate,
        sustainabilityScore: isNewUser ? 100 : healthScore,
      },
      recent5History: combinedHistory,

      // Modular Phase 2/3 Metrics Object
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

  public static async aggregateMemberData(
    householdId: string,
    userId: string
  ): Promise<DashboardSummaryData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const groceryExpiryLimit = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    const [
      personalMonthlyExpenses,
      personalMonthlyIncomes,
      personalAllTimeExpenses,
      personalAllTimeIncomes,
      upcomingBills,
      pendingTasks,
      myTasks,
      flaggedGroceries,
      recentNotifications,
      latestPersonalExpenses,
      latestPersonalIncomes,
    ] = await Promise.all([
      // 1. Personal monthly expenses
      prisma.expense.aggregate({
        where: { householdId, userId, softDelete: false, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      // 2. Personal monthly incomes
      prisma.income.aggregate({
        where: { householdId, createdBy: userId, softDelete: false, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      // 3. Personal all-time expenses
      prisma.expense.aggregate({
        where: { householdId, userId, softDelete: false },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // 4. Personal all-time incomes
      prisma.income.aggregate({
        where: { householdId, createdBy: userId, softDelete: false },
        _sum: { amount: true },
      }),
      // 5. Household upcoming bills
      prisma.bill.findMany({
        where: { householdId, softDelete: false, status: 'UNPAID' },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      // 6. Pending tasks (household)
      prisma.task.findMany({
        where: { householdId, softDelete: false, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      // 7. My assigned tasks
      prisma.task.findMany({
        where: { householdId, assigneeId: userId, softDelete: false, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      // 8. Shared groceries
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
      // 9. Notifications
      prisma.notification.findMany({
        where: { householdId, softDelete: false },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      // 10. Latest personal expenses (never other members')
      prisma.expense.findMany({
        where: { householdId, userId, softDelete: false },
        orderBy: { date: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } },
      }),
      // 11. Latest personal incomes (never other members')
      prisma.income.findMany({
        where: { householdId, createdBy: userId, softDelete: false },
        orderBy: { date: 'desc' },
        take: 5,
      }),
    ]);

    const expiringGroceries = flaggedGroceries
      .filter((g) => g.expiryDate && new Date(g.expiryDate) <= groceryExpiryLimit)
      .slice(0, 5);
    const lowStockGroceries = flaggedGroceries
      .filter((g) => g.quantity <= 2)
      .slice(0, 5);

    const personalExp = roundMoney(personalMonthlyExpenses._sum.amount || 0);
    const personalInc = roundMoney(personalMonthlyIncomes._sum.amount || 0);
    const personalAllExp = roundMoney(personalAllTimeExpenses._sum.amount || 0);
    const personalAllInc = roundMoney(personalAllTimeIncomes._sum.amount || 0);
    const personalSavings = roundMoney(personalInc - personalExp);
    const upcomingBillsTotal = roundMoney(
      upcomingBills.reduce((acc, curr) => acc + (curr.amount || 0), 0)
    );

    // Personal combined history
    const personalHistory = [
      ...latestPersonalExpenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        type: 'EXPENSE',
        category: e.category,
        date: e.date,
        userName: (e as any).user?.name || 'You',
      })),
      ...latestPersonalIncomes.map((i) => ({
        id: i.id,
        title: i.title,
        amount: i.amount,
        type: 'INCOME',
        category: i.source,
        date: i.date,
        userName: 'You',
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      isNewUser: personalAllTimeExpenses._count.id === 0 && upcomingBills.length === 0 && pendingTasks.length === 0,
      isRoleRestricted: true,
      monthlyIncome: personalInc,
      monthlyExpenses: personalExp,
      monthlySavings: personalSavings,
      overallIncome: personalAllInc,
      overallExpenses: personalAllExp,
      overallSavings: roundMoney(personalAllInc - personalAllExp),
      upcomingBillsTotal,
      summary: {
        totalExpense: personalExp,
        totalIncome: personalInc,
        savings: personalSavings,
        overallSavings: roundMoney(personalAllInc - personalAllExp),
        savingsRate: personalInc > 0 ? Math.max(0, Math.round((personalSavings / personalInc) * 100)) : 0,
        sustainabilityScore: 85,
      },
      recent5History: personalHistory,
      metrics: {
        monthlyExpenses: personalExp,
        monthlyIncome: personalInc,
        allTimeExpenses: personalAllExp,
        allTimeIncome: personalAllInc,
        netBalance: roundMoney(personalAllInc - personalAllExp),
        savingsRate: personalInc > 0 ? Math.max(0, Math.round((personalSavings / personalInc) * 100)) : 0,
        monthlyBudgetLimit: 0,
        budgetUtilizationPercent: 0,
        recordCount: personalAllTimeExpenses._count.id || 0,
        healthScore: 85,
      },
      myTasks,
      mySummary: {
        personalMonthlyExpense: personalExp,
        personalMonthlyIncome: personalInc,
        personalSavings,
        assignedTasksCount: myTasks.length,
      },
      upcomingBills,
      pendingTasks,
      expiringGroceries,
      lowStockGroceries,
      upcomingApplianceServices: [],
      expiringMedicines: [],
      recentNotifications,
      aiRecommendations: [],
      latestExpenses: latestPersonalExpenses,
      latestIncomes: latestPersonalIncomes,
      generatedAt: new Date().toISOString(),
    };
  }
}
