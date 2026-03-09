import { Router } from 'express';
import { LeagueController } from '../controllers/league.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

// Public routes (require auth)
router.use(authMiddleware);

/**
 * @swagger
 * /leagues/divisions:
 *   get:
 *     tags: [Leagues]
 *     summary: Get all divisions
 *     description: Returns the list of all league divisions and their configuration.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of divisions retrieved successfully
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
 *                   level:
 *                     type: integer
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/divisions', LeagueController.getDivisions);

/**
 * @swagger
 * /leagues/season:
 *   get:
 *     tags: [Leagues]
 *     summary: Get active league season
 *     description: Returns the currently active league season with its details.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active league season retrieved successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: No active league season found
 */
router.get('/season', LeagueController.getActiveSeason);

/**
 * @swagger
 * /leagues/me:
 *   get:
 *     tags: [Leagues]
 *     summary: Get my league profile
 *     description: Returns the authenticated user's league profile including current division, points, and rank.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: League profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 division:
 *                   type: object
 *                 points:
 *                   type: integer
 *                 rank:
 *                   type: integer
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/me', LeagueController.getMyProfile);

/**
 * @swagger
 * /leagues/history:
 *   get:
 *     tags: [Leagues]
 *     summary: Get my league history
 *     description: Returns the authenticated user's league participation history across past seasons.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: League history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/history', LeagueController.getMyHistory);

/**
 * @swagger
 * /leagues/standings/{divisionId}:
 *   get:
 *     tags: [Leagues]
 *     summary: Get division standings
 *     description: Returns the current standings for a specific division, ordered by points.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: divisionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The division ID
 *     responses:
 *       200:
 *         description: Division standings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   rank:
 *                     type: integer
 *                   userId:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   points:
 *                     type: integer
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Division not found
 */
router.get('/standings/:divisionId', LeagueController.getDivisionStandings);

// Admin routes

/**
 * @swagger
 * /leagues/seasons:
 *   post:
 *     tags: [Leagues]
 *     summary: Create a league season
 *     description: Creates a new league season. Requires admin privileges.
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
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the league season
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: League season created successfully
 *       400:
 *         description: Bad request - invalid data
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 */
router.post('/seasons', adminMiddleware, LeagueController.createSeason);

/**
 * @swagger
 * /leagues/seasons/{seasonId}/activate:
 *   post:
 *     tags: [Leagues]
 *     summary: Activate a league season
 *     description: Activates a league season, making it the current active season. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The league season ID to activate
 *     responses:
 *       200:
 *         description: League season activated successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: League season not found
 */
router.post('/seasons/:seasonId/activate', adminMiddleware, LeagueController.activateSeason);

/**
 * @swagger
 * /leagues/seasons/{seasonId}/end:
 *   post:
 *     tags: [Leagues]
 *     summary: End a league season
 *     description: Ends an active league season, finalizing standings and processing promotions/relegations. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The league season ID to end
 *     responses:
 *       200:
 *         description: League season ended successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: League season not found
 */
router.post('/seasons/:seasonId/end', adminMiddleware, LeagueController.endSeason);

/**
 * @swagger
 * /leagues/seasons/{newSeasonId}/initialize-from/{previousSeasonId}:
 *   post:
 *     tags: [Leagues]
 *     summary: Initialize season from previous
 *     description: Initializes a new league season using data from a previous season, carrying over division assignments based on promotion/relegation rules. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: newSeasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The new league season ID to initialize
 *       - in: path
 *         name: previousSeasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The previous league season ID to use as source
 *     responses:
 *       200:
 *         description: New season initialized from previous season successfully
 *       400:
 *         description: Bad request - invalid season combination
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: One or both seasons not found
 */
router.post(
  '/seasons/:newSeasonId/initialize-from/:previousSeasonId',
  adminMiddleware,
  LeagueController.initializeFromPrevious
);

export default router;
