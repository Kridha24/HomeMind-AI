import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const notifications = await prisma.notification.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const unreadCount = await prisma.notification.count({
      where: { householdId, isRead: false }
    });

    res.json({ notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json({ notification });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
