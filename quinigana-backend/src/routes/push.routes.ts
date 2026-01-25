import { Router } from 'express';
import { PushSubscriptionController } from '../controllers/push-subscription.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public: frontend needs VAPID key before subscribing
router.get('/vapid-public-key', PushSubscriptionController.getVapidPublicKey);

// Protected endpoints
router.use(authMiddleware);
router.post('/subscribe', PushSubscriptionController.subscribe);
router.delete('/unsubscribe', PushSubscriptionController.unsubscribe);
router.get('/status', PushSubscriptionController.getStatus);

export default router;
