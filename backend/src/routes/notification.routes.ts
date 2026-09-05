import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const controller = new NotificationController();

router.use(authMiddleware);

router.get('/', controller.getUserNotifications);
router.put('/read-all', controller.markAllAsRead);
router.put('/:id/read', controller.markAsRead);
router.delete('/:id', controller.deleteNotification);

export default router;
