import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getHouseholdMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const household = await prisma.household.findFirst({
      where: { id: householdId, softDelete: false },
      include: {
        members: {
          where: { softDelete: false },
          select: { id: true, name: true, email: true, phoneNumber: true, role: true, avatar: true, createdAt: true }
        }
      }
    });

    res.json({ household });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateMemberRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const joinHouseholdWithCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user?.userId;
    if (!userId) return res.status(400).json({ error: 'User ID missing' });

    const household = await prisma.household.findFirst({ where: { inviteCode, softDelete: false } });
    if (!household) return res.status(404).json({ error: 'Invalid invitation code' });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { householdId: household.id, role: 'MEMBER' }
    });

    res.json({ user: updatedUser, household });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAggregateData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    // Aggregate Total Income
    const incomeAgg = await prisma.income.aggregate({
      where: { householdId, softDelete: false },
      _sum: { amount: true }
    });

    // Aggregate Total Expense
    const expenseAgg = await prisma.expense.aggregate({
      where: { householdId, softDelete: false },
      _sum: { amount: true }
    });

    // Aggregate Total Pending Bills
    const billAgg = await prisma.bill.aggregate({
      where: { householdId, softDelete: false, status: 'UNPAID' },
      _sum: { amount: true }
    });

    res.json({
      totalIncome: incomeAgg._sum.amount || 0,
      totalExpenses: expenseAgg._sum.amount || 0,
      totalPendingBills: billAgg._sum.amount || 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
