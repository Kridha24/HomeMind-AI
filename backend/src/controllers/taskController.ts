import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';

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
    res.status(500).json({ error: err.message });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const creatorId = req.user?.userId;
    if (!householdId || !creatorId) return res.status(400).json({ error: 'Missing context' });

    const { title, description, priority, dueDate, assigneeId, isRecurring } = req.body;

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

    res.status(201).json({ task });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTaskStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: { status }
    });

    res.json({ task });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
