import { Router } from 'express';
import { InviteLinkController } from '../controllers/invite-link.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { inviteLimiter } from '../config/rate-limiter';

const router = Router();

/**
 * @swagger
 * /api/invite-links/groups/{id}/generate:
 *   post:
 *     tags: [InviteLinks]
 *     summary: Generate an invite link
 *     description: Generates a shareable invite link for a group. Only the group admin can generate links. Rate limited to 5 requests per hour.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID.
 *     responses:
 *       201:
 *         description: Invite link generated successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – only group admins can generate invite links.
 *       404:
 *         description: Group not found.
 */
// Generate invite link (admin only, auth required, rate limited: 5/hour)
router.post('/groups/:id/generate', authMiddleware, inviteLimiter, InviteLinkController.generate);

/**
 * @swagger
 * /api/invite-links/{token}:
 *   get:
 *     tags: [InviteLinks]
 *     summary: Get invite link info
 *     description: Retrieves public information about an invite link, such as the group name and creator. No authentication required.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The invite link token.
 *     responses:
 *       200:
 *         description: Invite link info returned successfully.
 *       404:
 *         description: Invite link not found or expired.
 */
// Get invite link info (public - no auth needed to view)
router.get('/:token', InviteLinkController.getInfo);

/**
 * @swagger
 * /api/invite-links/{token}/accept:
 *   post:
 *     tags: [InviteLinks]
 *     summary: Accept an invite link
 *     description: Accepts an invite link and joins the authenticated user to the corresponding group.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The invite link token.
 *     responses:
 *       200:
 *         description: Invite link accepted – user joined the group.
 *       400:
 *         description: Bad request – user is already a member or link expired.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       404:
 *         description: Invite link not found.
 */
// Accept invite link (auth required)
router.post('/:token/accept', authMiddleware, InviteLinkController.accept);

export default router;
