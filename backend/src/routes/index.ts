import { Router } from 'express';
import authRoutes from './auth.routes';
import creditRequestRoutes from './credit-request.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/credit-requests', creditRequestRoutes);
router.use('/notifications', notificationRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

export default router;
