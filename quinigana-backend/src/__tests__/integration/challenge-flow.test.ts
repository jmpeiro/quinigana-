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
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));

jest.mock('../../../models/challenge.model');
jest.mock('../../../models/gamification.model');
jest.mock('../../../models/notification.model');
jest.mock('../../../models/stats.model');
jest.mock('../../../services/notification.service');
jest.mock('../../../services/gamification.service');
jest.mock('../../../services/web-push.service');

import { ChallengeService } from '../../../services/challenge.service';
import { GamificationService } from '../../../services/gamification.service';
import { NotificationService } from '../../../services/notification.service';
import { ChallengeModel } from '../../../models/challenge.model';

const mockChallengeModel = ChallengeModel as jest.Mocked<typeof ChallengeModel>;
const mockGamificationService = GamificationService as jest.Mocked<typeof GamificationService>;
const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;

// ─── Shared test data ────────────────────────────────────────────────────────

const CHALLENGER_ID = 10;
const CHALLENGED_ID = 20;
const JORNADA_ID = 5;
const CHALLENGE_ID = 1;

const baseChallenge = {
  id: CHALLENGE_ID,
  challenger_id: CHALLENGER_ID,
  challenged_id: CHALLENGED_ID,
  jornada_id: JORNADA_ID,
  wager_points: 50,
  status: 'pending' as const,
  message: 'Te reto!',
  created_at: new Date('2025-06-01'),
  accepted_at: null,
  completed_at: null,
  challenger_score: null,
  challenged_score: null,
  winner_id: null,
};

const challengeWithDetails = {
  ...baseChallenge,
  challenger_name: 'Alice',
  challenged_name: 'Bob',
  jornada_name: 'Jornada 5',
  challenger_avatar: null,
  challenged_avatar: null,
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Challenge Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete the full challenge flow from creation to resolution', async () => {
    // ─── Step 1: Create a challenge ───────────────────────────────────
    mockChallengeModel.create.mockResolvedValue(CHALLENGE_ID);
    mockChallengeModel.findByIdWithDetails.mockResolvedValue(challengeWithDetails as any);

    const challenge = await ChallengeService.createChallenge(CHALLENGER_ID, {
      challenged_id: CHALLENGED_ID,
      jornada_id: JORNADA_ID,
      wager_points: 50,
      message: 'Te reto!',
    });

    expect(mockChallengeModel.create).toHaveBeenCalledWith(
      CHALLENGER_ID,
      CHALLENGED_ID,
      JORNADA_ID,
      50,
      'Te reto!'
    );
    expect(challenge).toBeDefined();
    expect(challenge.challenger_name).toBe('Alice');

    // ─── Step 2: Accept the challenge ─────────────────────────────────
    mockChallengeModel.updateStatus.mockResolvedValue(undefined);
    mockChallengeModel.getOrCreateStats.mockResolvedValue(undefined as any);

    await ChallengeService.acceptChallenge(CHALLENGE_ID, baseChallenge);

    expect(mockChallengeModel.updateStatus).toHaveBeenCalledWith(
      CHALLENGE_ID,
      'accepted',
      expect.any(Date)
    );
    expect(mockChallengeModel.getOrCreateStats).toHaveBeenCalledTimes(2);
    expect(mockChallengeModel.getOrCreateStats).toHaveBeenCalledWith(CHALLENGER_ID, CHALLENGED_ID);
    expect(mockChallengeModel.getOrCreateStats).toHaveBeenCalledWith(CHALLENGED_ID, CHALLENGER_ID);

    // ─── Step 3: Verify predictions exist for both users ──────────────
    const pool = require('../../../config/database').default;
    (pool.execute as jest.Mock).mockResolvedValue([[{ count: 1 }], []]);

    const challengerPredictions = await ChallengeService.verifyPredictions(
      CHALLENGER_ID,
      { ...baseChallenge, status: 'accepted' as const }
    );
    expect(challengerPredictions.hasPredictions).toBe(true);
    expect(challengerPredictions.message).toContain('predicciones de grupo');

    const challengedPredictions = await ChallengeService.verifyPredictions(
      CHALLENGED_ID,
      { ...baseChallenge, status: 'accepted' as const }
    );
    expect(challengedPredictions.hasPredictions).toBe(true);

    // ─── Step 4: Resolve challenge after jornada scoring ──────────────
    const acceptedChallenge = {
      ...baseChallenge,
      status: 'accepted' as const,
      accepted_at: new Date(),
    };

    mockChallengeModel.getActiveChallengesForJornada.mockResolvedValue([acceptedChallenge] as any);

    const { withTransaction } = require('../../../config/database');
    (withTransaction as jest.Mock).mockImplementation(async (cb: any) => {
      const mockConn = {
        execute: jest.fn()
          // Challenger score query
          .mockResolvedValueOnce([[{ score: 8 }], []])
          // Challenged score query
          .mockResolvedValueOnce([[{ score: 5 }], []])
          // UPDATE challenge to completed
          .mockResolvedValueOnce([{ affectedRows: 1 }, []])
          // UPDATE winner reputation
          .mockResolvedValueOnce([{ affectedRows: 1 }, []])
          // UPDATE loser reputation
          .mockResolvedValueOnce([{ affectedRows: 1 }, []]),
      };
      return cb(mockConn);
    });

    // After resolution, findByIdWithDetails returns the completed challenge
    mockChallengeModel.findByIdWithDetails.mockResolvedValue({
      ...challengeWithDetails,
      status: 'completed',
      challenger_score: 8,
      challenged_score: 5,
      winner_id: CHALLENGER_ID,
      completed_at: new Date(),
    } as any);

    mockChallengeModel.updateStats.mockResolvedValue(undefined);
    mockNotificationService.notifyChallengeResult.mockResolvedValue(undefined);

    // ─── Step 5: Verify XP was awarded ────────────────────────────────
    mockGamificationService.grantXp.mockResolvedValue({ newLevel: 2, leveledUp: false });

    // ─── Step 6: Verify badges were checked ───────────────────────────
    mockChallengeModel.getUserCompletedCount.mockResolvedValue(1);
    mockChallengeModel.getUserWinCount.mockResolvedValue(1);
    mockChallengeModel.getUserWinStreak.mockResolvedValue(1);
    mockGamificationService.awardBadgeIfEligible.mockResolvedValue(undefined);

    await ChallengeService.resolveChallengesForJornada(JORNADA_ID);

    expect(mockChallengeModel.getActiveChallengesForJornada).toHaveBeenCalledWith(JORNADA_ID);

    // Verify transaction was called for the resolution
    expect(withTransaction).toHaveBeenCalled();

    // ─── Step 7: Verify notifications were sent ───────────────────────
    // The post-resolution notifications are called inside resolveChallenge
    expect(mockNotificationService.notifyChallengeResult).toHaveBeenCalledTimes(2);

    // Challenger notification (winner)
    expect(mockNotificationService.notifyChallengeResult).toHaveBeenCalledWith(
      CHALLENGER_ID,
      'Bob',
      'Jornada 5',
      true,  // isWinner
      false, // isDraw
      50     // wager_points
    );

    // Challenged notification (loser)
    expect(mockNotificationService.notifyChallengeResult).toHaveBeenCalledWith(
      CHALLENGED_ID,
      'Alice',
      'Jornada 5',
      false, // isWinner
      false, // isDraw
      50     // wager_points
    );

    // Verify XP was granted for both participants
    expect(mockGamificationService.grantXp).toHaveBeenCalled();

    // Verify badge checks were triggered
    expect(mockGamificationService.awardBadgeIfEligible).toHaveBeenCalled();
  });

  it('should handle draw scenario correctly', async () => {
    const acceptedChallenge = {
      ...baseChallenge,
      status: 'accepted' as const,
      accepted_at: new Date(),
    };

    mockChallengeModel.getActiveChallengesForJornada.mockResolvedValue([acceptedChallenge] as any);

    const { withTransaction } = require('../../../config/database');
    (withTransaction as jest.Mock).mockImplementation(async (cb: any) => {
      const mockConn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[{ score: 5 }], []])  // Challenger score
          .mockResolvedValueOnce([[{ score: 5 }], []])  // Challenged score (same = draw)
          .mockResolvedValueOnce([{ affectedRows: 1 }, []]), // UPDATE challenge
      };
      return cb(mockConn);
    });

    mockChallengeModel.findByIdWithDetails.mockResolvedValue({
      ...challengeWithDetails,
      status: 'completed',
      challenger_score: 5,
      challenged_score: 5,
      winner_id: null,
      completed_at: new Date(),
    } as any);
    mockChallengeModel.updateStats.mockResolvedValue(undefined);
    mockNotificationService.notifyChallengeResult.mockResolvedValue(undefined);
    mockGamificationService.grantXp.mockResolvedValue({ newLevel: 1, leveledUp: false });
    mockChallengeModel.getUserCompletedCount.mockResolvedValue(1);
    mockChallengeModel.getUserWinCount.mockResolvedValue(0);
    mockChallengeModel.getUserWinStreak.mockResolvedValue(0);
    mockGamificationService.awardBadgeIfEligible.mockResolvedValue(undefined);

    await ChallengeService.resolveChallengesForJornada(JORNADA_ID);

    // Both get isDraw = true in notifications
    expect(mockNotificationService.notifyChallengeResult).toHaveBeenCalledWith(
      CHALLENGER_ID,
      expect.any(String),
      expect.any(String),
      false, // isWinner
      true,  // isDraw
      50
    );
  });

  it('should skip resolution when no active challenges exist', async () => {
    mockChallengeModel.getActiveChallengesForJornada.mockResolvedValue([]);

    await ChallengeService.resolveChallengesForJornada(JORNADA_ID);

    const { withTransaction } = require('../../../config/database');
    expect(withTransaction).not.toHaveBeenCalled();
  });

  it('should verify no predictions returns correct message', async () => {
    const pool = require('../../../config/database').default;
    (pool.execute as jest.Mock).mockResolvedValue([[{ count: 0 }], []]);

    const result = await ChallengeService.verifyPredictions(
      CHALLENGER_ID,
      baseChallenge
    );

    expect(result.hasPredictions).toBe(false);
    expect(result.message).toContain('Necesitas tener una propuesta aprobada');
  });
});
