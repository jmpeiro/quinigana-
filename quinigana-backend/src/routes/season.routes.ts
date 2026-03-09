import { Router } from 'express';
import { SeasonController } from '../controllers/season.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

// Public routes (authenticated users can view seasons)
router.use(authMiddleware);

/**
 * @swagger
 * /seasons:
 *   get:
 *     tags: [Seasons]
 *     summary: Get all seasons
 *     description: Returns a list of all seasons available in the platform.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seasons retrieved successfully
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
 *                   startDate:
 *                     type: string
 *                     format: date
 *                   endDate:
 *                     type: string
 *                     format: date
 *                   isCurrent:
 *                     type: boolean
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/', SeasonController.getAll);

/**
 * @swagger
 * /seasons/current:
 *   get:
 *     tags: [Seasons]
 *     summary: Get current season
 *     description: Returns the season that is currently active.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current season retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date
 *                 endDate:
 *                   type: string
 *                   format: date
 *                 isCurrent:
 *                   type: boolean
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: No current season found
 */
router.get('/current', SeasonController.getCurrent);

/**
 * @swagger
 * /seasons/{id}:
 *   get:
 *     tags: [Seasons]
 *     summary: Get season by ID
 *     description: Returns the details of a specific season.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The season ID
 *     responses:
 *       200:
 *         description: Season retrieved successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Season not found
 */
router.get('/:id', SeasonController.getById);

/**
 * @swagger
 * /seasons/{id}/stats:
 *   get:
 *     tags: [Seasons]
 *     summary: Get season statistics
 *     description: Returns aggregated statistics for a specific season including participant counts and scoring data.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The season ID
 *     responses:
 *       200:
 *         description: Season statistics retrieved successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Season not found
 */
router.get('/:id/stats', SeasonController.getStats);

// Admin routes

/**
 * @swagger
 * /seasons:
 *   post:
 *     tags: [Seasons]
 *     summary: Create a new season
 *     description: Creates a new season. Requires admin privileges.
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
 *                 description: Name of the season
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date of the season
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date of the season
 *     responses:
 *       201:
 *         description: Season created successfully
 *       400:
 *         description: Bad request - invalid data
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 */
router.post('/', adminMiddleware, SeasonController.create);

/**
 * @swagger
 * /seasons/{id}:
 *   put:
 *     tags: [Seasons]
 *     summary: Update a season
 *     description: Updates an existing season. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The season ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Season updated successfully
 *       400:
 *         description: Bad request - invalid data
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: Season not found
 */
router.put('/:id', adminMiddleware, SeasonController.update);

/**
 * @swagger
 * /seasons/{id}:
 *   delete:
 *     tags: [Seasons]
 *     summary: Delete a season
 *     description: Deletes a season. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The season ID
 *     responses:
 *       200:
 *         description: Season deleted successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: Season not found
 */
router.delete('/:id', adminMiddleware, SeasonController.delete);

/**
 * @swagger
 * /seasons/{id}/set-current:
 *   post:
 *     tags: [Seasons]
 *     summary: Set a season as current
 *     description: Marks the specified season as the current active season. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The season ID to set as current
 *     responses:
 *       200:
 *         description: Season set as current successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - admin privileges required
 *       404:
 *         description: Season not found
 */
router.post('/:id/set-current', adminMiddleware, SeasonController.setAsCurrent);

export default router;
