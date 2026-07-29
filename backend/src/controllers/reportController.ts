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
      where: { householdId },
      orderBy: { date: 'desc' },
      take: 20
    });
    const bills = await prisma.bill.findMany({ where: { householdId } });
    const lowStock = await prisma.groceryItem.findMany({
      where: { householdId, quantity: { lte: 2 } }
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
