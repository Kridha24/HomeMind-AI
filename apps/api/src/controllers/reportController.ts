import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateMonthlyPDFReport } from '../services/reportGenerator';

export const exportMonthlyReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const now = new Date();
    const currentMonthStr = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    const household = await prisma.household.findUnique({ where: { id: householdId } });
    const expenses = await prisma.expense.findMany({
      where: { householdId, softDelete: false },
      orderBy: { date: 'desc' },
      take: 25,
    });
    const incomes = await prisma.income.findMany({
      where: { householdId, softDelete: false },
    });
    const bills = await prisma.bill.findMany({
      where: { householdId, softDelete: false },
      orderBy: { dueDate: 'asc' },
    });
    const lowStock = await prisma.groceryItem.findMany({
      where: { householdId, softDelete: false, quantity: { lte: 2 } },
    });

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const savings = totalIncome - totalExpenses;

    const pdfBuffer = await generateMonthlyPDFReport({
      householdName: household?.name || 'HomeMind Household',
      month: currentMonthStr,
      totalExpenses,
      totalIncome,
      savings,
      expenses: expenses.map((e) => ({
        title: e.title,
        category: e.category,
        amount: e.amount,
        date: e.date.toISOString(),
      })),
      bills: bills.map((b) => ({
        title: b.title,
        amount: b.amount,
        status: b.status,
        dueDate: b.dueDate.toISOString(),
      })),
      lowStockItems: lowStock.map((l) => ({
        name: l.name,
        quantity: l.quantity,
        unit: l.unit,
      })),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="HomeMind_Monthly_Report_${now.toISOString().split('T')[0]}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('[exportMonthlyReport] Error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate PDF report' });
  }
};

/**
 * Get Comprehensive Household Analytics Summary
 */
export const getAnalyticsSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      expenses,
      incomes,
      bills,
      tasks,
      groceries,
      appliances,
      sustainability,
      users,
    ] = await Promise.all([
      prisma.expense.findMany({ where: { householdId, softDelete: false } }),
      prisma.income.findMany({ where: { householdId, softDelete: false } }),
      prisma.bill.findMany({ where: { householdId, softDelete: false } }),
      prisma.task.findMany({ where: { householdId, softDelete: false } }),
      prisma.groceryItem.findMany({ where: { householdId, softDelete: false } }),
      prisma.appliance.findMany({ where: { householdId, softDelete: false } }),
      prisma.sustainabilityMetric.findMany({ where: { householdId, softDelete: false } }),
      prisma.user.findMany({ where: { householdId, softDelete: false } }),
    ]);

    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const monthlyExpenses = expenses
      .filter((e) => new Date(e.date) >= startOfMonth)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const monthlyIncome = incomes
      .filter((i) => new Date(i.createdAt) >= startOfMonth)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 100;

    const expiringGroceries = groceries.filter(
      (g) => g.expiryDate && new Date(g.expiryDate).getTime() - now.getTime() < 3 * 86400000
    ).length;

    const categoryMap: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });

    res.json({
      householdMetrics: {
        totalExpense,
        totalIncome,
        netSavings: totalIncome - totalExpense,
        monthlyExpenses,
        monthlyIncome,
        monthlySavings: monthlyIncome - monthlyExpenses,
      },
      operationalMetrics: {
        totalMembers: users.length,
        totalTasks: tasks.length,
        completedTasks,
        taskCompletionRate,
        totalGroceries: groceries.length,
        expiringGroceries,
        totalAppliances: appliances.length,
        totalBills: bills.length,
        pendingBills: bills.filter((b) => b.status !== 'PAID').length,
      },
      categoryDistribution: categoryMap,
    });
  } catch (err: any) {
    console.error('[getAnalyticsSummary] Error:', err.message);
    res.status(500).json({ error: 'Failed to aggregate analytics summary' });
  }
};
