import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getBills = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const isMember = req.user?.role === 'MEMBER';

    const whereClause = isMember
      ? { householdId, createdBy: req.user?.userId }
      : { householdId };

    const bills = await prisma.bill.findMany({
      where: whereClause,
      orderBy: { dueDate: 'asc' }
    });

    res.json({ bills });
  } catch (err: any) {
    console.error('[getBills] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch bills.' });
  }
};

export const createBill = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const { title, category, amount, dueDate, provider, notes } = req.body;

    const bill = await prisma.bill.create({
      data: {
        householdId,
        title,
        category,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        provider,
        notes,
        createdBy: req.user?.userId
      }
    });

    res.status(201).json({ bill });
  } catch (err: any) {
    console.error('[createBill] Error:', err.message);
    res.status(500).json({ error: 'Failed to create bill.' });
  }
};

export const updateBill = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const householdId = req.user?.householdId;
    const { title, category, amount, dueDate, provider, notes } = req.body;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const existing = await prisma.bill.findFirst({
      where: { id, householdId }
    });

    if (!existing) return res.status(404).json({ error: 'Bill not found' });

    const updated = await prisma.bill.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        category: category !== undefined ? category : existing.category,
        amount: amount !== undefined ? parseFloat(amount) : existing.amount,
        dueDate: dueDate !== undefined ? new Date(dueDate) : existing.dueDate,
        provider: provider !== undefined ? provider : existing.provider,
        notes: notes !== undefined ? notes : existing.notes
      }
    });

    res.json({ success: true, bill: updated });
  } catch (err: any) {
    console.error('[updateBill] Error:', err.message);
    res.status(500).json({ error: 'Failed to update bill.' });
  }
};

export const deleteBill = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const householdId = req.user?.householdId;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const existing = await prisma.bill.findFirst({
      where: { id, householdId }
    });

    if (!existing) return res.status(404).json({ error: 'Bill not found' });

    await prisma.bill.delete({ where: { id } });
    res.json({ success: true, id });
  } catch (err: any) {
    console.error('[deleteBill] Error:', err.message);
    res.status(500).json({ error: 'Failed to delete bill.' });
  }
};

export const markBillPaid = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const householdId = req.user?.householdId;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const existing = await prisma.bill.findFirst({ where: { id, householdId } });
    if (!existing) return res.status(404).json({ error: 'Bill not found' });

    const bill = await prisma.bill.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    });

    // Automatically record as an expense too
    if (req.user?.userId && req.user?.householdId) {
      await prisma.expense.create({
        data: {
          householdId: req.user.householdId,
          userId: req.user.userId,
          title: `Paid Bill: ${bill.title}`,
          amount: bill.amount,
          category: bill.category,
          date: new Date()
        }
      });
    }

    res.json({ bill });
  } catch (err: any) {
    console.error('[markBillPaid] Error:', err.message);
    res.status(500).json({ error: 'Failed to mark bill as paid.' });
  }
};
