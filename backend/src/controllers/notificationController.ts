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
    console.error('[getNotifications] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const householdId = req.user?.householdId;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    // Verify the notification belongs to this household before marking read (IDOR protection).
    const existing = await prisma.notification.findFirst({ where: { id, householdId } });
    if (!existing) return res.status(404).json({ error: 'Notification not found' });

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ notification });
  } catch (err: any) {
    console.error('[markAsRead] Error:', err.message);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
};
