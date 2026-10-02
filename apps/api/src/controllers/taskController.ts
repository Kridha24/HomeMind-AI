import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { invalidateHouseholdDashboard } from '../infrastructure/redis/redisClient';

export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const tasks = await prisma.task.findMany({
      where: { householdId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json({ tasks });
  } catch (err: any) {
    console.error('[getTasks] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const creatorId = req.user?.userId;
    if (!householdId || !creatorId) return res.status(400).json({ error: 'Missing context' });

    const { title, description, priority, dueDate, assigneeId, isRecurring } = req.body;

    if (assigneeId) {
      const assigneeMember = await prisma.user.findFirst({
        where: { id: assigneeId, householdId }
      });
      if (!assigneeMember) {
        return res.status(400).json({ error: 'Assignee is not a member of this household' });
      }
    }

    const task = await prisma.task.create({
      data: {
        householdId,
        creatorId,
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: new Date(dueDate),
        assigneeId: assigneeId || null,
        isRecurring: isRecurring || false
      },
      include: { assignee: true }
    });

    await invalidateHouseholdDashboard(householdId).catch(() => {});

    res.status(201).json({ task });
  } catch (err: any) {
    console.error('[createTask] Error:', err.message);
    res.status(500).json({ error: 'Failed to create task.' });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const householdId = req.user?.householdId;
    const { title, description, priority, dueDate, assigneeId, status, isRecurring } = req.body;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const existing = await prisma.task.findFirst({ where: { id, householdId } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    if (assigneeId) {
      const assigneeMember = await prisma.user.findFirst({
        where: { id: assigneeId, householdId }
      });
      if (!assigneeMember) {
        return res.status(400).json({ error: 'Assignee is not a member of this household' });
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        priority: priority !== undefined ? priority : existing.priority,
        dueDate: dueDate !== undefined ? new Date(dueDate) : existing.dueDate,
        assigneeId: assigneeId !== undefined ? assigneeId : existing.assigneeId,
        status: status !== undefined ? status : existing.status,
        isRecurring: isRecurring !== undefined ? isRecurring : existing.isRecurring
      },
      include: { assignee: true }
    });

    await invalidateHouseholdDashboard(householdId).catch(() => {});

    res.json({ success: true, task: updated });
  } catch (err: any) {
    console.error('[updateTask] Error:', err.message);
    res.status(500).json({ error: 'Failed to update task.' });
  }
};

export const updateTaskStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const householdId = req.user?.householdId;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const existing = await prisma.task.findFirst({ where: { id, householdId } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const task = await prisma.task.update({
      where: { id },
      data: { status }
    });

    await invalidateHouseholdDashboard(householdId).catch(() => {});

    res.json({ task });
  } catch (err: any) {
    console.error('[updateTaskStatus] Error:', err.message);
    res.status(500).json({ error: 'Failed to update task status.' });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const householdId = req.user?.householdId;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const existing = await prisma.task.findFirst({ where: { id, householdId } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    await prisma.task.delete({ where: { id } });

    await invalidateHouseholdDashboard(householdId).catch(() => {});

    res.json({ success: true, id });
  } catch (err: any) {
    console.error('[deleteTask] Error:', err.message);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
};
