jest.mock('../../config/environment', () => ({
  env: {
    port: 3000,
    nodeEnv: 'test',
    frontendUrl: 'http://localhost:4200',
    db: { host: 'localhost', port: 3306, user: 'root', password: '', name: 'test' },
    jwt: { accessSecret: 'test-secret-min-32-chars-long!!!', refreshSecret: 'test-refresh-min-32-chars!!!!!!!', accessExpiry: '15m', refreshExpiry: '7d' },
    email: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', from: 'test@test.com' },
    google: { clientId: '', clientSecret: '', callbackUrl: '' },
    rateLimit: { windowMs: 900000, max: 100 },
    footballData: { apiKey: 'test-api-key' },
    webPush: { publicKey: '', privateKey: '', subject: 'mailto:test@test.com' },
    socket: { scrapeIntervalMs: 30000 },
    redis: { host: 'localhost', port: 6379, password: '' },
    scraper: { proxyUrl: '', minDelayMs: 300, maxDelayMs: 800, cacheTtlMs: 25000, timeoutMs: 15000, maxRetries: 2 },
  },
}));
jest.mock('../../services/web-push.service', () => ({
  WebPushService: { sendToUser: jest.fn().mockResolvedValue(undefined), sendToUsers: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));
jest.mock('../../services/gamification.service');
jest.mock('../../models/gamification.model');
jest.mock('../../utils/response.util');

import { GamificationService } from '../../services/gamification.service';
import { GamificationModel } from '../../models/gamification.model';
import { sendSuccess, sendError } from '../../utils/response.util';
import { GamificationController } from '../../controllers/gamification.controller';

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

describe('GamificationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyGamification', () => {
    it('should return gamification data successfully', async () => {
      const gamData = { level: 5, xp: 1200, badges: [] };
      (GamificationService.getUserGamification as jest.Mock).mockResolvedValue(gamData);

      const req = mockReq();
      const res = mockRes();
      await GamificationController.getMyGamification(req, res);

      expect(GamificationService.getUserGamification).toHaveBeenCalledWith(1);
      expect(sendSuccess).toHaveBeenCalledWith(res, gamData);
    });

    it('should handle errors', async () => {
      const err: any = new Error('Service fail');
      err.code = 'GAMIFICATION_ERROR';
      err.statusCode = 500;
      (GamificationService.getUserGamification as jest.Mock).mockRejectedValue(err);

      const req = mockReq();
      const res = mockRes();
      await GamificationController.getMyGamification(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'GAMIFICATION_ERROR', 'Service fail', 500);
    });

    it('should use defaults when error has no code/statusCode', async () => {
      (GamificationService.getUserGamification as jest.Mock).mockRejectedValue(new Error('fail'));

      const req = mockReq();
      const res = mockRes();
      await GamificationController.getMyGamification(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'GAMIFICATION_ERROR', 'fail', 500);
    });
  });

  describe('getAllBadges', () => {
    it('should return all badge definitions', async () => {
      const badges = [{ id: 1, name: 'First Win' }, { id: 2, name: 'Streak' }];
      (GamificationModel.getAllBadgeDefinitions as jest.Mock).mockResolvedValue(badges);

      const req = mockReq();
      const res = mockRes();
      await GamificationController.getAllBadges(req, res);

      expect(GamificationModel.getAllBadgeDefinitions).toHaveBeenCalled();
      expect(sendSuccess).toHaveBeenCalledWith(res, badges);
    });

    it('should handle errors', async () => {
      (GamificationModel.getAllBadgeDefinitions as jest.Mock).mockRejectedValue(new Error('DB fail'));

      const req = mockReq();
      const res = mockRes();
      await GamificationController.getAllBadges(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'BADGES_ERROR', 'DB fail', 500);
    });
  });

  describe('markBadgesSeen', () => {
    it('should mark badges as seen successfully', async () => {
      (GamificationModel.markAllSeen as jest.Mock).mockResolvedValue(undefined);

      const req = mockReq();
      const res = mockRes();
      await GamificationController.markBadgesSeen(req, res);

      expect(GamificationModel.markAllSeen).toHaveBeenCalledWith(1);
      expect(sendSuccess).toHaveBeenCalledWith(res, null, 'Badges marked as seen');
    });

    it('should handle errors', async () => {
      (GamificationModel.markAllSeen as jest.Mock).mockRejectedValue(new Error('fail'));

      const req = mockReq();
      const res = mockRes();
      await GamificationController.markBadgesSeen(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'BADGES_SEEN_ERROR', 'fail', 500);
    });
  });
});
