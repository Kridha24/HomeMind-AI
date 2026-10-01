import { Router } from 'express';
import { NotificationController } from './notification.controller';

const router = Router();

router.get('/', NotificationController.getNotifications);
router.put('/:id/read', NotificationController.markAsRead);

export default router;
