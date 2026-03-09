import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/stats/me:
 *   get:
 *     tags: [Stats]
 *     summary: Get personal statistics
 *     description: Returns overall prediction statistics for the authenticated user, including accuracy, total predictions, and streaks.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personal statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/me', StatsController.getPersonalStats);

/**
 * @swagger
 * /api/stats/me/predictions:
 *   get:
 *     tags: [Stats]
 *     summary: Get prediction history
 *     description: Returns the authenticated user's prediction history across all jornadas and groups.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prediction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/me/predictions', StatsController.getPredictionHistory);

/**
 * @swagger
 * /api/stats/me/heatmap:
 *   get:
 *     tags: [Stats]
 *     summary: Get predictions heatmap
 *     description: Returns heatmap data representing the user's prediction activity over time, suitable for calendar-style visualization.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Heatmap data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/me/heatmap', StatsController.getPredictionsHeatmap);

/**
 * @swagger
 * /api/stats/export/csv:
 *   get:
 *     tags: [Stats]
 *     summary: Export statistics as CSV
 *     description: Exports the authenticated user's prediction statistics as a downloadable CSV file.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file generated successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/export/csv', StatsController.exportCsv);

/**
 * @swagger
 * /api/stats/groups/{id}/history:
 *   get:
 *     tags: [Stats]
 *     summary: Get group prediction history
 *     description: Returns the prediction history for a specific group, including scores per jornada.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The group ID
 *     responses:
 *       200:
 *         description: Group history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Group not found
 */
router.get('/groups/:id/history', StatsController.getGroupHistory);

/**
 * @swagger
 * /api/stats/groups/{id}/jornadas/{jornadaId}:
 *   get:
 *     tags: [Stats]
 *     summary: Get jornada detail for a group
 *     description: Returns detailed prediction results for a specific jornada within a group, including all members' predictions and scores.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The group ID
 *       - in: path
 *         name: jornadaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The jornada ID
 *     responses:
 *       200:
 *         description: Jornada detail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Group or jornada not found
 */
router.get('/groups/:id/jornadas/:jornadaId', StatsController.getJornadaDetail);

/**
 * @swagger
 * /api/stats/groups/{id}/rankings:
 *   get:
 *     tags: [Stats]
 *     summary: Get group rankings
 *     description: Returns the current rankings for all members within the specified group.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The group ID
 *     responses:
 *       200:
 *         description: Group rankings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Group not found
 */
router.get('/groups/:id/rankings', StatsController.getGroupRankings);

/**
 * @swagger
 * /api/stats/global-rankings:
 *   get:
 *     tags: [Stats]
 *     summary: Get global rankings
 *     description: Returns the platform-wide rankings across all users based on overall prediction performance.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Global rankings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/global-rankings', StatsController.getGlobalRankings);

export default router;
