import { Router } from 'express';
import { InvitationController } from '../controllers/invitation.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/invitations/pending:
 *   get:
 *     tags: [Invitations]
 *     summary: Get pending invitations
 *     description: Retrieves all pending invitations for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending invitations returned successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 */
router.get('/pending', InvitationController.getPending);

/**
 * @swagger
 * /api/invitations/{id}/accept:
 *   post:
 *     tags: [Invitations]
 *     summary: Accept an invitation
 *     description: Accepts a pending invitation by its ID, adding the user to the corresponding group.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The invitation ID.
 *     responses:
 *       200:
 *         description: Invitation accepted successfully.
 *       400:
 *         description: Bad request – invitation already processed.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       404:
 *         description: Invitation not found.
 */
router.post('/:id/accept', InvitationController.accept);

/**
 * @swagger
 * /api/invitations/{id}/reject:
 *   post:
 *     tags: [Invitations]
 *     summary: Reject an invitation
 *     description: Rejects a pending invitation by its ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The invitation ID.
 *     responses:
 *       200:
 *         description: Invitation rejected successfully.
 *       400:
 *         description: Bad request – invitation already processed.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       404:
 *         description: Invitation not found.
 */
router.post('/:id/reject', InvitationController.reject);

export default router;
