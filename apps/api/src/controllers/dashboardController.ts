import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDashboardSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

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
      latestIncomes
    ] = await Promise.all([
      prisma.expense.aggregate({
        where: { householdId, softDelete: false, date: { gte: startOfMonth } },
        _sum: { amount: true }
      }),
      prisma.income.aggregate({
        where: { householdId, softDelete: false, date: { gte: startOfMonth } },
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: { householdId, softDelete: false },
        _sum: { amount: true }
      }),
      prisma.income.aggregate({
        where: { householdId, softDelete: false },
        _sum: { amount: true }
      }),
      prisma.bill.findMany({
        where: { householdId, softDelete: false, status: 'UNPAID' },
        orderBy: { dueDate: 'asc' },
        take: 5
      }),
      prisma.task.findMany({
        where: { householdId, softDelete: false, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { dueDate: 'asc' },
        take: 5
      }),
      prisma.groceryItem.findMany({
        where: {
          householdId,
          softDelete: false,
          expiryDate: { lte: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) }
        },
        take: 5
      }),
      prisma.groceryItem.findMany({
        where: { householdId, softDelete: false, quantity: { lte: 2 } },
        take: 5
      }),
      prisma.appliance.findMany({
        where: { householdId, softDelete: false, nextServiceDueDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
        take: 5
      }),
      prisma.medicine.findMany({
        where: { householdId, softDelete: false, expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
        take: 5
      }),
      prisma.notification.findMany({
        where: { householdId, softDelete: false },
        orderBy: { createdAt: 'desc' },
        take: 8
      }),
      prisma.aIRecommendation.findMany({
        where: { householdId, softDelete: false, isDismissed: false },
        take: 4
      }),
      prisma.expense.count({ where: { householdId, softDelete: false } }),
      prisma.expense.findMany({
        where: { householdId, softDelete: false },
        orderBy: { date: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } }
      }),
      prisma.income.findMany({
        where: { householdId, softDelete: false },
        orderBy: { date: 'desc' },
        take: 5
      })
    ]);

    const monthlyExpenses = expensesThisMonth._sum.amount || 0;
    const monthlyIncome = incomesThisMonth._sum.amount || 0;
    const overallExpenses = allTimeExpensesAggregate._sum.amount || 0;
    const overallIncome = allTimeIncomesAggregate._sum.amount || 0;

    const monthlySavings = monthlyIncome - monthlyExpenses;
    const overallSavings = overallIncome - overallExpenses;
    const upcomingBillsTotal = upcomingBills.reduce((acc, curr) => acc + curr.amount, 0);

    // Combine latest expenses & incomes into 5 Recent History entries
    const combinedHistory = [
      ...latestExpenses.map(e => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        type: 'EXPENSE',
        category: e.category,
        date: e.date,
        userName: e.user?.name || 'User'
      })),
      ...latestIncomes.map(i => ({
        id: i.id,
        title: i.title,
        amount: i.amount,
        type: 'INCOME',
        category: i.source,
        date: i.date,
        userName: 'Verified Revenue'
      }))
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const isNewUser = totalRecordCount === 0 && upcomingBills.length === 0 && pendingTasks.length === 0;

    res.json({
      isNewUser,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      overallIncome,
      overallExpenses,
      overallSavings,
      upcomingBillsTotal,
      summary: {
        totalExpense: monthlyExpenses,
        totalIncome: monthlyIncome,
        savings: monthlySavings,
        overallSavings,
        savingsRate: monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0,
        sustainabilityScore: isNewUser ? 100 : 86.5
      },
      upcomingBills,
      recent5History: combinedHistory,
      pendingTasks,
      expiringGroceries,
      lowStockGroceries,
      upcomingApplianceServices,
      expiringMedicines,
      recentNotifications,
      aiRecommendations
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
