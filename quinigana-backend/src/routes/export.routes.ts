import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { exportValidator } from '../validators/export.validator';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/stats/export:
 *   get:
 *     tags: [Stats]
 *     summary: Export stats data
 *     description: >
 *       Export rankings or prediction history as CSV or PDF.
 *       Returns a downloadable file with the appropriate Content-Type and Content-Disposition headers.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *         description: The export file format.
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [rankings, predictions]
 *         description: The type of data to export.
 *       - in: query
 *         name: jornadaId
 *         schema:
 *           type: integer
 *         description: Optional jornada ID to filter results.
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: integer
 *         description: Optional group ID to filter rankings.
 *     responses:
 *       200:
 *         description: Export file generated successfully.
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Validation error - invalid query params.
 *       401:
 *         description: Unauthorized - missing or invalid token.
 *       500:
 *         description: Internal server error during export generation.
 */
router.get('/export', exportValidator, validateRequest, ExportController.exportData);

export default router;
