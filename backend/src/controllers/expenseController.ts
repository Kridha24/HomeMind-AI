import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getExpenses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const isMember = req.user?.role === 'MEMBER';

    // Privacy Filtering: MEMBER sees only their own financial data
    const expenseWhereClause = isMember
      ? { householdId, userId: req.user?.userId }
      : { householdId };

    const incomeWhereClause = isMember
      ? { householdId, createdBy: req.user?.userId }
      : { householdId };

    const expenses = await prisma.expense.findMany({
      where: expenseWhereClause,
      orderBy: { date: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });

    const incomes = await prisma.income.findMany({
      where: incomeWhereClause,
      orderBy: { date: 'desc' }
    });

    const budgets = await prisma.budget.findMany({
      where: { householdId }
    });

    res.json({ expenses, incomes, budgets });
  } catch (err: any) {
    console.error('[getExpenses] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
};

export const createExpense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const userId = req.user?.userId;
    if (!householdId || !userId) return res.status(400).json({ error: 'Missing context' });

    const { title, amount, category, date, isRecurring, receiptUrl } = req.body;

    const expense = await prisma.expense.create({
      data: {
        householdId,
        userId,
        title,
        amount: parseFloat(amount),
        category,
        date: date ? new Date(date) : new Date(),
        isRecurring: isRecurring || false,
        receiptUrl
      }
    });

    res.status(201).json({ expense });
  } catch (err: any) {
    console.error('[createExpense] Error:', err.message);
    res.status(500).json({ error: 'Failed to create expense.' });
  }
};

export const deleteExpense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const householdId = req.user?.householdId;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    // Verify expense belongs to this household before deletion.
    // Members can only delete their own expenses; ADMIN/HEAD can delete any.
    const expense = await prisma.expense.findFirst({
      where: { id, householdId }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (role === 'MEMBER' && expense.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own expenses' });
    }

    await prisma.expense.delete({ where: { id } });
    res.json({ success: true, id });
  } catch (err: any) {
    console.error('[deleteExpense] Error:', err.message);
    res.status(500).json({ error: 'Failed to delete expense.' });
  }
};
