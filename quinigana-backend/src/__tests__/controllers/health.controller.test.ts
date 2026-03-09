jest.mock('../../config/environment', () => ({
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
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));
jest.mock('../../services/cache.service');
jest.mock('../../services/scraper-fallback.service');
jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import pool from '../../config/database';
import { CacheService } from '../../services/cache.service';
import { ScraperFallbackService } from '../../services/scraper-fallback.service';
import { HealthController } from '../../controllers/health.controller';

function mockRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}
function mockReq(overrides: any = {}): any {
  return { body: {}, params: {}, query: {}, cookies: {}, authUser: { userId: 1, email: 'test@test.com' }, ...overrides };
}

describe('HealthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHealth', () => {
    it('should return 200 with status ok when DB and cache are healthy', async () => {
      const mockConn = { ping: jest.fn().mockResolvedValue(undefined), release: jest.fn() };
      (pool.getConnection as jest.Mock).mockResolvedValue(mockConn);
      (CacheService.getStats as jest.Mock).mockReturnValue({ hits: 10, misses: 2 });

      const req = mockReq();
      const res = mockRes();
      await HealthController.getHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          db: true,
          cache: true,
        }),
      );
      const body = res.json.mock.calls[0][0];
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('version');
    });

    it('should return 200 with status degraded when cache is down', async () => {
      const mockConn = { ping: jest.fn().mockResolvedValue(undefined), release: jest.fn() };
      (pool.getConnection as jest.Mock).mockResolvedValue(mockConn);
      (CacheService.getStats as jest.Mock).mockImplementation(() => {
        throw new Error('Cache unavailable');
      });

      const req = mockReq();
      const res = mockRes();
      await HealthController.getHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
          db: true,
          cache: false,
        }),
      );
    });

    it('should return 503 with status down when DB is down', async () => {
      (pool.getConnection as jest.Mock).mockRejectedValue(new Error('DB unavailable'));
      (CacheService.getStats as jest.Mock).mockReturnValue({ hits: 0, misses: 0 });

      const req = mockReq();
      const res = mockRes();
      await HealthController.getHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'down',
          db: false,
        }),
      );
    });

    it('should include uptime and version in response', async () => {
      const mockConn = { ping: jest.fn().mockResolvedValue(undefined), release: jest.fn() };
      (pool.getConnection as jest.Mock).mockResolvedValue(mockConn);
      (CacheService.getStats as jest.Mock).mockReturnValue({});

      const req = mockReq();
      const res = mockRes();
      await HealthController.getHealth(req, res);

      const body = res.json.mock.calls[0][0];
      expect(typeof body.uptime).toBe('number');
      expect(typeof body.version).toBe('string');
    });
  });

  describe('getReadiness', () => {
    it('should return 200 with ready true when DB is ok', async () => {
      const mockConn = { ping: jest.fn().mockResolvedValue(undefined), release: jest.fn() };
      (pool.getConnection as jest.Mock).mockResolvedValue(mockConn);

      const req = mockReq();
      const res = mockRes();
      await HealthController.getReadiness(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ready: true });
    });

    it('should return 503 with ready false when DB is down', async () => {
      (pool.getConnection as jest.Mock).mockRejectedValue(new Error('DB down'));

      const req = mockReq();
      const res = mockRes();
      await HealthController.getReadiness(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ ready: false });
    });
  });

  describe('getScraperHealth', () => {
    it('should return 200 with ok when all sources are healthy', async () => {
      (ScraperFallbackService.checkHealth as jest.Mock).mockResolvedValue({
        footballDataApi: { available: true },
        resultadosFutbol: { available: true },
      });

      const req = mockReq();
      const res = mockRes();
      await HealthController.getScraperHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ok' }),
      );
    });

    it('should return 503 with degraded when a source is unavailable', async () => {
      (ScraperFallbackService.checkHealth as jest.Mock).mockResolvedValue({
        footballDataApi: { available: true },
        resultadosFutbol: { available: false },
      });

      const req = mockReq();
      const res = mockRes();
      await HealthController.getScraperHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'degraded' }),
      );
    });

    it('should return 500 with down when checkHealth throws', async () => {
      (ScraperFallbackService.checkHealth as jest.Mock).mockRejectedValue(new Error('fail'));
      (ScraperFallbackService.getHealthStatus as jest.Mock).mockReturnValue({});

      const req = mockReq();
      const res = mockRes();
      await HealthController.getScraperHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'down' }),
      );
    });
  });
});
