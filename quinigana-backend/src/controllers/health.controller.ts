import { Request, Response } from 'express';
import pool from '../config/database';
import { CacheService } from '../services/cache.service';
import { ScraperFallbackService } from '../services/scraper-fallback.service';
import logger from '../config/logger';

const startTime = Date.now();

export class HealthController {
  /**
   * GET /api/v1/health
   * Full health check: DB connectivity, cache status, uptime and version.
   */
  static async getHealth(_req: Request, res: Response): Promise<void> {
    let dbHealthy = false;
    let cacheHealthy = false;

    // Check database
    try {
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      dbHealthy = true;
    } catch (err) {
      logger.error({ err }, 'Health check: database unreachable');
    }

    // Check in-memory cache
    try {
      CacheService.getStats();
      cacheHealthy = true;
    } catch (err) {
      logger.warn({ err }, 'Health check: cache unreachable');
    }

    const overallStatus = dbHealthy && cacheHealthy
      ? 'ok'
      : dbHealthy
        ? 'degraded'
        : 'down';

    res.status(overallStatus === 'down' ? 503 : 200).json({
      status: overallStatus,
      db: dbHealthy,
      cache: cacheHealthy,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
    });
  }

  /**
   * GET /api/v1/health/ready
   * Readiness probe — fails if DB is down.
   */
  static async getReadiness(_req: Request, res: Response): Promise<void> {
    try {
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      res.status(200).json({ ready: true });
    } catch {
      res.status(503).json({ ready: false });
    }
  }

  /**
   * GET /api/v1/health/scraper
   * Scraper source availability check.
   */
  static async getScraperHealth(_req: Request, res: Response): Promise<void> {
    try {
      const health = await ScraperFallbackService.checkHealth();
      const allHealthy = health.footballDataApi.available && health.resultadosFutbol.available;

      res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'ok' : 'degraded',
        sources: health,
      });
    } catch (err) {
      logger.error({ err }, 'Scraper health check failed');
      res.status(500).json({
        status: 'down',
        sources: ScraperFallbackService.getHealthStatus(),
      });
    }
  }
}
