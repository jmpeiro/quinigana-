import { Router } from 'express';
import { GamificationController } from '../controllers/gamification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /gamification/me:
 *   get:
 *     tags: [Gamification]
 *     summary: Get my gamification profile
 *     description: Returns the authenticated user's gamification data including points, level, streaks, and earned badges.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gamification profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 points:
 *                   type: integer
 *                 level:
 *                   type: integer
 *                 streak:
 *                   type: integer
 *                 badges:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/me', GamificationController.getMyGamification);

/**
 * @swagger
 * /gamification/badges:
 *   get:
 *     tags: [Gamification]
 *     summary: Get all available badges
 *     description: Returns the complete list of badges that can be earned in the platform.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all badges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   icon:
 *                     type: string
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/badges', GamificationController.getAllBadges);

/**
 * @swagger
 * /gamification/badges/seen:
 *   post:
 *     tags: [Gamification]
 *     summary: Mark badges as seen
 *     description: Marks newly earned badges as seen so they are no longer shown as new to the user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               badgeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of badge IDs to mark as seen
 *     responses:
 *       200:
 *         description: Badges marked as seen successfully
 *       400:
 *         description: Bad request - invalid badge IDs
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.post('/badges/seen', GamificationController.markBadgesSeen);

export default router;
