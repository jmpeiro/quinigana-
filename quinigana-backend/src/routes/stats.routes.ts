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

// Comparative stats
router.get('/me/comparative', authMiddleware, async (req, res) => {
  try {
    const userId = req.authUser!.userId;
    const pool = (await import('../config/database')).default;
    const [allScores]: any = await pool.execute('SELECT user_id, SUM(points) as total FROM scores GROUP BY user_id ORDER BY total DESC');
    const totalUsers = allScores.length;
    const userIndex = allScores.findIndex((r: any) => r.user_id === userId);
    const globalRank = userIndex >= 0 ? userIndex + 1 : totalUsers;
    const percentile = totalUsers > 0 ? Math.round(((totalUsers - globalRank) / totalUsers) * 1000) / 10 : 0;

    const [predStats]: any = await pool.execute(
      `SELECT pp.prediction_1x2, COUNT(*) as total,
        SUM(CASE WHEN (pp.prediction_1x2='1' AND m.home_score>m.away_score) OR (pp.prediction_1x2='x' AND m.home_score=m.away_score) OR (pp.prediction_1x2='2' AND m.home_score<m.away_score) THEN 1 ELSE 0 END) as correct
       FROM proposal_predictions pp JOIN matches m ON m.id=pp.match_id JOIN quiniela_proposals qp ON qp.id=pp.proposal_id
       WHERE qp.proposed_by=? AND m.status='finished' GROUP BY pp.prediction_1x2`, [userId]);
    const acc: any = { home: 0, draw: 0, away: 0 };
    for (const row of predStats) {
      const pct = row.total > 0 ? Math.round((Number(row.correct) / Number(row.total)) * 100) : 0;
      if (row.prediction_1x2 === '1') acc.home = pct;
      else if (row.prediction_1x2 === 'x') acc.draw = pct;
      else acc.away = pct;
    }

    const [communityStreaks]: any = await pool.execute('SELECT AVG(streak) as avg_streak, MAX(streak) as best_streak FROM gamification_profiles');
    const [userStreak]: any = await pool.execute('SELECT streak FROM gamification_profiles WHERE user_id = ?', [userId]);

    const { sendSuccess } = await import('../utils/response.util');
    sendSuccess(res, {
      globalRank, totalUsers, percentile,
      predictionTypeAccuracy: acc,
      streakComparison: {
        yourBest: userStreak[0]?.streak || 0,
        communityAverage: Number(communityStreaks[0]?.avg_streak || 0),
        communityBest: communityStreaks[0]?.best_streak || 0,
      }
    });
  } catch {
    const { sendError } = await import('../utils/response.util');
    sendError(res, 'INTERNAL_ERROR', 'Error al obtener estadisticas comparativas', 500);
  }
});

export default router;
