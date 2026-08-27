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
 */
export const createIncome = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const { title, amount, source, date, description } = req.body;

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
        description: description || null,
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
 * 3. Update / Edit Existing Income Record
 */
export const updateIncome = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const { id } = req.params;
    const { title, amount, source, date, description } = req.body;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const existing = await prisma.income.findFirst({
      where: { id, householdId, softDelete: false }
    });

    if (!existing) return res.status(404).json({ error: 'Income record not found' });

    const income = await prisma.income.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        amount: amount !== undefined ? parseFloat(amount) : existing.amount,
        source: source !== undefined ? source : existing.source,
        date: date !== undefined ? new Date(date) : existing.date,
        description: description !== undefined ? description : existing.description,
        updatedBy: req.user?.userId
      }
    });

    await prisma.auditLog.create({
      data: {
        householdId,
        action: 'UPDATE',
        entity: 'Income',
        details: `Updated income entry: ${income.title} (${income.amount})`,
        performedBy: req.user?.userId || ''
      }
    });

    res.json({ success: true, income });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * 4. Delete Income Record (Soft Delete)
 */
export const deleteIncome = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const { id } = req.params;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const existing = await prisma.income.findFirst({
      where: { id, householdId }
    });

    if (!existing) return res.status(404).json({ error: 'Income record not found' });

    await prisma.income.update({
      where: { id },
      data: { softDelete: true, updatedBy: req.user?.userId }
    });

    await prisma.auditLog.create({
      data: {
        householdId,
        action: 'DELETE',
        entity: 'Income',
        details: `Deleted income entry: ${existing.title} (${existing.amount})`,
        performedBy: req.user?.userId || ''
      }
    });

    res.json({ success: true, message: 'Income record deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
