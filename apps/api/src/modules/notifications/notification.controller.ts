import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { NotificationService } from './notification.service';

export class NotificationController {
  public static async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      if (!householdId) {
        return res.status(400).json({ error: 'Household context missing' });
      }

      const result = await NotificationService.getNotifications(householdId);
      return res.json(result);
    } catch (err: any) {
      console.error('[NotificationController.getNotifications] Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
  }

  public static async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const householdId = req.user?.householdId;

      if (!householdId) {
        return res.status(400).json({ error: 'Household context missing' });
      }

      const notification = await NotificationService.markAsRead(id, householdId);
      return res.json({ notification });
    } catch (err: any) {
      console.error('[NotificationController.markAsRead] Error:', err.message);
      const status = err.message.includes('not found') ? 404 : 500;
      return res.status(status).json({ error: err.message || 'Failed to mark notification as read.' });
    }
  }
}
