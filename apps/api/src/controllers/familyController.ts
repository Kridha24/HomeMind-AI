import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { emitHouseholdUpdate, emitMemberUpdate } from '../services/realtimeGateway';
import { invalidateHouseholdDashboard } from '../infrastructure/redis/redisClient';
import {
  canViewHouseholdFinancials,
  canViewOtherMemberFinancials,
  canPromoteCoOwner,
} from '../utils/permissions';

export const getHouseholdMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const household = await prisma.household.findFirst({
      where: { id: householdId, softDelete: false },
      include: {
        members: {
          where: { softDelete: false },
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
            avatar: true,
            createdAt: true,
            lastLogin: true,
          }
        }
      }
    });

    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json({
      household: {
        id: household.id,
        name: household.name,
        inviteCode: household.inviteCode,
        createdAt: household.createdAt,
        membersCount: household.members.length,
        members: household.members,
      },
      members: household.members,
    });
  } catch (err: any) {
    console.error('[getHouseholdMembers] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch household members.' });
  }
};

export const updateMemberRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.params.userId || req.params.targetUserId || req.params.memberId;
    const { role } = req.body;
    const requesterId = req.user?.userId;
    const householdId = req.user?.householdId;
    const requesterRole = req.user?.role;

    if (!householdId || !requesterId) {
      return res.status(400).json({ error: 'Household context missing' });
    }

    // Only OWNER, CO-OWNER, ADMIN or HEAD can change member roles.
    if (requesterRole !== 'OWNER' && requesterRole !== 'CO-OWNER' && requesterRole !== 'ADMIN' && requesterRole !== 'HEAD') {
      return res.status(403).json({ error: 'Only household owners and admins can update member roles' });
    }

    // Only OWNER can promote someone to CO-OWNER (Part 1, 2, 7)
    if (role === 'CO-OWNER' && !canPromoteCoOwner(requesterRole)) {
      return res.status(403).json({ error: 'Only household owners can promote a member to co-owner' });
    }

    const allowedRoles = canPromoteCoOwner(requesterRole)
      ? ['CO-OWNER', 'ADMIN', 'MEMBER', 'GUEST']
      : ['ADMIN', 'MEMBER', 'GUEST'];

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

    // Only OWNER can modify another Admin or Co-Owner
    if ((targetUser.role === 'ADMIN' || targetUser.role === 'CO-OWNER') && requesterRole !== 'OWNER') {
      return res.status(403).json({ error: 'Only household owners can change an admin or co-owner role' });
    }

    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    });

    await prisma.auditLog.create({
      data: {
        householdId,
        action: 'UPDATE_ROLE',
        entity: 'User',
        details: `Role for ${targetUser.name} changed from ${targetUser.role} to ${role}`,
        performedBy: requesterId
      }
    });

    emitMemberUpdate(householdId, { action: 'role_updated', userId: targetUserId, newRole: role, member: user });
    await invalidateHouseholdDashboard(householdId).catch(() => {});

    res.json({ user });
  } catch (err: any) {
    console.error('[updateMemberRole] Error:', err.message);
    res.status(500).json({ error: 'Failed to update member role.' });
  }
};

export const transferOwnership = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.user?.userId;
    const householdId = req.user?.householdId;
    const requesterRole = req.user?.role;
    const { newOwnerId } = req.body;

    if (!householdId || !requesterId) {
      return res.status(400).json({ error: 'Household context missing' });
    }

    if (requesterRole !== 'OWNER') {
      return res.status(403).json({ error: 'Only the current household owner can transfer ownership' });
    }

    if (!newOwnerId || newOwnerId === requesterId) {
      return res.status(400).json({ error: 'Please specify a different active member to transfer ownership to' });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: newOwnerId, householdId, softDelete: false }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found in this household' });
    }

    // Atomically transfer ownership
    await prisma.$transaction([
      prisma.user.update({
        where: { id: newOwnerId },
        data: { role: 'OWNER' }
      }),
      prisma.user.update({
        where: { id: requesterId },
        data: { role: 'ADMIN' }
      }),
      prisma.auditLog.create({
        data: {
          householdId,
          action: 'OWNERSHIP_TRANSFERRED',
          entity: 'Household',
          details: `Ownership transferred to ${targetUser.name} (${newOwnerId})`,
          performedBy: requesterId
        }
      })
    ]);

    emitMemberUpdate(householdId, { action: 'ownership_transferred', newOwnerId, previousOwnerId: requesterId });
    await invalidateHouseholdDashboard(householdId).catch(() => {});

    res.json({
      success: true,
      message: `Ownership successfully transferred to ${targetUser.name}.`,
      newOwner: { id: targetUser.id, name: targetUser.name, role: 'OWNER' }
    });
  } catch (err: any) {
    console.error('[transferOwnership] Error:', err.message);
    res.status(500).json({ error: 'Failed to transfer household ownership.' });
  }
};

export const removeHouseholdMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId: targetUserId } = req.params;
    const requesterId = req.user?.userId;
    const householdId = req.user?.householdId;
    const requesterRole = req.user?.role;

    if (!householdId || !requesterId) {
      return res.status(400).json({ error: 'Household context missing' });
    }

    if (requesterRole !== 'OWNER' && requesterRole !== 'CO-OWNER' && requesterRole !== 'ADMIN' && requesterRole !== 'HEAD') {
      return res.status(403).json({ error: 'Only household owners and admins can remove members' });
    }

    if (targetUserId === requesterId) {
      return res.status(400).json({ error: 'You cannot remove yourself. Please use Leave Household instead.' });
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, householdId, softDelete: false }
    });
    if (!targetUser) {
      return res.status(404).json({ error: 'Member not found in this household' });
    }

    // Admins cannot remove Owners
    if (targetUser.role === 'OWNER' && requesterRole !== 'OWNER') {
      return res.status(403).json({ error: 'Only household owners can remove an owner' });
    }

    // Create a new individual household for the removed user so they are not left orphan
    const personalHousehold = await prisma.household.create({
      data: {
        name: `${targetUser.name}'s Household`,
        inviteCode: 'HM-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      }
    });

    await prisma.setting.create({
      data: {
        householdId: personalHousehold.id,
        country: 'IN',
        currency: 'INR',
        theme: 'dark'
      }
    });

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        householdId: personalHousehold.id,
        role: 'OWNER'
      }
    });

    // Invalidate removed user's refresh tokens for security
    await prisma.refreshToken.deleteMany({ where: { userId: targetUserId } });

    await prisma.auditLog.create({
      data: {
        householdId,
        action: 'REMOVE_MEMBER',
        entity: 'User',
        details: `Member ${targetUser.name} removed from household`,
        performedBy: requesterId
      }
    });

    emitMemberUpdate(householdId, { action: 'member_removed', removedUserId: targetUserId });
    await invalidateHouseholdDashboard(householdId).catch(() => {});

    res.json({ success: true, message: `Member ${targetUser.name} removed successfully.` });
  } catch (err: any) {
    console.error('[removeHouseholdMember] Error:', err.message);
    res.status(500).json({ error: 'Failed to remove household member.' });
  }
};

export const leaveHousehold = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const householdId = req.user?.householdId;
    const role = req.user?.role;

    if (!userId || !householdId) {
      return res.status(400).json({ error: 'Household context missing' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId, softDelete: false } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If user is OWNER, check if there are other owners
    if (role === 'OWNER') {
      const otherOwners = await prisma.user.count({
        where: { householdId, role: 'OWNER', id: { not: userId }, softDelete: false }
      });
      const otherMembers = await prisma.user.count({
        where: { householdId, id: { not: userId }, softDelete: false }
      });

      if (otherOwners === 0 && otherMembers > 0) {
        return res.status(400).json({
          error: 'As the sole owner of a household with other members, you must transfer ownership to another member before leaving.'
        });
      }
    }

    // Create a new separate personal household for the leaving user
    const personalHousehold = await prisma.household.create({
      data: {
        name: `${user.name}'s Household`,
        inviteCode: 'HM-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      }
    });

    await prisma.setting.create({
      data: {
        householdId: personalHousehold.id,
        country: 'IN',
        currency: 'INR',
        theme: 'dark'
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        householdId: personalHousehold.id,
        role: 'OWNER'
      }
    });

    // Revoke refresh tokens so user gets fresh session token on next exchange
    await prisma.refreshToken.deleteMany({ where: { userId } });

    await prisma.auditLog.create({
      data: {
        householdId,
        action: 'MEMBER_LEFT',
        entity: 'User',
        details: `${user.name} left the household`,
        performedBy: userId
      }
    });

    emitMemberUpdate(householdId, { action: 'member_left', userId });
    await invalidateHouseholdDashboard(householdId).catch(() => {});

    res.json({
      success: true,
      message: 'Successfully left household.',
      household: personalHousehold
    });
  } catch (err: any) {
    console.error('[leaveHousehold] Error:', err.message);
    res.status(500).json({ error: 'Failed to leave household.' });
  }
};

export const deleteHousehold = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const householdId = req.user?.householdId;
    const requesterRole = req.user?.role;

    if (!userId || !householdId) {
      return res.status(400).json({ error: 'Household context missing' });
    }

    if (requesterRole !== 'OWNER') {
      return res.status(403).json({ error: 'Only household owners can delete the household' });
    }

    if (id !== householdId) {
      return res.status(400).json({ error: 'Cannot delete a household you are not currently operating in' });
    }

    // Soft delete the household
    await prisma.household.update({
      where: { id: householdId },
      data: { softDelete: true }
    });

    // Create a clean new private household for the user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const newHousehold = await prisma.household.create({
      data: {
        name: `${user?.name || 'Personal'}'s Residence`,
        inviteCode: 'HM-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      }
    });

    await prisma.setting.create({
      data: {
        householdId: newHousehold.id,
        country: 'IN',
        currency: 'INR',
        theme: 'dark'
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        householdId: newHousehold.id,
        role: 'OWNER'
      }
    });

    emitHouseholdUpdate(householdId, { action: 'household_deleted', householdId });
    await invalidateHouseholdDashboard(householdId).catch(() => {});

    res.json({
      success: true,
      message: 'Household deleted successfully.',
      household: newHousehold
    });
  } catch (err: any) {
    console.error('[deleteHousehold] Error:', err.message);
    res.status(500).json({ error: 'Failed to delete household.' });
  }
};

export const joinHouseholdWithCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user?.userId;
    const currentHouseholdId = req.user?.householdId;

    if (!userId) return res.status(400).json({ error: 'User context missing' });
    if (!inviteCode || typeof inviteCode !== 'string') {
      return res.status(400).json({ error: 'Valid invitation code is required' });
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    const newHousehold = await prisma.household.findFirst({
      where: { inviteCode: cleanCode, softDelete: false }
    });
    if (!newHousehold) return res.status(404).json({ error: 'Invalid invitation code' });

    // Do not rejoin the same household.
    if (newHousehold.id === currentHouseholdId) {
      return res.status(400).json({ error: 'You are already a member of this household' });
    }

    // Move user to the new household
    await prisma.user.update({
      where: { id: userId },
      data: { householdId: newHousehold.id, role: 'MEMBER' }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, householdId: true }
    });

    await prisma.auditLog.create({
      data: {
        householdId: newHousehold.id,
        action: 'MEMBER_JOINED',
        entity: 'User',
        details: `${updatedUser?.name} joined the household using invite code`,
        performedBy: userId
      }
    });

    emitMemberUpdate(newHousehold.id, { action: 'member_joined', user: updatedUser });
    if (currentHouseholdId) {
      emitMemberUpdate(currentHouseholdId, { action: 'member_left', userId });
      await invalidateHouseholdDashboard(currentHouseholdId).catch(() => {});
    }
    await invalidateHouseholdDashboard(newHousehold.id).catch(() => {});

    res.json({ user: updatedUser, household: newHousehold });
  } catch (err: any) {
    console.error('[joinHouseholdWithCode] Error:', err.message);
    res.status(500).json({ error: 'Failed to join household.' });
  }
};

export const regenerateInviteCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const requesterRole = req.user?.role;
    const requesterId = req.user?.userId;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    if (requesterRole !== 'OWNER' && requesterRole !== 'CO-OWNER' && requesterRole !== 'ADMIN' && requesterRole !== 'HEAD') {
      return res.status(403).json({ error: 'Only household owners and admins can regenerate invite codes' });
    }

    const newCode = 'HM-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const updated = await prisma.household.update({
      where: { id: householdId },
      data: { inviteCode: newCode }
    });

    await prisma.auditLog.create({
      data: {
        householdId,
        action: 'INVITE_CODE_REGENERATED',
        entity: 'Household',
        details: `Invite code regenerated to ${newCode}`,
        performedBy: requesterId || 'system'
      }
    });

    emitHouseholdUpdate(householdId, { action: 'code_regenerated', inviteCode: newCode });

    res.json({
      success: true,
      message: 'Household invite code regenerated.',
      inviteCode: updated.inviteCode
    });
  } catch (err: any) {
    console.error('[regenerateInviteCode] Error:', err.message);
    res.status(500).json({ error: 'Failed to regenerate invite code.' });
  }
};

export const getHouseholdActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const logs = await prisma.auditLog.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Lookup performer names
    const performerIds = Array.from(new Set(logs.map((l) => l.performedBy).filter(Boolean)));
    const performers = await prisma.user.findMany({
      where: { id: { in: performerIds } },
      select: { id: true, name: true, role: true }
    });
    const performerMap = new Map(performers.map((p) => [p.id, p.name]));

    const activities = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      details: log.details,
      performerName: performerMap.get(log.performedBy) || log.performedBy || 'Household System',
      createdAt: log.createdAt,
    }));

    res.json({ activities });
  } catch (err: any) {
    console.error('[getHouseholdActivity] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch household activity.' });
  }
};

export const getAvailableHouseholds = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const currentHouseholdId = req.user?.householdId;

    if (!userId || !currentHouseholdId) {
      return res.status(400).json({ error: 'User context missing' });
    }

    // Find current household and any households where this user is active or owns
    const currentHousehold = await prisma.household.findFirst({
      where: { id: currentHouseholdId, softDelete: false },
      include: {
        _count: {
          select: { members: { where: { softDelete: false } } }
        }
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const households = [];
    if (currentHousehold) {
      households.push({
        id: currentHousehold.id,
        name: currentHousehold.name,
        inviteCode: currentHousehold.inviteCode,
        role: user?.role || 'MEMBER',
        memberCount: currentHousehold._count.members,
        isCurrent: true,
      });
    }

    res.json({ households });
  } catch (err: any) {
    console.error('[getAvailableHouseholds] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch available households.' });
  }
};

export const switchHousehold = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { householdId: targetHouseholdId } = req.body;
    const userId = req.user?.userId;
    const currentHouseholdId = req.user?.householdId;

    if (!userId) return res.status(400).json({ error: 'User context missing' });
    if (!targetHouseholdId) return res.status(400).json({ error: 'Target householdId is required' });

    if (targetHouseholdId === currentHouseholdId) {
      const current = await prisma.household.findFirst({ where: { id: currentHouseholdId } });
      const currentU = await prisma.user.findUnique({ where: { id: userId } });
      return res.json({ user: currentU, household: current });
    }

    const targetHousehold = await prisma.household.findFirst({
      where: { id: targetHouseholdId, softDelete: false }
    });

    if (!targetHousehold) {
      return res.status(404).json({ error: 'Household not found' });
    }

    // Update user's active household
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { householdId: targetHousehold.id }
    });

    emitMemberUpdate(targetHousehold.id, { action: 'member_joined', user: updatedUser });
    if (currentHouseholdId) {
      emitMemberUpdate(currentHouseholdId, { action: 'member_left', userId });
      await invalidateHouseholdDashboard(currentHouseholdId).catch(() => {});
    }
    await invalidateHouseholdDashboard(targetHousehold.id).catch(() => {});

    res.json({
      success: true,
      message: `Switched to ${targetHousehold.name}`,
      user: updatedUser,
      household: targetHousehold,
    });
  } catch (err: any) {
    console.error('[switchHousehold] Error:', err.message);
    res.status(500).json({ error: 'Failed to switch household.' });
  }
};

export const getAggregateData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const requesterRole = req.user?.role;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    // Strict RBAC: Only OWNER and CO-OWNER can view household-wide aggregate financials
    if (!canViewHouseholdFinancials(requesterRole)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to view household aggregate financials' });
    }

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

/**
 * GET /api/v1/family/members/:memberId/overview
 * Returns member collaboration overview (profile, tasks, and authorized member finance).
 * If caller is OWNER or CO-OWNER, full finance details are attached.
 * If caller is MEMBER/GUEST viewing another user, finance is strictly omitted.
 */
export const getMemberOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    const { memberId } = req.params;

    if (!householdId || !requesterId) {
      return res.status(400).json({ error: 'Household context missing' });
    }

    // Verify target member is in the same household (IDOR protection)
    const member = await prisma.user.findFirst({
      where: { id: memberId, householdId, softDelete: false },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        avatar: true,
        createdAt: true,
        isActive: true,
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found in this household' });
    }

    // Responsibilities (Active & Completed Tasks)
    const [activeTasks, completedTasksCount] = await Promise.all([
      prisma.task.findMany({
        where: { householdId, assigneeId: memberId, softDelete: false, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      prisma.task.count({
        where: { householdId, assigneeId: memberId, softDelete: false, status: 'COMPLETED' },
      }),
    ]);

    // Financial summary: OWNER, CO-OWNER, or viewing self only (Part 9, 10, 11, 12, 13)
    const hasFinancialVisibility = canViewOtherMemberFinancials(requesterRole) || requesterId === memberId;

    let finance: any = null;
    if (hasFinancialVisibility) {
      const [expenseAgg, incomeAgg, recentTransactions] = await Promise.all([
        prisma.expense.aggregate({
          where: { householdId, userId: memberId, softDelete: false },
          _sum: { amount: true },
        }),
        prisma.income.aggregate({
          where: { householdId, createdBy: memberId, softDelete: false },
          _sum: { amount: true },
        }),
        prisma.transaction.findMany({
          where: { householdId, userId: memberId, softDelete: false },
          orderBy: { occurredAt: 'desc' },
          take: 10,
        }),
      ]);

      const incomeTotal = incomeAgg._sum.amount || 0;
      const expenseTotal = expenseAgg._sum.amount || 0;
      const netBalance = incomeTotal - expenseTotal;

      finance = {
        totalIncome: incomeTotal,
        totalExpenses: expenseTotal,
        incomeTotal,
        expenseTotal,
        netBalance,
        recentTransactions,
      };
    }

    // Recent member activity
    const activity = await prisma.auditLog.findMany({
      where: { householdId, performedBy: memberId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    return res.json({
      profile: member,
      responsibilities: {
        activeTasksCount: activeTasks.length,
        completedTasksCount,
        activeTasks,
      },
      finance: hasFinancialVisibility ? finance : null,
      activity,
    });
  } catch (err: any) {
    console.error('[getMemberOverview] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch member overview.' });
  }
};

/**
 * GET /api/v1/family/members/:memberId/financial-summary
 * Strict financial endpoint for member intelligence.
 * Returns 403 Forbidden for MEMBER and GUEST (Part 3 & Part 41).
 */
export const getMemberFinancialSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;
    const { memberId } = req.params;

    if (!householdId || !requesterId) {
      return res.status(400).json({ error: 'Household context missing' });
    }

    // Strict Authorization check (Part 3 & Part 41)
    const isAllowed = canViewOtherMemberFinancials(requesterRole) || requesterId === memberId;
    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to view member financials' });
    }

    // Verify member belongs to household
    const member = await prisma.user.findFirst({
      where: { id: memberId, householdId, softDelete: false },
    });
    if (!member) {
      return res.status(404).json({ error: 'Member not found in this household' });
    }

    const [expenseAgg, incomeAgg, recentTransactions] = await Promise.all([
      prisma.expense.aggregate({
        where: { householdId, userId: memberId, softDelete: false },
        _sum: { amount: true },
      }),
      prisma.income.aggregate({
        where: { householdId, createdBy: memberId, softDelete: false },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { householdId, userId: memberId, softDelete: false },
        orderBy: { occurredAt: 'desc' },
        take: 10,
      }),
    ]);

    const incomeTotal = incomeAgg._sum.amount || 0;
    const expenseTotal = expenseAgg._sum.amount || 0;
    const netBalance = incomeTotal - expenseTotal;

    return res.json({
      memberId,
      incomeTotal,
      expenseTotal,
      netBalance,
      recentTransactions,
    });
  } catch (err: any) {
    console.error('[getMemberFinancialSummary] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch member financial summary.' });
  }
};

export const updateHouseholdName = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const requesterRole = req.user?.role;
    const requesterId = req.user?.userId;
    const { name } = req.body;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });
    if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Name is required' });

    // Only OWNER, CO-OWNER, ADMIN or HEAD can rename the household.
    if (requesterRole !== 'OWNER' && requesterRole !== 'CO-OWNER' && requesterRole !== 'ADMIN' && requesterRole !== 'HEAD') {
      return res.status(403).json({ error: 'Only household owners and admins can rename the household' });
    }

    const updated = await prisma.household.update({
      where: { id: householdId },
      data: { name: name.trim() }
    });

    await prisma.auditLog.create({
      data: {
        householdId,
        action: 'UPDATE_NAME',
        entity: 'Household',
        details: `Household renamed to "${name.trim()}"`,
        performedBy: requesterId || 'system'
      }
    });

    emitHouseholdUpdate(householdId, { action: 'name_updated', name: name.trim() });
    await invalidateHouseholdDashboard(householdId).catch(() => {});

    res.json({ household: updated });
  } catch (err: any) {
    console.error('[updateHouseholdName] Error:', err.message);
    res.status(500).json({ error: 'Failed to update household name.' });
  }
};
