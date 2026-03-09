import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Full health check
 *     description: Checks DB connectivity, cache status, and returns uptime and version.
 *     security: []
 *     responses:
 *       200:
 *         description: Service healthy or degraded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *       503:
 *         description: Service down (DB unreachable)
 */
router.get('/', HealthController.getHealth);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness probe
 *     description: Kubernetes readiness probe. Returns 200 only when DB is reachable.
 *     security: []
 *     responses:
 *       200:
 *         description: Service ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ready:
 *                   type: boolean
 *                   example: true
 *       503:
 *         description: Service not ready
 */
router.get('/ready', HealthController.getReadiness);

/**
 * @swagger
 * /health/scraper:
 *   get:
 *     tags: [Health]
 *     summary: Scraper source availability
 *     description: Check if scraper sources (football-data API, resultados-futbol) are available.
 *     security: []
 *     responses:
 *       200:
 *         description: All scraper sources healthy
 *       503:
 *         description: One or more sources degraded
 */
router.get('/scraper', HealthController.getScraperHealth);

export default router;
