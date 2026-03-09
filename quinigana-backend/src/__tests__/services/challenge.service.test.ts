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

jest.mock('../../models/challenge.model');
jest.mock('../../services/notification.service');
jest.mock('../../services/gamification.service');

import { ChallengeService } from '../../services/challenge.service';
import { ChallengeModel } from '../../models/challenge.model';
import { NotificationService } from '../../services/notification.service';
import { GamificationService } from '../../services/gamification.service';
import pool, { withTransaction } from '../../config/database';

const mockChallengeModel = ChallengeModel as jest.Mocked<typeof ChallengeModel>;
const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;
const mockGamificationService = GamificationService as jest.Mocked<typeof GamificationService>;
const mockPool = pool as jest.Mocked<typeof pool>;
const mockWithTransaction = withTransaction as jest.MockedFunction<typeof withTransaction>;

const baseChallenge = {
  id: 1,
  challenger_id: 10,
  challenged_id: 20,
  jornada_id: 5,
  wager_points: 50,
  status: 'pending' as const,
  message: 'Let us go!',
  created_at: new Date('2024-01-01'),
  accepted_at: null,
  completed_at: null,
  responded_at: null,
  expired_at: null,
  challenger_score: null,
  challenged_score: null,
  winner_id: null,
};

const baseChallengeWithDetails = {
  ...baseChallenge,
  challenger_name: 'Alice',
  challenged_name: 'Bob',
  jornada_name: 'Jornada 5',
  challenger_avatar: null,
  challenged_avatar: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ChallengeService', () => {
  // =====================================================
  // CREATE CHALLENGE
  // =====================================================
  describe('createChallenge', () => {
    it('should create a challenge successfully', async () => {
      mockChallengeModel.create.mockResolvedValue(1);
      mockChallengeModel.findByIdWithDetails.mockResolvedValue(baseChallengeWithDetails as any);

      const result = await ChallengeService.createChallenge(10, {
        challenged_id: 20,
        jornada_id: 5,
        wager_points: 50,
        message: 'Let us go!',
      });

      expect(result).toEqual(baseChallengeWithDetails);
      expect(mockChallengeModel.create).toHaveBeenCalledWith(10, 20, 5, 50, 'Let us go!');
      expect(mockChallengeModel.findByIdWithDetails).toHaveBeenCalledWith(1);
    });

    it('should throw 500 if creation fails', async () => {
      mockChallengeModel.create.mockResolvedValue(1);
      mockChallengeModel.findByIdWithDetails.mockResolvedValue(null);

      await expect(
        ChallengeService.createChallenge(10, {
          challenged_id: 20,
          jornada_id: 5,
          wager_points: 50,
          message: '',
        })
      ).rejects.toEqual(
        expect.objectContaining({ statusCode: 500, code: 'CREATE_FAILED' })
      );
    });
  });

  // =====================================================
  // GET CHALLENGE BY ID
  // =====================================================
  describe('getChallengeById', () => {
    it('should delegate to ChallengeModel.findByIdWithDetails', async () => {
      mockChallengeModel.findByIdWithDetails.mockResolvedValue(baseChallengeWithDetails as any);

      const result = await ChallengeService.getChallengeById(1);

      expect(result).toEqual(baseChallengeWithDetails);
      expect(mockChallengeModel.findByIdWithDetails).toHaveBeenCalledWith(1);
    });
  });

  // =====================================================
  // ACCEPT CHALLENGE
  // =====================================================
  describe('acceptChallenge', () => {
    it('should update status and create stats for both directions', async () => {
      mockChallengeModel.updateStatus.mockResolvedValue(undefined);
      mockChallengeModel.getOrCreateStats.mockResolvedValue(undefined as any);

      await ChallengeService.acceptChallenge(1, baseChallenge as any);

      expect(mockChallengeModel.updateStatus).toHaveBeenCalledWith(1, 'accepted', expect.any(Date));
      expect(mockChallengeModel.getOrCreateStats).toHaveBeenCalledWith(10, 20);
      expect(mockChallengeModel.getOrCreateStats).toHaveBeenCalledWith(20, 10);
      expect(mockChallengeModel.getOrCreateStats).toHaveBeenCalledTimes(2);
    });
  });

  // =====================================================
  // DECLINE CHALLENGE
  // =====================================================
  describe('declineChallenge', () => {
    it('should set status to rejected', async () => {
      mockChallengeModel.updateStatus.mockResolvedValue(undefined);

      await ChallengeService.declineChallenge(1);

      expect(mockChallengeModel.updateStatus).toHaveBeenCalledWith(1, 'rejected', expect.any(Date));
    });
  });

  // =====================================================
  // CANCEL CHALLENGE
  // =====================================================
  describe('cancelChallenge', () => {
    it('should set status to cancelled', async () => {
      mockChallengeModel.updateStatus.mockResolvedValue(undefined);

      await ChallengeService.cancelChallenge(1);

      expect(mockChallengeModel.updateStatus).toHaveBeenCalledWith(1, 'cancelled');
    });
  });

  // =====================================================
  // VERIFY PREDICTIONS
  // =====================================================
  describe('verifyPredictions', () => {
    it('should return true when user has predictions', async () => {
      (mockPool.execute as jest.Mock).mockResolvedValue([[{ count: 3 }], []]);

      const result = await ChallengeService.verifyPredictions(10, baseChallenge as any);

      expect(result.hasPredictions).toBe(true);
      expect(result.message).toContain('predicciones de grupo');
    });

    it('should return false when user has no predictions', async () => {
      (mockPool.execute as jest.Mock).mockResolvedValue([[{ count: 0 }], []]);

      const result = await ChallengeService.verifyPredictions(10, baseChallenge as any);

      expect(result.hasPredictions).toBe(false);
      expect(result.message).toContain('propuesta aprobada');
    });
  });

  // =====================================================
  // RESOLVE CHALLENGES FOR JORNADA
  // =====================================================
  describe('resolveChallengesForJornada', () => {
    it('should return early when no active challenges', async () => {
      mockChallengeModel.getActiveChallengesForJornada.mockResolvedValue([]);

      await ChallengeService.resolveChallengesForJornada(5);

      expect(mockChallengeModel.getActiveChallengesForJornada).toHaveBeenCalledWith(5);
    });

    it('should resolve each active challenge', async () => {
      const challenges = [baseChallenge as any];
      mockChallengeModel.getActiveChallengesForJornada.mockResolvedValue(challenges);
      // resolveChallenge is private; it uses withTransaction and postResolutionNotifications
      // Just verify it processes without error
      const mockConn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[{ score: 10 }], []])  // challenger score
          .mockResolvedValueOnce([[{ score: 8 }], []])   // challenged score
          .mockResolvedValue([[], []]),                   // UPDATE and other queries
      };
      mockWithTransaction.mockImplementation(async (cb: any) => cb(mockConn));
      mockChallengeModel.findByIdWithDetails.mockResolvedValue(baseChallengeWithDetails as any);
      mockChallengeModel.updateStats.mockResolvedValue(undefined);
      mockNotificationService.notifyChallengeResult.mockResolvedValue(undefined);
      mockGamificationService.grantXp.mockResolvedValue({ newLevel: 1, leveledUp: false });
      mockGamificationService.awardBadgeIfEligible.mockResolvedValue(undefined);
      mockChallengeModel.getUserCompletedCount.mockResolvedValue(1);
      mockChallengeModel.getUserWinCount.mockResolvedValue(0);
      mockChallengeModel.getUserWinStreak.mockResolvedValue(0);

      await ChallengeService.resolveChallengesForJornada(5);

      expect(mockChallengeModel.getActiveChallengesForJornada).toHaveBeenCalledWith(5);
    });
  });

  // =====================================================
  // EXPIRE PENDING CHALLENGES
  // =====================================================
  describe('expirePendingChallenges', () => {
    it('should return 0 when no expired challenges', async () => {
      mockChallengeModel.findExpiredPendingChallenges.mockResolvedValue([]);

      const count = await ChallengeService.expirePendingChallenges();

      expect(count).toBe(0);
      expect(mockChallengeModel.expireOldPendingChallenges).not.toHaveBeenCalled();
    });

    it('should expire challenges and notify challengers', async () => {
      const expired = [baseChallenge as any];
      mockChallengeModel.findExpiredPendingChallenges.mockResolvedValue(expired);
      mockChallengeModel.expireOldPendingChallenges.mockResolvedValue(1);
      mockNotificationService.notify.mockResolvedValue(undefined as any);

      const count = await ChallengeService.expirePendingChallenges();

      expect(count).toBe(1);
      expect(mockChallengeModel.expireOldPendingChallenges).toHaveBeenCalled();
      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        10,
        'challenge_result',
        'Reto expirado',
        expect.stringContaining('expirado'),
        '/challenges'
      );
    });
  });

  // =====================================================
  // CHECK AND EXPIRE IF NEEDED
  // =====================================================
  describe('checkAndExpireIfNeeded', () => {
    it('should delegate to ChallengeModel', async () => {
      const expiredChallenge = { ...baseChallenge, status: 'expired' as any };
      mockChallengeModel.checkAndExpireIfNeeded.mockResolvedValue(expiredChallenge);

      const result = await ChallengeService.checkAndExpireIfNeeded(baseChallenge as any);

      expect(result).toEqual(expiredChallenge);
      expect(mockChallengeModel.checkAndExpireIfNeeded).toHaveBeenCalledWith(baseChallenge);
    });
  });

  // =====================================================
  // CHECK CHALLENGE BADGES
  // =====================================================
  describe('checkChallengeBadges', () => {
    it('should award first_challenge badge when completed >= 1', async () => {
      mockChallengeModel.getUserCompletedCount.mockResolvedValue(1);
      mockChallengeModel.getUserWinCount.mockResolvedValue(0);
      mockChallengeModel.getUserWinStreak.mockResolvedValue(0);
      mockGamificationService.awardBadgeIfEligible.mockResolvedValue(undefined);

      await ChallengeService.checkChallengeBadges(10);

      expect(mockGamificationService.awardBadgeIfEligible).toHaveBeenCalledWith(10, 'first_challenge');
      expect(mockGamificationService.awardBadgeIfEligible).not.toHaveBeenCalledWith(10, 'challenge_wins_5');
    });

    it('should award challenge_wins_5 badge when wins >= 5', async () => {
      mockChallengeModel.getUserCompletedCount.mockResolvedValue(5);
      mockChallengeModel.getUserWinCount.mockResolvedValue(5);
      mockChallengeModel.getUserWinStreak.mockResolvedValue(3);
      mockGamificationService.awardBadgeIfEligible.mockResolvedValue(undefined);

      await ChallengeService.checkChallengeBadges(10);

      expect(mockGamificationService.awardBadgeIfEligible).toHaveBeenCalledWith(10, 'first_challenge');
      expect(mockGamificationService.awardBadgeIfEligible).toHaveBeenCalledWith(10, 'challenge_wins_5');
      expect(mockGamificationService.awardBadgeIfEligible).not.toHaveBeenCalledWith(10, 'challenge_wins_20');
    });

    it('should award challenge_wins_20 badge when wins >= 20', async () => {
      mockChallengeModel.getUserCompletedCount.mockResolvedValue(25);
      mockChallengeModel.getUserWinCount.mockResolvedValue(20);
      mockChallengeModel.getUserWinStreak.mockResolvedValue(2);
      mockGamificationService.awardBadgeIfEligible.mockResolvedValue(undefined);

      await ChallengeService.checkChallengeBadges(10);

      expect(mockGamificationService.awardBadgeIfEligible).toHaveBeenCalledWith(10, 'challenge_wins_20');
    });

    it('should award undefeated_5 badge when win streak >= 5', async () => {
      mockChallengeModel.getUserCompletedCount.mockResolvedValue(10);
      mockChallengeModel.getUserWinCount.mockResolvedValue(8);
      mockChallengeModel.getUserWinStreak.mockResolvedValue(5);
      mockGamificationService.awardBadgeIfEligible.mockResolvedValue(undefined);

      await ChallengeService.checkChallengeBadges(10);

      expect(mockGamificationService.awardBadgeIfEligible).toHaveBeenCalledWith(10, 'undefeated_5');
    });
  });

  // =====================================================
  // HAS USER PREDICTIONS
  // =====================================================
  describe('hasUserPredictions', () => {
    it('should return true when count > 0', async () => {
      (mockPool.execute as jest.Mock).mockResolvedValue([[{ count: 2 }], []]);

      const result = await ChallengeService.hasUserPredictions(10, 5);

      expect(result).toBe(true);
    });

    it('should return false when count is 0', async () => {
      (mockPool.execute as jest.Mock).mockResolvedValue([[{ count: 0 }], []]);

      const result = await ChallengeService.hasUserPredictions(10, 5);

      expect(result).toBe(false);
    });
  });
});
