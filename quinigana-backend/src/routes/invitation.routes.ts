import { Router } from 'express';
import { InvitationController } from '../controllers/invitation.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/pending', InvitationController.getPending);
router.post('/:id/accept', InvitationController.accept);
router.post('/:id/reject', InvitationController.reject);

export default router;
