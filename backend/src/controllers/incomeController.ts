import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * 1. Get All Household Income History
 */
export const getIncomes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const isMember = req.user?.role === 'MEMBER';
    
    // Privacy Filtering: MEMBER sees only their own incomes
    const whereClause = isMember 
      ? { householdId, softDelete: false, createdBy: req.user?.userId } 
      : { householdId, softDelete: false };

    const incomes = await prisma.income.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });

    res.json({ incomes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 2. Create New Income Record
 * Body: { title, amount, source, date }
 */
export const createIncome = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const { title, amount, source, date } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ error: 'Income title and amount are required' });
    }

    const income = await prisma.income.create({
      data: {
        householdId,
        title,
        amount: parseFloat(amount),
        source: source || 'Salary',
        date: date ? new Date(date) : new Date(),
        createdBy: req.user?.userId
      }
    });

    await prisma.auditLog.create({
      data: {
        householdId,
        action: 'CREATE',
        entity: 'Income',
        details: `Added income entry: ${title} (${amount})`,
        performedBy: req.user?.userId || ''
      }
    });

    res.status(201).json({ success: true, income });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 3. Delete Income Record
 */
export const deleteIncome = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const { id } = req.params;
    if (!householdId || !id) return res.status(400).json({ error: 'Invalid request' });

    const income = await prisma.income.findFirst({
      where: { id, householdId, softDelete: false }
    });

    if (!income) return res.status(404).json({ error: 'Income record not found' });

    await prisma.income.update({
      where: { id },
      data: { softDelete: true }
    });

    await prisma.auditLog.create({
      data: {
        householdId,
        action: 'DELETE',
        entity: 'Income',
        details: `Deleted income entry: ${income.title}`,
        performedBy: req.user?.userId || ''
      }
    });

    res.json({ success: true, message: 'Income record deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
