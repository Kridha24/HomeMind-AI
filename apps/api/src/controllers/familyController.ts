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
    console.error('[getHouseholdMembers] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch household members.' });
  }
};

export const updateMemberRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId: targetUserId } = req.params;
    const { role } = req.body;
    const requesterId = req.user?.userId;
    const householdId = req.user?.householdId;
    const requesterRole = req.user?.role;

    if (!householdId || !requesterId) {
      return res.status(400).json({ error: 'Household context missing' });
    }

    // Only ADMIN or HEAD can change member roles.
    if (requesterRole !== 'ADMIN' && requesterRole !== 'HEAD') {
      return res.status(403).json({ error: 'Only household admins can update member roles' });
    }

    const allowedRoles = ['ADMIN', 'MEMBER', 'GUEST'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Allowed: ${allowedRoles.join(', ')}` });
    }

    // Verify the target user is in the same household (IDOR protection).
    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, householdId, softDelete: false }
    });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found in this household' });
    }

    // No demoting yourself.
    if (targetUserId === requesterId) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    });

    res.json({ user });
  } catch (err: any) {
    console.error('[updateMemberRole] Error:', err.message);
    res.status(500).json({ error: 'Failed to update member role.' });
  }
};

export const joinHouseholdWithCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user?.userId;
    const currentHouseholdId = req.user?.householdId;

    if (!userId) return res.status(400).json({ error: 'User context missing' });

    const newHousehold = await prisma.household.findFirst({ where: { inviteCode, softDelete: false } });
    if (!newHousehold) return res.status(404).json({ error: 'Invalid invitation code' });

    // Do not rejoin the same household.
    if (newHousehold.id === currentHouseholdId) {
      return res.status(400).json({ error: 'You are already a member of this household' });
    }

    // Move the user to the new household — only their own data.
    // We intentionally do NOT bulk-migrate all their records to prevent data
    // from the old household leaking into the new one. Only the user row itself moves.
    await prisma.user.update({
      where: { id: userId },
      data: { householdId: newHousehold.id, role: 'MEMBER' }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, householdId: true }
    });

    res.json({ user: updatedUser, household: newHousehold });
  } catch (err: any) {
    console.error('[joinHouseholdWithCode] Error:', err.message);
    res.status(500).json({ error: 'Failed to join household.' });
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
    console.error('[getAggregateData] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch aggregate data.' });
  }
};

export const updateHouseholdName = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const requesterRole = req.user?.role;
    const { name } = req.body;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });
    if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Name is required' });

    // Only ADMIN or HEAD can rename the household.
    if (requesterRole !== 'ADMIN' && requesterRole !== 'HEAD') {
      return res.status(403).json({ error: 'Only household admins can rename the household' });
    }

    const updated = await prisma.household.update({
      where: { id: householdId },
      data: { name: name.trim() }
    });

    res.json({ household: updated });
  } catch (err: any) {
    console.error('[updateHouseholdName] Error:', err.message);
    res.status(500).json({ error: 'Failed to update household name.' });
  }
};
