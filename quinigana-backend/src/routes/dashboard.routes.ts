import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard data
 *     description: Returns the main dashboard information for the authenticated user, including active groups, upcoming jornadas, and recent activity.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/', authMiddleware, DashboardController.getDashboard);

/**
 * @swagger
 * /api/dashboard/standings:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get standings overview
 *     description: Returns a summary of standings across the user's groups for display on the dashboard.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Standings data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/standings', authMiddleware, DashboardController.getStandings);

export default router;
