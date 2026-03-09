import { Router } from 'express';
import { GroupController } from '../controllers/group.controller';
import { InvitationController } from '../controllers/invitation.controller';
import { ComparisonController } from '../controllers/comparison.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { groupMemberMiddleware, groupAdminMiddleware } from '../middlewares/group-role.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createGroupValidator, updateGroupValidator, inviteUserValidator } from '../validators/group.validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ─── Group CRUD ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /groups:
 *   post:
 *     tags: [Groups]
 *     summary: Create a new group
 *     description: Creates a new prediction group. The authenticated user becomes the group admin.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Los Cracks
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Group for weekend predictions
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Validation error (missing or invalid fields)
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.post('/', createGroupValidator, validateRequest, GroupController.create);

/**
 * @swagger
 * /groups:
 *   get:
 *     tags: [Groups]
 *     summary: List my groups
 *     description: Returns all groups the authenticated user belongs to.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/', GroupController.getMyGroups);

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     tags: [Groups]
 *     summary: Get group details
 *     description: Returns detailed information about a specific group. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user is not a member of this group
 *       404:
 *         description: Group not found
 */
router.get('/:id', groupMemberMiddleware, GroupController.getDetail);

/**
 * @swagger
 * /groups/{id}:
 *   patch:
 *     tags: [Groups]
 *     summary: Update a group
 *     description: Updates group name and/or description. Requires group admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Los Cracks Updated
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Updated group description
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Validation error (invalid fields)
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user is not an admin of this group
 *       404:
 *         description: Group not found
 */
router.patch('/:id', groupAdminMiddleware, updateGroupValidator, validateRequest, GroupController.update);

/**
 * @swagger
 * /groups/{id}:
 *   delete:
 *     tags: [Groups]
 *     summary: Delete a group
 *     description: Permanently deletes a group and all associated data. Requires group admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user is not an admin of this group
 *       404:
 *         description: Group not found
 */
router.delete('/:id', groupAdminMiddleware, GroupController.delete);

// ─── Members ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /groups/{id}/members:
 *   get:
 *     tags: [Groups]
 *     summary: List group members
 *     description: Returns all members of a group. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: List of group members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GroupMember'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user is not a member of this group
 *       404:
 *         description: Group not found
 */
router.get('/:id/members', groupMemberMiddleware, GroupController.getMembers);

/**
 * @swagger
 * /groups/{id}/members/{userId}:
 *   delete:
 *     tags: [Groups]
 *     summary: Remove a member from the group
 *     description: Removes a specific user from the group. Requires group admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to remove
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user is not an admin of this group
 *       404:
 *         description: Group or member not found
 */
router.delete('/:id/members/:userId', groupAdminMiddleware, GroupController.removeMember);

/**
 * @swagger
 * /groups/{id}/leave:
 *   post:
 *     tags: [Groups]
 *     summary: Leave a group
 *     description: The authenticated user leaves the group voluntarily. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Successfully left the group
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user is not a member of this group
 *       404:
 *         description: Group not found
 */
router.post('/:id/leave', groupMemberMiddleware, GroupController.leave);

// ─── Activity ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /groups/{id}/activity:
 *   get:
 *     tags: [Groups]
 *     summary: Get group activity feed
 *     description: Returns the recent activity feed for the group (joins, predictions, results, etc.). Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Activity feed entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ActivityEntry'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user is not a member of this group
 *       404:
 *         description: Group not found
 */
router.get('/:id/activity', groupMemberMiddleware, GroupController.getActivity);

// ─── Invitations (from group context) ────────────────────────────────────────

/**
 * @swagger
 * /groups/{id}/invitations:
 *   post:
 *     tags: [Groups]
 *     summary: Invite a user to the group
 *     description: Sends an invitation to a user to join the group. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 42
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invitation'
 *       400:
 *         description: Validation error or user already invited/member
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user is not a member of this group
 *       404:
 *         description: Group or target user not found
 */
router.post('/:id/invitations', groupMemberMiddleware, inviteUserValidator, validateRequest, InvitationController.invite);

// ─── Jornada comparison ──────────────────────────────────────────────────────

/**
 * @swagger
 * /groups/{id}/jornadas/{jornadaId}/ranking:
 *   get:
 *     tags: [Groups]
 *     summary: Get group jornada ranking
 *     description: Returns the live ranking of group members for a specific jornada. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *       - in: path
 *         name: jornadaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jornada ID
 *     responses:
 *       200:
 *         description: Ranking of group members for the jornada
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/JornadaRankingEntry'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user is not a member of this group
 *       404:
 *         description: Group or jornada not found
 */
router.get('/:id/jornadas/:jornadaId/ranking', groupMemberMiddleware, ComparisonController.getGroupJornadaRanking);

/**
 * @swagger
 * /groups/{id}/jornadas/{jornadaId}/comparison:
 *   get:
 *     tags: [Groups]
 *     summary: Get group jornada comparison
 *     description: Returns a detailed match-by-match comparison of all group members' predictions for a specific jornada. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *       - in: path
 *         name: jornadaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Jornada ID
 *     responses:
 *       200:
 *         description: Detailed prediction comparison for the jornada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JornadaComparison'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - user is not a member of this group
 *       404:
 *         description: Group or jornada not found
 */
router.get('/:id/jornadas/:jornadaId/comparison', groupMemberMiddleware, ComparisonController.getGroupJornadaComparison);

export default router;
