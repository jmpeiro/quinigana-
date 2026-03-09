import { Router } from 'express';
import { JornadaController } from '../controllers/jornada.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createJornadaValidator, updateJornadaStatusValidator, submitResultsValidator } from '../validators/jornada.validator';
import { jornadaSearchValidator } from '../validators/search.validator';

const router = Router();

// Public routes (authenticated)
router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/jornadas:
 *   get:
 *     tags: [Jornadas]
 *     summary: Get all jornadas
 *     description: >
 *       Retrieves a list of all jornadas (matchdays). Supports cursor-based pagination
 *       and filtering by status, season, date range, and search by team name.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by jornada name or team name.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, finished]
 *         description: Filter by jornada status.
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *         description: Filter by season identifier.
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter jornadas with deadline on or after this date.
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter jornadas with deadline on or before this date.
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for cursor-based pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [next, prev]
 *           default: next
 *     responses:
 *       200:
 *         description: List of jornadas returned successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       422:
 *         description: Validation error – invalid query parameters.
 */
router.get('/', jornadaSearchValidator, validateRequest, JornadaController.getAll);

/**
 * @swagger
 * /api/jornadas/active:
 *   get:
 *     tags: [Jornadas]
 *     summary: Get active jornada
 *     description: Retrieves the currently active jornada (matchday) that is open for predictions.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active jornada returned successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       404:
 *         description: No active jornada found.
 */
router.get('/active', JornadaController.getActive);

/**
 * @swagger
 * /api/jornadas/{id}/live-scores:
 *   get:
 *     tags: [Jornadas]
 *     summary: Get live scores for a jornada
 *     description: Retrieves live scores for all matches in the specified jornada.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The jornada ID.
 *     responses:
 *       200:
 *         description: Live scores returned successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       404:
 *         description: Jornada not found.
 */
router.get('/:id/live-scores', JornadaController.getLiveScores);

/**
 * @swagger
 * /api/jornadas/{id}/my-predictions:
 *   get:
 *     tags: [Jornadas]
 *     summary: Get my predictions for a jornada
 *     description: Retrieves the authenticated user's predictions for the specified jornada.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The jornada ID.
 *     responses:
 *       200:
 *         description: User predictions returned successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       404:
 *         description: Jornada not found.
 */
router.get('/:id/my-predictions', JornadaController.getMyPredictions);

/**
 * @swagger
 * /api/jornadas/{id}:
 *   get:
 *     tags: [Jornadas]
 *     summary: Get a jornada by ID
 *     description: Retrieves the details of a specific jornada including its matches.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The jornada ID.
 *     responses:
 *       200:
 *         description: Jornada details returned successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       404:
 *         description: Jornada not found.
 */
router.get('/:id', JornadaController.getById);

// Admin routes

/**
 * @swagger
 * /api/jornadas:
 *   post:
 *     tags: [Jornadas]
 *     summary: Create a new jornada
 *     description: Creates a new jornada (matchday) with its matches. Admin only.
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
 *               - matches
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the jornada.
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date and time of the jornada.
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: End date and time of the jornada.
 *               matches:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Array of match objects for this jornada.
 *     responses:
 *       201:
 *         description: Jornada created successfully.
 *       400:
 *         description: Validation error – invalid input data.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – admin access required.
 */
router.post('/', adminMiddleware, createJornadaValidator, validateRequest, JornadaController.create);

/**
 * @swagger
 * /api/jornadas/{id}:
 *   patch:
 *     tags: [Jornadas]
 *     summary: Update jornada status
 *     description: Updates the status of a jornada (e.g., open, closed, finished). Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The jornada ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: The new status for the jornada.
 *     responses:
 *       200:
 *         description: Jornada status updated successfully.
 *       400:
 *         description: Validation error – invalid status value.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – admin access required.
 *       404:
 *         description: Jornada not found.
 */
router.patch('/:id', adminMiddleware, updateJornadaStatusValidator, validateRequest, JornadaController.updateStatus);

/**
 * @swagger
 * /api/jornadas/{id}/results:
 *   post:
 *     tags: [Jornadas]
 *     summary: Submit results for a jornada
 *     description: Submits the final match results for a jornada and triggers score calculation. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The jornada ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - results
 *             properties:
 *               results:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Array of match result objects.
 *     responses:
 *       200:
 *         description: Results submitted and scores calculated successfully.
 *       400:
 *         description: Validation error – invalid results data.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – admin access required.
 *       404:
 *         description: Jornada not found.
 */
router.post('/:id/results', adminMiddleware, submitResultsValidator, validateRequest, JornadaController.submitResults);

/**
 * @swagger
 * /api/jornadas/{id}:
 *   delete:
 *     tags: [Jornadas]
 *     summary: Delete a jornada
 *     description: Deletes a jornada and all its associated matches. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The jornada ID.
 *     responses:
 *       200:
 *         description: Jornada deleted successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       403:
 *         description: Forbidden – admin access required.
 *       404:
 *         description: Jornada not found.
 */
router.delete('/:id', adminMiddleware, JornadaController.delete);

export default router;
