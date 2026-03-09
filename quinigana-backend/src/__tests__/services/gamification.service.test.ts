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

jest.mock('../../models/gamification.model');
jest.mock('../../models/stats.model');
jest.mock('../../models/notification.model');

import { GamificationService } from '../../services/gamification.service';
import { GamificationModel } from '../../models/gamification.model';
import { StatsModel } from '../../models/stats.model';
import { NotificationModel } from '../../models/notification.model';
import { WebPushService } from '../../services/web-push.service';

const mockGamificationModel = GamificationModel as jest.Mocked<typeof GamificationModel>;
const mockStatsModel = StatsModel as jest.Mocked<typeof StatsModel>;
const mockNotificationModel = NotificationModel as jest.Mocked<typeof NotificationModel>;
const mockWebPushService = WebPushService as jest.Mocked<typeof WebPushService>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GamificationService', () => {
  // =====================================================
  // CALCULATE LEVEL
  // =====================================================
  describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
      expect(GamificationService.calculateLevel(0)).toBe(1);
    });

    it('should return level 2 for exactly 50 XP', () => {
      expect(GamificationService.calculateLevel(50)).toBe(2);
    });

    it('should return level 2 for 119 XP (just below level 3)', () => {
      expect(GamificationService.calculateLevel(119)).toBe(2);
    });

    it('should return level 3 for exactly 120 XP', () => {
      expect(GamificationService.calculateLevel(120)).toBe(3);
    });

    it('should return level 5 for exactly 350 XP', () => {
      expect(GamificationService.calculateLevel(350)).toBe(5);
    });

    it('should return level 10 for 1800 XP', () => {
      expect(GamificationService.calculateLevel(1800)).toBe(10);
    });

    it('should return level 10 for XP exceeding max threshold', () => {
      expect(GamificationService.calculateLevel(5000)).toBe(10);
    });

    it('should return level 1 for 49 XP (just below level 2)', () => {
      expect(GamificationService.calculateLevel(49)).toBe(1);
    });
  });

  // =====================================================
  // GRANT XP
  // =====================================================
  describe('grantXp', () => {
    it('should grant XP without level up', async () => {
      mockGamificationModel.ensureUserXp.mockResolvedValue(undefined);
      mockGamificationModel.getUserXp.mockResolvedValue({ user_id: 1, total_xp: 30, level: 1 });
      mockGamificationModel.addXp.mockResolvedValue(undefined);

      const result = await GamificationService.grantXp(1, 10, 'test_source', null);

      expect(result.newLevel).toBe(1);
      expect(result.leveledUp).toBe(false);
      expect(mockGamificationModel.ensureUserXp).toHaveBeenCalledWith(1);
      expect(mockGamificationModel.addXp).toHaveBeenCalledWith(1, 10, 'test_source', null, 1);
    });

    it('should grant XP with level up', async () => {
      mockGamificationModel.ensureUserXp.mockResolvedValue(undefined);
      mockGamificationModel.getUserXp.mockResolvedValue({ user_id: 1, total_xp: 45, level: 1 });
      mockGamificationModel.addXp.mockResolvedValue(undefined);

      const result = await GamificationService.grantXp(1, 10, 'test_source', null);

      // 45 + 10 = 55, which crosses 50 threshold => level 2
      expect(result.newLevel).toBe(2);
      expect(result.leveledUp).toBe(true);
      expect(mockGamificationModel.addXp).toHaveBeenCalledWith(1, 10, 'test_source', null, 2);
    });
  });

  // =====================================================
  // PROCESS JORNADA ACHIEVEMENTS
  // =====================================================
  describe('processJornadaAchievements', () => {
    it('should grant correct XP amounts for predictions', async () => {
      mockGamificationModel.getJornadaParticipants.mockResolvedValue([1]);
      mockGamificationModel.getJornadaCorrects.mockResolvedValue({
        correct1x2: 3,
        doubles1x2: 1,
        correctPleno: 1,
      });
      mockGamificationModel.ensureUserXp.mockResolvedValue(undefined);
      mockGamificationModel.getUserXp.mockResolvedValue({ user_id: 1, total_xp: 100, level: 2 });
      mockGamificationModel.addXp.mockResolvedValue(undefined);
      // Badge checking mocks
      mockGamificationModel.getUserBadgeCodes.mockResolvedValue([]);
      mockStatsModel.getPersonalStats.mockResolvedValue({
        totalPoints: 0,
        totalPredictions: 0,
        correctPleno: 0,
      } as any);
      mockStatsModel.getStreaks.mockResolvedValue({ bestStreak: 0 } as any);
      mockGamificationModel.getProposalCount.mockResolvedValue(0);
      mockGamificationModel.getVoteCount.mockResolvedValue(0);
      mockGamificationModel.isGroupChampion.mockResolvedValue(false);

      await GamificationService.processJornadaAchievements(5);

      // Expected XP: 3*5 + 1*3 + 1*25 = 15 + 3 + 25 = 43
      expect(mockGamificationModel.addXp).toHaveBeenCalledWith(
        1, 43, 'jornada_results', 5, expect.any(Number)
      );
    });

    it('should skip users on error without blocking others', async () => {
      mockGamificationModel.getJornadaParticipants.mockResolvedValue([1, 2]);
      mockGamificationModel.getJornadaCorrects
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({ correct1x2: 1, doubles1x2: 0, correctPleno: 0 });
      mockGamificationModel.ensureUserXp.mockResolvedValue(undefined);
      mockGamificationModel.getUserXp.mockResolvedValue({ user_id: 1, total_xp: 0, level: 1 });
      mockGamificationModel.addXp.mockResolvedValue(undefined);
      mockGamificationModel.getUserBadgeCodes.mockResolvedValue([]);
      mockStatsModel.getPersonalStats.mockResolvedValue({
        totalPoints: 0,
        totalPredictions: 0,
        correctPleno: 0,
      } as any);
      mockStatsModel.getStreaks.mockResolvedValue({ bestStreak: 0 } as any);
      mockGamificationModel.getProposalCount.mockResolvedValue(0);
      mockGamificationModel.getVoteCount.mockResolvedValue(0);
      mockGamificationModel.isGroupChampion.mockResolvedValue(false);

      // Should not throw
      await GamificationService.processJornadaAchievements(5);

      // User 2 should still have been processed
      expect(mockGamificationModel.addXp).toHaveBeenCalledTimes(1);
    });
  });

  // =====================================================
  // PROCESS PROPOSAL CREATED
  // =====================================================
  describe('processProposalCreated', () => {
    it('should grant XP_PROPOSAL and check social badges', async () => {
      mockGamificationModel.ensureUserXp.mockResolvedValue(undefined);
      mockGamificationModel.getUserXp.mockResolvedValue({ user_id: 1, total_xp: 10, level: 1 });
      mockGamificationModel.addXp.mockResolvedValue(undefined);
      mockGamificationModel.getUserBadgeCodes.mockResolvedValue([]);
      mockGamificationModel.getProposalCount.mockResolvedValue(1);
      mockGamificationModel.getVoteCount.mockResolvedValue(0);
      mockGamificationModel.getBadgeByCode.mockResolvedValue({ id: 1, name: 'First Proposal', code: 'first_proposal', xp_reward: 10 } as any);
      mockGamificationModel.awardBadge.mockResolvedValue(true);
      mockNotificationModel.create.mockResolvedValue(1 as any);
      mockWebPushService.sendToUsers.mockResolvedValue(undefined as any);

      await GamificationService.processProposalCreated(1);

      expect(mockGamificationModel.addXp).toHaveBeenCalledWith(
        1, 5, 'proposal', null, expect.any(Number)
      );
    });
  });

  // =====================================================
  // PROCESS VOTE CAST
  // =====================================================
  describe('processVoteCast', () => {
    it('should grant XP_VOTE and check social badges', async () => {
      mockGamificationModel.ensureUserXp.mockResolvedValue(undefined);
      mockGamificationModel.getUserXp.mockResolvedValue({ user_id: 1, total_xp: 10, level: 1 });
      mockGamificationModel.addXp.mockResolvedValue(undefined);
      mockGamificationModel.getUserBadgeCodes.mockResolvedValue([]);
      mockGamificationModel.getProposalCount.mockResolvedValue(0);
      mockGamificationModel.getVoteCount.mockResolvedValue(1);
      mockGamificationModel.getBadgeByCode.mockResolvedValue({ id: 2, name: 'First Vote', code: 'first_vote', xp_reward: 10 } as any);
      mockGamificationModel.awardBadge.mockResolvedValue(true);
      mockNotificationModel.create.mockResolvedValue(1 as any);
      mockWebPushService.sendToUsers.mockResolvedValue(undefined as any);

      await GamificationService.processVoteCast(1);

      expect(mockGamificationModel.addXp).toHaveBeenCalledWith(
        1, 2, 'vote', null, expect.any(Number)
      );
    });
  });

  // =====================================================
  // AWARD BADGE IF ELIGIBLE
  // =====================================================
  describe('awardBadgeIfEligible', () => {
    it('should award a new badge when user does not own it', async () => {
      mockGamificationModel.getUserBadgeCodes.mockResolvedValue([]);
      mockGamificationModel.getBadgeByCode.mockResolvedValue({ id: 1, name: 'Test Badge', code: 'test_badge', xp_reward: 10 } as any);
      mockGamificationModel.awardBadge.mockResolvedValue(true);
      mockGamificationModel.ensureUserXp.mockResolvedValue(undefined);
      mockGamificationModel.getUserXp.mockResolvedValue({ user_id: 1, total_xp: 100, level: 2 });
      mockGamificationModel.addXp.mockResolvedValue(undefined);
      mockNotificationModel.create.mockResolvedValue(1 as any);
      mockWebPushService.sendToUsers.mockResolvedValue(undefined as any);

      await GamificationService.awardBadgeIfEligible(1, 'test_badge');

      expect(mockGamificationModel.awardBadge).toHaveBeenCalledWith(1, 1);
      expect(mockNotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 1, type: 'badge_unlocked' })
      );
    });

    it('should skip if user already owns the badge', async () => {
      mockGamificationModel.getUserBadgeCodes.mockResolvedValue(['test_badge']);

      await GamificationService.awardBadgeIfEligible(1, 'test_badge');

      expect(mockGamificationModel.getBadgeByCode).not.toHaveBeenCalled();
      expect(mockGamificationModel.awardBadge).not.toHaveBeenCalled();
    });
  });

  // =====================================================
  // GET USER GAMIFICATION
  // =====================================================
  describe('getUserGamification', () => {
    it('should return complete gamification data with calculated fields', async () => {
      mockGamificationModel.ensureUserXp.mockResolvedValue(undefined);
      mockGamificationModel.getUserXp.mockResolvedValue({ user_id: 1, total_xp: 150, level: 3 });
      mockGamificationModel.getUserBadges.mockResolvedValue([
        { id: 1, code: 'first_pleno', name: 'First Pleno', earned_at: new Date() },
      ] as any);
      mockGamificationModel.getUnseenCount.mockResolvedValue(2);

      const result = await GamificationService.getUserGamification(1);

      expect(result).toEqual({
        xp: 150,
        level: 3,
        xpForCurrentLevel: 120,  // LEVEL_THRESHOLDS[2]
        xpForNextLevel: 220,     // LEVEL_THRESHOLDS[3]
        badges: expect.arrayContaining([
          expect.objectContaining({ code: 'first_pleno' }),
        ]),
        unseenCount: 2,
      });
    });

    it('should handle max level correctly', async () => {
      mockGamificationModel.ensureUserXp.mockResolvedValue(undefined);
      mockGamificationModel.getUserXp.mockResolvedValue({ user_id: 1, total_xp: 2000, level: 10 });
      mockGamificationModel.getUserBadges.mockResolvedValue([]);
      mockGamificationModel.getUnseenCount.mockResolvedValue(0);

      const result = await GamificationService.getUserGamification(1);

      expect(result.level).toBe(10);
      expect(result.xpForCurrentLevel).toBe(1800); // LEVEL_THRESHOLDS[9]
      // At max level, xpForNextLevel wraps to last threshold
      expect(result.xpForNextLevel).toBe(1800);
    });
  });
});
