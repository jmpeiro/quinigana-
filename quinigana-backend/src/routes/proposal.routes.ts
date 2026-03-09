import { Router } from 'express';
import { ProposalController } from '../controllers/proposal.controller';
import { ScoreController } from '../controllers/score.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { groupMemberMiddleware } from '../middlewares/group-role.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createProposalValidator, updateProposalValidator, voteValidator } from '../validators/proposal.validator';

const router = Router();

router.use(authMiddleware);

// Proposals

/**
 * @swagger
 * /api/groups/{groupId}/proposals:
 *   post:
 *     tags: [Proposals]
 *     summary: Create a proposal
 *     description: Creates a new prediction proposal within a group. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jornadaId
 *               - predictions
 *             properties:
 *               jornadaId:
 *                 type: string
 *                 description: The jornada ID this proposal targets.
 *               predictions:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Array of match prediction objects.
 *     responses:
 *       201:
 *         description: Proposal created successfully.
 *       400:
 *         description: Validation error – invalid input data.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – not a member of this group.
 *       404:
 *         description: Group not found.
 */
router.post('/:groupId/proposals', groupMemberMiddleware, createProposalValidator, validateRequest, ProposalController.create);

/**
 * @swagger
 * /api/groups/{groupId}/proposals:
 *   get:
 *     tags: [Proposals]
 *     summary: Get proposals by group
 *     description: Retrieves all proposals for a specific group. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID.
 *     responses:
 *       200:
 *         description: List of proposals returned successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – not a member of this group.
 *       404:
 *         description: Group not found.
 */
router.get('/:groupId/proposals', groupMemberMiddleware, ProposalController.getByGroup);

/**
 * @swagger
 * /api/groups/{groupId}/proposals/{id}:
 *   get:
 *     tags: [Proposals]
 *     summary: Get proposal detail
 *     description: Retrieves the full details of a specific proposal, including predictions and votes. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The proposal ID.
 *     responses:
 *       200:
 *         description: Proposal details returned successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – not a member of this group.
 *       404:
 *         description: Proposal or group not found.
 */
router.get('/:groupId/proposals/:id', groupMemberMiddleware, ProposalController.getDetail);

/**
 * @swagger
 * /api/groups/{groupId}/proposals/{id}:
 *   patch:
 *     tags: [Proposals]
 *     summary: Update a proposal
 *     description: Updates an existing proposal's predictions. Only the proposal creator can update it before submission. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The proposal ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               predictions:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Updated array of match prediction objects.
 *     responses:
 *       200:
 *         description: Proposal updated successfully.
 *       400:
 *         description: Validation error – invalid input data.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – not a member of this group or not the proposal creator.
 *       404:
 *         description: Proposal or group not found.
 */
router.patch('/:groupId/proposals/:id', groupMemberMiddleware, updateProposalValidator, validateRequest, ProposalController.update);

/**
 * @swagger
 * /api/groups/{groupId}/proposals/{id}:
 *   delete:
 *     tags: [Proposals]
 *     summary: Delete a proposal
 *     description: Deletes a proposal. Only the proposal creator can delete it. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The proposal ID.
 *     responses:
 *       200:
 *         description: Proposal deleted successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – not a member of this group or not the proposal creator.
 *       404:
 *         description: Proposal or group not found.
 */
router.delete('/:groupId/proposals/:id', groupMemberMiddleware, ProposalController.delete);

/**
 * @swagger
 * /api/groups/{groupId}/proposals/{id}/submit:
 *   post:
 *     tags: [Proposals]
 *     summary: Submit a proposal for voting
 *     description: Submits a draft proposal so group members can vote on it. Only the proposal creator can submit. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The proposal ID.
 *     responses:
 *       200:
 *         description: Proposal submitted for voting successfully.
 *       400:
 *         description: Bad request – proposal already submitted or invalid state.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – not a member of this group or not the proposal creator.
 *       404:
 *         description: Proposal or group not found.
 */
router.post('/:groupId/proposals/:id/submit', groupMemberMiddleware, ProposalController.submit);

/**
 * @swagger
 * /api/groups/{groupId}/proposals/{id}/vote:
 *   post:
 *     tags: [Proposals]
 *     summary: Vote on a proposal
 *     description: Casts a vote (approve or reject) on a submitted proposal. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The proposal ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vote
 *             properties:
 *               vote:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: The vote decision.
 *     responses:
 *       200:
 *         description: Vote recorded successfully.
 *       400:
 *         description: Validation error – invalid vote or already voted.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – not a member of this group.
 *       404:
 *         description: Proposal or group not found.
 */
router.post('/:groupId/proposals/:id/vote', groupMemberMiddleware, voteValidator, validateRequest, ProposalController.vote);

// Comments

/**
 * @swagger
 * /api/groups/{groupId}/proposals/{id}/comments:
 *   get:
 *     tags: [Proposals]
 *     summary: Get proposal comments
 *     description: Retrieves all comments on a specific proposal. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The proposal ID.
 *     responses:
 *       200:
 *         description: List of comments returned successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – not a member of this group.
 *       404:
 *         description: Proposal or group not found.
 */
router.get('/:groupId/proposals/:id/comments', groupMemberMiddleware, ProposalController.getComments);

/**
 * @swagger
 * /api/groups/{groupId}/proposals/{id}/comments:
 *   post:
 *     tags: [Proposals]
 *     summary: Add a comment to a proposal
 *     description: Adds a comment to a specific proposal. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The proposal ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: The comment text.
 *     responses:
 *       201:
 *         description: Comment added successfully.
 *       400:
 *         description: Validation error – empty comment.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – not a member of this group.
 *       404:
 *         description: Proposal or group not found.
 */
router.post('/:groupId/proposals/:id/comments', groupMemberMiddleware, ProposalController.addComment);

/**
 * @swagger
 * /api/groups/{groupId}/proposals/{id}/comments/{commentId}:
 *   delete:
 *     tags: [Proposals]
 *     summary: Delete a comment
 *     description: Deletes a comment from a proposal. Only the comment author can delete it. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The proposal ID.
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The comment ID.
 *     responses:
 *       200:
 *         description: Comment deleted successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – not a member of this group or not the comment author.
 *       404:
 *         description: Comment, proposal, or group not found.
 */
router.delete('/:groupId/proposals/:id/comments/:commentId', groupMemberMiddleware, ProposalController.deleteComment);

// Scores

/**
 * @swagger
 * /api/groups/{id}/scores:
 *   get:
 *     tags: [Proposals]
 *     summary: Get group scores
 *     description: Retrieves the overall scores for all members in a group. Requires group membership.
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
 *       200:
 *         description: Group scores returned successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – not a member of this group.
 *       404:
 *         description: Group not found.
 */
router.get('/:id/scores', groupMemberMiddleware, ScoreController.getGroupScores);

/**
 * @swagger
 * /api/groups/{id}/scores/{jornadaId}:
 *   get:
 *     tags: [Proposals]
 *     summary: Get group scores by jornada
 *     description: Retrieves the scores for all members in a group for a specific jornada. Requires group membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The group ID.
 *       - in: path
 *         name: jornadaId
 *         required: true
 *         schema:
 *           type: string
 *         description: The jornada ID.
 *     responses:
 *       200:
 *         description: Group scores for the jornada returned successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – not a member of this group.
 *       404:
 *         description: Group or jornada not found.
 */
router.get('/:id/scores/:jornadaId', groupMemberMiddleware, ScoreController.getGroupScoreByJornada);

export default router;
