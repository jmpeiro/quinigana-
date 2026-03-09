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
jest.mock('../../services/notification.service');
jest.mock('../../utils/response.util');
jest.mock('../../utils/pagination', () => ({
  parsePagination: jest.fn().mockReturnValue({ page: 1, limit: 20 }),
}));
jest.mock('../../utils/parse-id.util', () => ({
  parseId: jest.fn((val: string) => parseInt(val, 10)),
}));

import { NotificationService } from '../../services/notification.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { NotificationController } from '../../controllers/notification.controller';

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

describe('NotificationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return notifications successfully', async () => {
      const data = { items: [{ id: 1, message: 'Hello' }], total: 1 };
      (NotificationService.getNotifications as jest.Mock).mockResolvedValue(data);

      const req = mockReq();
      const res = mockRes();
      await NotificationController.getNotifications(req, res);

      expect(NotificationService.getNotifications).toHaveBeenCalledWith(1, 1, 20);
      expect(sendSuccess).toHaveBeenCalledWith(res, data);
    });

    it('should handle errors', async () => {
      const err: any = new Error('DB fail');
      err.code = 'FETCH_ERROR';
      err.statusCode = 500;
      (NotificationService.getNotifications as jest.Mock).mockRejectedValue(err);

      const req = mockReq();
      const res = mockRes();
      await NotificationController.getNotifications(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'FETCH_ERROR', 'DB fail', 500);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count successfully', async () => {
      (NotificationService.getUnreadCount as jest.Mock).mockResolvedValue(5);

      const req = mockReq();
      const res = mockRes();
      await NotificationController.getUnreadCount(req, res);

      expect(NotificationService.getUnreadCount).toHaveBeenCalledWith(1);
      expect(sendSuccess).toHaveBeenCalledWith(res, { count: 5 });
    });

    it('should handle errors', async () => {
      (NotificationService.getUnreadCount as jest.Mock).mockRejectedValue(new Error('fail'));

      const req = mockReq();
      const res = mockRes();
      await NotificationController.getUnreadCount(req, res);

      expect(sendError).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read successfully', async () => {
      (NotificationService.markAsRead as jest.Mock).mockResolvedValue(true);

      const req = mockReq({ params: { id: '10' } });
      const res = mockRes();
      await NotificationController.markAsRead(req, res);

      expect(NotificationService.markAsRead).toHaveBeenCalledWith(10, 1);
      expect(sendSuccess).toHaveBeenCalledWith(res, null);
    });

    it('should return 404 when notification not found', async () => {
      (NotificationService.markAsRead as jest.Mock).mockResolvedValue(false);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();
      await NotificationController.markAsRead(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'NOT_FOUND', 'Notification not found', 404);
    });

    it('should handle errors', async () => {
      (NotificationService.markAsRead as jest.Mock).mockRejectedValue(new Error('fail'));

      const req = mockReq({ params: { id: '10' } });
      const res = mockRes();
      await NotificationController.markAsRead(req, res);

      expect(sendError).toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      (NotificationService.markAllAsRead as jest.Mock).mockResolvedValue(undefined);

      const req = mockReq();
      const res = mockRes();
      await NotificationController.markAllAsRead(req, res);

      expect(NotificationService.markAllAsRead).toHaveBeenCalledWith(1);
      expect(sendSuccess).toHaveBeenCalledWith(res, null);
    });

    it('should handle errors', async () => {
      (NotificationService.markAllAsRead as jest.Mock).mockRejectedValue(new Error('fail'));

      const req = mockReq();
      const res = mockRes();
      await NotificationController.markAllAsRead(req, res);

      expect(sendError).toHaveBeenCalled();
    });
  });
});
