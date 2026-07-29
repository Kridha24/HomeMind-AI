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
      upcomingBills,
      pendingTasks,
      expiringGroceries,
      lowStockGroceries,
      upcomingApplianceServices,
      expiringMedicines,
      recentNotifications,
      aiRecommendations,
      totalRecordCount
    ] = await Promise.all([
      prisma.expense.aggregate({
        where: { householdId, softDelete: false, date: { gte: startOfMonth } },
        _sum: { amount: true }
      }),
      prisma.income.aggregate({
        where: { householdId, softDelete: false, date: { gte: startOfMonth } },
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
      prisma.expense.count({ where: { householdId, softDelete: false } })
    ]);

    const totalExpense = expensesThisMonth._sum.amount || 0;
    const totalIncome = incomesThisMonth._sum.amount || 0;
    const savings = totalIncome - totalExpense;

    // Check if user has zero data
    const isNewUser = totalRecordCount === 0 && upcomingBills.length === 0 && pendingTasks.length === 0;

    res.json({
      isNewUser,
      summary: {
        totalExpense,
        totalIncome,
        savings,
        savingsRate: totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0,
        sustainabilityScore: isNewUser ? 100 : 86.5
      },
      upcomingBills,
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
