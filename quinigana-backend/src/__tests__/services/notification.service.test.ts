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

jest.mock('../../models/notification.model');
jest.mock('../../services/email.service');
jest.mock('../../services/web-push.service');

import { NotificationService } from '../../services/notification.service';
import { NotificationModel } from '../../models/notification.model';
import { EmailService } from '../../services/email.service';
import { WebPushService } from '../../services/web-push.service';
import pool from '../../config/database';

const mockNotificationModel = NotificationModel as jest.Mocked<typeof NotificationModel>;
const mockEmailService = EmailService as jest.Mocked<typeof EmailService>;
const mockWebPushService = WebPushService as jest.Mocked<typeof WebPushService>;
const mockPool = pool as jest.Mocked<typeof pool>;

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockWebPushService.sendToUser as jest.Mock).mockReturnValue(Promise.resolve());
    (mockWebPushService.sendToUsers as jest.Mock).mockReturnValue(Promise.resolve());
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      const mockItems = [{ id: 1, title: 'Test' }, { id: 2, title: 'Test2' }];
      (mockNotificationModel.findByUser as jest.Mock).mockResolvedValue({
        items: mockItems,
        total: 10,
      });

      const result = await NotificationService.getNotifications(1, 1, 5);

      expect(mockNotificationModel.findByUser).toHaveBeenCalledWith(1, 1, 5);
      expect(result).toEqual({
        items: mockItems,
        total: 10,
        page: 1,
        limit: 5,
        totalPages: 2,
      });
    });

    it('should calculate totalPages correctly', async () => {
      (mockNotificationModel.findByUser as jest.Mock).mockResolvedValue({
        items: [],
        total: 11,
      });

      const result = await NotificationService.getNotifications(1, 1, 5);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count from model', async () => {
      (mockNotificationModel.getUnreadCount as jest.Mock).mockResolvedValue(5);

      const result = await NotificationService.getUnreadCount(1);
      expect(result).toBe(5);
      expect(mockNotificationModel.getUnreadCount).toHaveBeenCalledWith(1);
    });
  });

  describe('markAsRead', () => {
    it('should delegate to model and return result', async () => {
      (mockNotificationModel.markAsRead as jest.Mock).mockResolvedValue(true);

      const result = await NotificationService.markAsRead(10, 1);
      expect(result).toBe(true);
      expect(mockNotificationModel.markAsRead).toHaveBeenCalledWith(10, 1);
    });
  });

  describe('markAllAsRead', () => {
    it('should delegate to model', async () => {
      (mockNotificationModel.markAllAsRead as jest.Mock).mockResolvedValue(undefined);

      await NotificationService.markAllAsRead(1);
      expect(mockNotificationModel.markAllAsRead).toHaveBeenCalledWith(1);
    });
  });

  describe('notify', () => {
    it('should create notification and send web push', async () => {
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(1);

      await NotificationService.notify(1, 'new_jornada', 'Test Title', 'Test Message', '/test');

      expect(mockNotificationModel.create).toHaveBeenCalledWith({
        user_id: 1,
        type: 'new_jornada',
        title: 'Test Title',
        message: 'Test Message',
        link: '/test',
      });

      expect(mockWebPushService.sendToUser).toHaveBeenCalledWith(1, {
        title: 'Test Title',
        body: 'Test Message',
        url: '/test',
        tag: 'new_jornada',
      });
    });

    it('should use "/" as default url when no link is provided', async () => {
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(1);

      await NotificationService.notify(1, 'new_jornada', 'Title', 'Msg');

      expect(mockWebPushService.sendToUser).toHaveBeenCalledWith(1, expect.objectContaining({
        url: '/',
      }));
    });

    it('should not throw when web push fails', async () => {
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(1);
      (mockWebPushService.sendToUser as jest.Mock).mockReturnValue(Promise.reject(new Error('push failed')));

      await expect(
        NotificationService.notify(1, 'new_jornada', 'Title', 'Msg')
      ).resolves.toBeUndefined();
    });
  });

  describe('notifyNewJornada', () => {
    it('should create bulk notifications for all users', async () => {
      (mockNotificationModel.createBulk as jest.Mock).mockResolvedValue(undefined);
      const userIds = [1, 2, 3];

      await NotificationService.notifyNewJornada('Jornada 1', userIds);

      expect(mockNotificationModel.createBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ user_id: 1, type: 'new_jornada' }),
          expect.objectContaining({ user_id: 2, type: 'new_jornada' }),
          expect.objectContaining({ user_id: 3, type: 'new_jornada' }),
        ])
      );
      expect((mockNotificationModel.createBulk as jest.Mock).mock.calls[0][0]).toHaveLength(3);
    });

    it('should send web push to all users', async () => {
      (mockNotificationModel.createBulk as jest.Mock).mockResolvedValue(undefined);

      await NotificationService.notifyNewJornada('Jornada 1', [1, 2]);

      expect(mockWebPushService.sendToUsers).toHaveBeenCalledWith([1, 2], expect.objectContaining({
        tag: 'new_jornada',
      }));
    });

    it('should not throw when web push fails', async () => {
      (mockNotificationModel.createBulk as jest.Mock).mockResolvedValue(undefined);
      (mockWebPushService.sendToUsers as jest.Mock).mockReturnValue(Promise.reject(new Error('push failed')));

      await expect(
        NotificationService.notifyNewJornada('J1', [1])
      ).resolves.toBeUndefined();
    });
  });

  describe('notifyProposalSubmitted', () => {
    it('should create bulk notifications for all member user ids', async () => {
      (mockNotificationModel.createBulk as jest.Mock).mockResolvedValue(undefined);

      await NotificationService.notifyProposalSubmitted('Group A', 'Juan', [2, 3], 10, 20);

      const notifications = (mockNotificationModel.createBulk as jest.Mock).mock.calls[0][0];
      expect(notifications).toHaveLength(2);
      expect(notifications[0]).toMatchObject({
        user_id: 2,
        type: 'proposal_submitted',
        link: '/quiniela/groups/10/proposals/20',
      });
    });

    it('should send web push to member user ids', async () => {
      (mockNotificationModel.createBulk as jest.Mock).mockResolvedValue(undefined);

      await NotificationService.notifyProposalSubmitted('Group A', 'Juan', [2, 3], 10, 20);

      expect(mockWebPushService.sendToUsers).toHaveBeenCalledWith([2, 3], expect.objectContaining({
        tag: 'proposal_submitted',
      }));
    });
  });

  describe('notifyResultsPublished', () => {
    it('should create bulk notifications and send emails', async () => {
      (mockNotificationModel.createBulk as jest.Mock).mockResolvedValue(undefined);
      (mockEmailService.sendNotificationEmail as jest.Mock).mockResolvedValue(undefined);

      await NotificationService.notifyResultsPublished('Jornada 5', [1, 2]);

      expect(mockNotificationModel.createBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ user_id: 1, type: 'results_published' }),
          expect.objectContaining({ user_id: 2, type: 'results_published' }),
        ])
      );

      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalledTimes(2);
      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalledWith(
        1,
        'Resultados publicados',
        expect.stringContaining('Jornada 5')
      );
    });

    it('should not throw when email sending fails', async () => {
      (mockNotificationModel.createBulk as jest.Mock).mockResolvedValue(undefined);
      (mockEmailService.sendNotificationEmail as jest.Mock).mockRejectedValue(new Error('smtp error'));

      await expect(
        NotificationService.notifyResultsPublished('J1', [1])
      ).resolves.toBeUndefined();
    });
  });

  describe('notifyInvitationReceived', () => {
    it('should create single notification with correct data', async () => {
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(1);

      await NotificationService.notifyInvitationReceived('Group X', 'Carlos', 5);

      expect(mockNotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 5,
        type: 'invitation_received',
        link: '/groups/invitations',
      }));

      expect(mockWebPushService.sendToUser).toHaveBeenCalledWith(5, expect.objectContaining({
        tag: 'invitation_received',
      }));
    });
  });

  describe('notifyChallengeReceived', () => {
    it('should query DB for challenger name and create notification', async () => {
      (mockPool.execute as jest.Mock).mockResolvedValue([[{ first_name: 'Pedro' }], []]);
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(1);

      await NotificationService.notifyChallengeReceived(2, 1, 'Jornada 3');

      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT first_name FROM users'),
        [1]
      );

      expect(mockNotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 2,
        type: 'challenge_received',
        message: expect.stringContaining('Pedro'),
      }));
    });

    it('should use fallback name when user not found', async () => {
      (mockPool.execute as jest.Mock).mockResolvedValue([[], []]);
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(1);

      await NotificationService.notifyChallengeReceived(2, 999, 'Jornada 3');

      expect(mockNotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Alguien'),
      }));
    });
  });

  describe('notifyChallengeAccepted', () => {
    it('should query DB for challenged name and notify challenger', async () => {
      (mockPool.execute as jest.Mock).mockResolvedValue([[{ first_name: 'Maria' }], []]);
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(1);

      await NotificationService.notifyChallengeAccepted(1, 2, 'Jornada 4');

      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT first_name FROM users'),
        [2]
      );

      expect(mockNotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 1,
        type: 'challenge_accepted',
        message: expect.stringContaining('Maria'),
      }));
    });

    it('should use fallback name when user not found', async () => {
      (mockPool.execute as jest.Mock).mockResolvedValue([[], []]);
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(1);

      await NotificationService.notifyChallengeAccepted(1, 999, 'Jornada 4');

      expect(mockNotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Tu rival'),
      }));
    });
  });

  describe('notifyChallengeResult', () => {
    it('should send win message with positive points', async () => {
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(1);

      await NotificationService.notifyChallengeResult(1, 'Carlos', 'Jornada 5', true, false, 10);

      expect(mockNotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 1,
        type: 'challenge_result',
        title: 'Ganaste el reto!',
        message: expect.stringContaining('+10'),
      }));

      expect(mockNotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Carlos'),
      }));
    });

    it('should send loss message with negative points', async () => {
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(1);

      await NotificationService.notifyChallengeResult(1, 'Carlos', 'Jornada 5', false, false, 5);

      expect(mockNotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Perdiste el reto',
        message: expect.stringContaining('-5'),
      }));
    });

    it('should send draw message', async () => {
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(1);

      await NotificationService.notifyChallengeResult(1, 'Carlos', 'Jornada 5', false, true, 0);

      expect(mockNotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Empate en reto',
        message: expect.stringContaining('empate'),
      }));
    });

    it('should send web push for challenge result', async () => {
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(1);

      await NotificationService.notifyChallengeResult(1, 'Carlos', 'J5', true, false, 10);

      expect(mockWebPushService.sendToUser).toHaveBeenCalledWith(1, expect.objectContaining({
        tag: 'challenge_result',
        url: '/challenges',
      }));
    });

    it('should not throw when web push fails', async () => {
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(1);
      (mockWebPushService.sendToUser as jest.Mock).mockReturnValue(Promise.reject(new Error('fail')));

      await expect(
        NotificationService.notifyChallengeResult(1, 'C', 'J1', true, false, 10)
      ).resolves.toBeUndefined();
    });
  });
});
