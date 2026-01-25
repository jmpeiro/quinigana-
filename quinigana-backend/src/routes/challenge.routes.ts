import { Router } from 'express';
import { ChallengeController } from '../controllers/challenge.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Challenge CRUD
router.post('/', ChallengeController.create);
router.get('/', ChallengeController.getMyChallenges);
router.get('/pending', ChallengeController.getPending);
router.get('/stats', ChallengeController.getMyStats);
router.get('/rivalries', ChallengeController.getRivalries);
router.get('/head-to-head/:opponentId', ChallengeController.getHeadToHead);
router.get('/:id', ChallengeController.getById);
router.post('/:id/accept', ChallengeController.accept);
router.post('/:id/reject', ChallengeController.reject);
router.post('/:id/cancel', ChallengeController.cancel);

export default router;
