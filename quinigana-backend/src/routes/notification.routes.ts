import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/read-all', NotificationController.markAllAsRead);

export default router;
