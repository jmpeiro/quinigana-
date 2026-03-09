import { Router } from 'express';
import { ChallengeController } from '../controllers/challenge.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// =====================================================
// CHALLENGE ENDPOINTS (API spec compliant)
// =====================================================

/**
 * @swagger
 * /challenges:
 *   post:
 *     tags: [Challenges]
 *     summary: Create a new challenge
 *     description: Creates a 1vs1 challenge against another user for a specific jornada.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - challenged_id
 *               - jornada_id
 *               - wager_points
 *             properties:
 *               challenged_id:
 *                 type: integer
 *                 description: The ID of the user being challenged
 *               jornada_id:
 *                 type: integer
 *                 description: The ID of the jornada for this challenge
 *               wager_points:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 50
 *                 description: Reputation points wagered (0-50)
 *               message:
 *                 type: string
 *                 description: Optional message to the opponent
 *     responses:
 *       201:
 *         description: Challenge created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', ChallengeController.create);

/**
 * @swagger
 * /challenges/history:
 *   get:
 *     tags: [Challenges]
 *     summary: Get user challenge history
 *     description: Returns the authenticated user's challenge history with cursor-based pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page (max 50)
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [next, prev]
 *           default: next
 *     responses:
 *       200:
 *         description: Challenge history with cursor pagination
 *       401:
 *         description: Unauthorized
 */
router.get('/history', ChallengeController.getHistory);

/**
 * @swagger
 * /challenges:
 *   get:
 *     tags: [Challenges]
 *     summary: Get my challenges
 *     description: Returns all challenges where the authenticated user is either the challenger or the opponent.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, completed, rejected, cancelled, expired]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of challenges
 *       401:
 *         description: Unauthorized
 */
router.get('/', ChallengeController.getMyChallenges);

/**
 * @swagger
 * /challenges/pending:
 *   get:
 *     tags: [Challenges]
 *     summary: Get pending challenges
 *     description: Returns challenges awaiting the authenticated user's response.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending challenges
 *       401:
 *         description: Unauthorized
 */
router.get('/pending', ChallengeController.getPending);

/**
 * @swagger
 * /challenges/stats:
 *   get:
 *     tags: [Challenges]
 *     summary: Get my challenge statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Challenge statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', ChallengeController.getMyStats);

/**
 * @swagger
 * /challenges/rivalries:
 *   get:
 *     tags: [Challenges]
 *     summary: Get my rivalries
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rivalries retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/rivalries', ChallengeController.getRivalries);

/**
 * @swagger
 * /challenges/head-to-head/{opponentId}:
 *   get:
 *     tags: [Challenges]
 *     summary: Get head-to-head record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: opponentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Head-to-head record
 *       401:
 *         description: Unauthorized
 */
router.get('/head-to-head/:opponentId', ChallengeController.getHeadToHead);

/**
 * @swagger
 * /challenges/{id}:
 *   get:
 *     tags: [Challenges]
 *     summary: Get challenge by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Challenge details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.get('/:id', ChallengeController.getById);

/**
 * @swagger
 * /challenges/{id}/accept:
 *   put:
 *     tags: [Challenges]
 *     summary: Accept a challenge
 *     description: Accepts a pending challenge. Only the challenged user can accept.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Challenge accepted
 *       400:
 *         description: Cannot accept
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.put('/:id/accept', ChallengeController.accept);
// Keep POST for backward compatibility
router.post('/:id/accept', ChallengeController.accept);

/**
 * @swagger
 * /challenges/{id}/predictions:
 *   put:
 *     tags: [Challenges]
 *     summary: Submit/verify predictions for a challenge
 *     description: Verifies that the user has predictions for the challenge's jornada. Predictions are managed via group proposals.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Prediction status
 *       400:
 *         description: Challenge not accepted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.put('/:id/predictions', ChallengeController.submitPredictions);

/**
 * @swagger
 * /challenges/{id}/reject:
 *   post:
 *     tags: [Challenges]
 *     summary: Reject/Decline a challenge
 *     description: Rejects a pending challenge. Only the challenged user can reject/decline. Alias at PUT /:id/decline.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Challenge rejected/declined
 *       400:
 *         description: Cannot reject
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.post('/:id/reject', ChallengeController.reject);
// Decline alias (API spec uses 'decline' terminology)
router.put('/:id/decline', ChallengeController.reject);

/**
 * @swagger
 * /challenges/{id}/cancel:
 *   post:
 *     tags: [Challenges]
 *     summary: Cancel a challenge
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Challenge cancelled
 *       400:
 *         description: Cannot cancel
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.post('/:id/cancel', ChallengeController.cancel);

export default router;
