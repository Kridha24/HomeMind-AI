import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateMonthlyPDFReport } from '../services/reportGenerator';

export const exportMonthlyReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const household = await prisma.household.findUnique({ where: { id: householdId } });
    const expenses = await prisma.expense.findMany({
      where: { householdId, softDelete: false },
      orderBy: { date: 'desc' },
      take: 20
    });
    const bills = await prisma.bill.findMany({ where: { householdId, softDelete: false } });
    const lowStock = await prisma.groceryItem.findMany({
      where: { householdId, softDelete: false, quantity: { lte: 2 } }
    });

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalIncome = 3500;
    const savings = totalIncome - totalExpenses;

    const pdfBuffer = await generateMonthlyPDFReport({
      householdName: household?.name || 'HomeMind Household',
      month: 'July 2026',
      totalExpenses,
      totalIncome,
      savings,
      expenses: expenses.map(e => ({ title: e.title, category: e.category, amount: e.amount, date: e.date.toISOString() })),
      bills: bills.map(b => ({ title: b.title, amount: b.amount, status: b.status, dueDate: b.dueDate.toISOString() })),
      lowStockItems: lowStock.map(l => ({ name: l.name, quantity: l.quantity, unit: l.unit }))
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=HomeMind_Monthly_Report.pdf');
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
      medicines
    ] = await Promise.all([
      prisma.expense.findMany({ where: { householdId, softDelete: false } }),
      prisma.income.findMany({ where: { householdId, softDelete: false } }),
      prisma.bill.findMany({ where: { householdId, softDelete: false } }),
      prisma.task.findMany({ where: { householdId, softDelete: false } }),
      prisma.groceryItem.findMany({ where: { householdId, softDelete: false } }),
      prisma.appliance.findMany({ where: { householdId, softDelete: false } }),
      prisma.medicine.findMany({ where: { householdId, softDelete: false } })
    ]);

    // 1. Calculate Monthly & Overall Totals
    const monthlyExpenses = expenses
      .filter(e => new Date(e.date) >= startOfMonth)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const monthlyIncome = incomes
      .filter(i => new Date(i.date) >= startOfMonth)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const overallExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const overallIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);

    // 2. Expense Category Breakdown
    const categoryMap: Record<string, number> = {};
    expenses.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    const expenseCategories = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: overallExpenses > 0 ? Math.round((amount / overallExpenses) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    // 3. Income Source Breakdown
    const sourceMap: Record<string, number> = {};
    incomes.forEach(i => {
      sourceMap[i.source] = (sourceMap[i.source] || 0) + i.amount;
    });
    const incomeSources = Object.entries(sourceMap).map(([source, amount]) => ({
      source,
      amount,
      percentage: overallIncome > 0 ? Math.round((amount / overallIncome) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    // 4. Bills Settlement Analysis
    const paidBills = bills.filter(b => b.status === 'PAID');
    const unpaidBills = bills.filter(b => b.status === 'UNPAID');
    const paidAmount = paidBills.reduce((acc, curr) => acc + curr.amount, 0);
    const unpaidAmount = unpaidBills.reduce((acc, curr) => acc + curr.amount, 0);
    const billSettlementRate = bills.length > 0 ? Math.round((paidBills.length / bills.length) * 100) : 0;

    // 5. Tasks Completion Breakdown
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter(t => t.status === 'PENDING').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // 6. Inventory & Grocery Health Telemetry
    const lowStockCount = groceries.filter(g => g.quantity <= 2).length;
    const healthyStockCount = groceries.length - lowStockCount;

    res.json({
      summary: {
        monthlyIncome,
        monthlyExpenses,
        monthlySavings: monthlyIncome - monthlyExpenses,
        overallIncome,
        overallExpenses,
        overallSavings: overallIncome - overallExpenses,
        billSettlementRate,
        taskCompletionRate
      },
      expenseCategories,
      incomeSources,
      billsAnalytics: {
        totalBillsCount: bills.length,
        paidCount: paidBills.length,
        unpaidCount: unpaidBills.length,
        paidAmount,
        unpaidAmount
      },
      tasksAnalytics: {
        totalTasksCount: tasks.length,
        completedTasks,
        pendingTasks,
        inProgressTasks
      },
      inventoryAnalytics: {
        totalItems: groceries.length,
        healthyStockCount,
        lowStockCount
      },
      counts: {
        expensesCount: expenses.length,
        incomesCount: incomes.length,
        appliancesCount: appliances.length,
        medicinesCount: medicines.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
