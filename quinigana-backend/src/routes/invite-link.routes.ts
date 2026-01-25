import { Router } from 'express';
import { InviteLinkController } from '../controllers/invite-link.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { inviteLimiter } from '../config/rate-limiter';

const router = Router();

// Generate invite link (admin only, auth required, rate limited: 5/hour)
router.post('/groups/:id/generate', authMiddleware, inviteLimiter, InviteLinkController.generate);

// Get invite link info (public - no auth needed to view)
router.get('/:token', InviteLinkController.getInfo);

// Accept invite link (auth required)
router.post('/:token/accept', authMiddleware, InviteLinkController.accept);

export default router;
