import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { auditAllAdminActions } from '../middlewares/audit.middleware';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);
// Audit all admin actions - captures every successful admin request to admin_audit_log
router.use(auditAllAdminActions);

// Users

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users
 *     description: Returns a list of all registered users. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 */
router.get('/users', AdminController.getUsers);

/**
 * @swagger
 * /api/admin/users/{id}/toggle-admin:
 *   patch:
 *     tags: [Admin]
 *     summary: Toggle admin role for a user
 *     description: Grants or revokes admin privileges for the specified user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Admin status toggled successfully
 *       400:
 *         description: Bad request - invalid user ID
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: User not found
 */
router.patch('/users/:id/toggle-admin', AdminController.toggleAdmin);

/**
 * @swagger
 * /api/admin/users/{id}/toggle-active:
 *   patch:
 *     tags: [Admin]
 *     summary: Toggle active status for a user
 *     description: Activates or deactivates the specified user account.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User active status toggled successfully
 *       400:
 *         description: Bad request - invalid user ID
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: User not found
 */
router.patch('/users/:id/toggle-active', AdminController.toggleUserActive);

/**
 * @swagger
 * /api/admin/users/{id}/reactivate:
 *   patch:
 *     tags: [Admin]
 *     summary: Reactivate a soft-deleted or deactivated user
 *     description: Reactivates a user account that was soft-deleted or deactivated. Clears deletion timestamps and sets is_active to TRUE.
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
 *         description: User reactivated
 *       404:
 *         description: User not found
 */
router.patch('/users/:id/reactivate', AdminController.reactivateUser);

// Stats

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get global platform statistics
 *     description: Returns global statistics including total users, groups, predictions, and other platform-wide metrics.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Global statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 */
router.get('/stats', AdminController.getGlobalStats);
router.get('/ops', AdminController.getOpsMetrics);

// Groups

/**
 * @swagger
 * /api/admin/groups:
 *   get:
 *     tags: [Admin]
 *     summary: List all groups
 *     description: Returns a list of all groups on the platform regardless of membership.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 */
router.get('/groups', AdminController.getAllGroups);

/**
 * @swagger
 * /api/admin/groups/{id}/deactivate:
 *   patch:
 *     tags: [Admin]
 *     summary: Deactivate a group
 *     description: Deactivates the specified group, preventing further activity within it.
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
 *         description: Group deactivated successfully
 *       400:
 *         description: Bad request - invalid group ID
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: Group not found
 */
router.patch('/groups/:id/deactivate', AdminController.deactivateGroup);

/**
 * @swagger
 * /api/admin/groups/{id}/reactivate:
 *   patch:
 *     tags: [Admin]
 *     summary: Reactivate a soft-deleted group
 *     description: Reactivates a group that was previously deactivated (soft-deleted). Sets is_active back to TRUE.
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
 *         description: Group reactivated
 *       404:
 *         description: Group not found
 */
router.patch('/groups/:id/reactivate', AdminController.reactivateGroup);

// Jornada/Match management

/**
 * @swagger
 * /api/admin/matches/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a match
 *     description: Updates match details such as scores, teams, or schedule. Used to correct or finalize match data.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The match ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               home_team:
 *                 type: string
 *               away_team:
 *                 type: string
 *               home_score:
 *                 type: integer
 *               away_score:
 *                 type: integer
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Match updated successfully
 *       400:
 *         description: Bad request - invalid match data
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: Match not found
 */
router.patch('/matches/:id', AdminController.updateMatch);

/**
 * @swagger
 * /api/admin/jornadas/{id}/reopen:
 *   patch:
 *     tags: [Admin]
 *     summary: Reopen a jornada
 *     description: Reopens a closed jornada to allow further predictions or corrections.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The jornada ID
 *     responses:
 *       200:
 *         description: Jornada reopened successfully
 *       400:
 *         description: Bad request - invalid jornada ID
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: Jornada not found
 */
router.patch('/jornadas/:id/reopen', AdminController.reopenJornada);

// Football Data API

/**
 * @swagger
 * /api/admin/football-data/matches:
 *   get:
 *     tags: [Admin]
 *     summary: Get matches from Football Data API
 *     description: Fetches upcoming matches from the external Football Data API for import into the platform.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Football Data matches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 */
router.get('/football-data/matches', AdminController.getFootballDataMatches);

/**
 * @swagger
 * /api/admin/football-data/results:
 *   get:
 *     tags: [Admin]
 *     summary: Get results from Football Data API
 *     description: Fetches recent match results from the external Football Data API for scoring and verification.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Football Data results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 */
router.get('/football-data/results', AdminController.getFootballDataResults);

/**
 * @swagger
 * /api/admin/football-data/current-matchday:
 *   get:
 *     tags: [Admin]
 *     summary: Get current matchday from Football Data API
 *     description: Returns the current matchday number from the Football Data API for the active competition.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current matchday retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 */
router.get('/football-data/current-matchday', AdminController.getFootballDataCurrentMatchday);

/**
 * @swagger
 * /api/admin/football-data/competitions:
 *   get:
 *     tags: [Admin]
 *     summary: Get available competitions from Football Data API
 *     description: Returns a list of available football competitions from the external Football Data API.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Competitions list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 */
router.get('/football-data/competitions', AdminController.getFootballDataCompetitions);

// Quiniela scraping

/**
 * @swagger
 * /api/admin/quiniela/matches:
 *   get:
 *     tags: [Admin]
 *     summary: Get matches from Quiniela scraping
 *     description: Scrapes and returns match data from the Quiniela source for import into the platform.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quiniela matches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 */
router.get('/quiniela/matches', AdminController.getQuinielaMatches);

export default router;
