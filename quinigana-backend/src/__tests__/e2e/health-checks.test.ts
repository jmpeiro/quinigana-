jest.mock('../../../config/environment', () => ({
  env: {
    nodeEnv: 'test',
    frontendUrl: 'http://localhost:4200',
    db: { host: 'localhost', port: 3306, user: 'root', password: '', name: 'test' },
    jwt: { accessSecret: 'test-secret-min-32-chars-long!!!', refreshSecret: 'test-refresh-min-32-chars!!!!!!!', accessExpiry: '15m', refreshExpiry: '7d' },
    email: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', from: 'test@test.com' },
    google: { clientId: '', clientSecret: '', callbackUrl: '' },
    rateLimit: { windowMs: 900000, max: 100 },
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    execute: jest.fn(),
    query: jest.fn(),
    getConnection: jest.fn(),
  },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));

jest.mock('../../../services/cache.service');
jest.mock('../../../services/scraper-fallback.service');
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { HealthController } from '../../../controllers/health.controller';
import pool from '../../../config/database';
import { CacheService } from '../../../services/cache.service';
import { ScraperFallbackService } from '../../../services/scraper-fallback.service';

const mockPool = pool as jest.Mocked<typeof pool>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;
const mockScraperFallbackService = ScraperFallbackService as jest.Mocked<typeof ScraperFallbackService>;

// ─── Helper to create mock req/res ──────────────────────────────────────────

function createMockReqRes() {
  const req = {} as any;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as any;
  return { req, res };
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Health Check Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── 1. Full health check - all systems ok ─────────────────────────

  describe('GET /api/v1/health - Full health check', () => {
    it('should return status ok when all systems are healthy', async () => {
      const { req, res } = createMockReqRes();

      const mockConnection = {
        ping: jest.fn().mockResolvedValue(undefined),
        release: jest.fn(),
      };
      (mockPool.getConnection as jest.Mock).mockResolvedValue(mockConnection);
      (mockCacheService.getStats as jest.Mock).mockReturnValue({
        hits: 100,
        misses: 20,
        keys: 50,
      });

      await HealthController.getHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          db: true,
          cache: true,
          uptime: expect.any(Number),
          version: expect.any(String),
        })
      );
    });

    // ─── 2. Health check - degraded (cache down) ──────────────────────

    it('should return degraded status when cache is down but DB is ok', async () => {
      const { req, res } = createMockReqRes();

      const mockConnection = {
        ping: jest.fn().mockResolvedValue(undefined),
        release: jest.fn(),
      };
      (mockPool.getConnection as jest.Mock).mockResolvedValue(mockConnection);
      (mockCacheService.getStats as jest.Mock).mockImplementation(() => {
        throw new Error('Cache service unavailable');
      });

      await HealthController.getHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
          db: true,
          cache: false,
        })
      );
    });

    // ─── 3. Health check - down (db down) ─────────────────────────────

    it('should return down status with 503 when DB is unreachable', async () => {
      const { req, res } = createMockReqRes();

      (mockPool.getConnection as jest.Mock).mockRejectedValue(
        new Error('ECONNREFUSED')
      );
      (mockCacheService.getStats as jest.Mock).mockReturnValue({
        hits: 0,
        misses: 0,
        keys: 0,
      });

      await HealthController.getHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'down',
          db: false,
          cache: true,
        })
      );
    });
  });

  // ─── 4. Readiness probe - ready ─────────────────────────────────────

  describe('GET /api/v1/health/ready - Readiness probe', () => {
    it('should return ready when DB is accessible', async () => {
      const { req, res } = createMockReqRes();

      const mockConnection = {
        ping: jest.fn().mockResolvedValue(undefined),
        release: jest.fn(),
      };
      (mockPool.getConnection as jest.Mock).mockResolvedValue(mockConnection);

      await HealthController.getReadiness(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ready: true });
    });

    // ─── 5. Readiness probe - not ready ───────────────────────────────

    it('should return not ready with 503 when DB is down', async () => {
      const { req, res } = createMockReqRes();

      (mockPool.getConnection as jest.Mock).mockRejectedValue(
        new Error('Connection timeout')
      );

      await HealthController.getReadiness(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ ready: false });
    });
  });

  // ─── 6. Scraper health - all sources ok ─────────────────────────────

  describe('GET /api/v1/health/scraper - Scraper health', () => {
    it('should return ok when all scraper sources are available', async () => {
      const { req, res } = createMockReqRes();

      (mockScraperFallbackService.checkHealth as jest.Mock).mockResolvedValue({
        footballDataApi: {
          available: true,
          lastCheck: new Date().toISOString(),
        },
        resultadosFutbol: {
          available: true,
          lastCheck: new Date().toISOString(),
        },
      });

      await HealthController.getScraperHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          sources: expect.objectContaining({
            footballDataApi: expect.objectContaining({ available: true }),
            resultadosFutbol: expect.objectContaining({ available: true }),
          }),
        })
      );
    });

    // ─── 7. Scraper health - partial degradation ──────────────────────

    it('should return degraded with 503 when one scraper source is down', async () => {
      const { req, res } = createMockReqRes();

      (mockScraperFallbackService.checkHealth as jest.Mock).mockResolvedValue({
        footballDataApi: {
          available: true,
          lastCheck: new Date().toISOString(),
        },
        resultadosFutbol: {
          available: false,
          lastCheck: new Date().toISOString(),
          error: 'Timeout',
        },
      });

      await HealthController.getScraperHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
          sources: expect.objectContaining({
            footballDataApi: expect.objectContaining({ available: true }),
            resultadosFutbol: expect.objectContaining({ available: false }),
          }),
        })
      );
    });

    it('should return down with 500 when scraper health check throws', async () => {
      const { req, res } = createMockReqRes();

      (mockScraperFallbackService.checkHealth as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      (mockScraperFallbackService.getHealthStatus as jest.Mock).mockReturnValue({
        footballDataApi: { available: false, lastCheck: null, error: 'Unknown' },
        resultadosFutbol: { available: false, lastCheck: null, error: 'Unknown' },
      });

      await HealthController.getScraperHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'down',
        })
      );
    });
  });
});
