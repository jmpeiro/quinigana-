import { Router } from 'express';
import { GamificationController } from '../controllers/gamification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/me', GamificationController.getMyGamification);
router.get('/badges', GamificationController.getAllBadges);
router.post('/badges/seen', GamificationController.markBadgesSeen);

export default router;
