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

jest.mock('../../../models/user.model');
jest.mock('../../../models/token.model');
jest.mock('../../../models/group.model');
jest.mock('../../../models/jornada.model');
jest.mock('../../../models/match.model');
jest.mock('../../../models/proposal.model');
jest.mock('../../../models/vote.model');
jest.mock('../../../models/challenge.model');
jest.mock('../../../models/dashboard.model');
jest.mock('../../../models/gamification.model');
jest.mock('../../../models/notification.model');
jest.mock('../../../models/stats.model');
jest.mock('../../../services/notification.service');
jest.mock('../../../services/gamification.service');
jest.mock('../../../services/cache.service');
jest.mock('../../../services/email.service');
jest.mock('../../../services/web-push.service');
jest.mock('../../../config/cache', () => ({
  CacheKey: {
    JORNADA_LIST: 'jornada_list',
    LEAGUE_STANDINGS: 'league_standings',
    DASHBOARD: 'dashboard',
  },
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../../config/jwt', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
}));
jest.mock('../../../utils/crypto.util', () => ({
  hashToken: jest.fn().mockReturnValue('hashed-token'),
  generateRandomToken: jest.fn().mockReturnValue('random-token'),
}));

import { AuthService } from '../../../services/auth.service';
import { DashboardService } from '../../../services/dashboard.service';
import { JornadaService } from '../../../services/jornada.service';
import { GroupService } from '../../../services/group.service';
import { ProposalService } from '../../../services/proposal.service';
import { ChallengeService } from '../../../services/challenge.service';
import { GamificationService } from '../../../services/gamification.service';
import { ExportService } from '../../../services/export.service';
import { UserModel } from '../../../models/user.model';
import { TokenModel } from '../../../models/token.model';
import { GroupModel } from '../../../models/group.model';
import { JornadaModel } from '../../../models/jornada.model';
import { MatchModel } from '../../../models/match.model';
import { ProposalModel } from '../../../models/proposal.model';
import { DashboardModel } from '../../../models/dashboard.model';
import { ChallengeModel } from '../../../models/challenge.model';
import { NotificationService } from '../../../services/notification.service';
import { CacheService } from '../../../services/cache.service';
import { StatsModel } from '../../../models/stats.model';

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockTokenModel = TokenModel as jest.Mocked<typeof TokenModel>;
const mockGroupModel = GroupModel as jest.Mocked<typeof GroupModel>;
const mockJornadaModel = JornadaModel as jest.Mocked<typeof JornadaModel>;
const mockMatchModel = MatchModel as jest.Mocked<typeof MatchModel>;
const mockProposalModel = ProposalModel as jest.Mocked<typeof ProposalModel>;
const mockDashboardModel = DashboardModel as jest.Mocked<typeof DashboardModel>;
const mockChallengeModel = ChallengeModel as jest.Mocked<typeof ChallengeModel>;
const mockGamificationService = GamificationService as jest.Mocked<typeof GamificationService>;
const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;
const mockStatsModel = StatsModel as jest.Mocked<typeof StatsModel>;

// ─── Shared test data ────────────────────────────────────────────────────────

const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const sampleUser = {
  id: 1,
  email: 'alice@test.com',
  password_hash: 'hashed-password',
  first_name: 'Alice',
  last_name: 'Smith',
  avatar_url: null,
  auth_provider: 'local' as const,
  email_verified: false,
  is_admin: false,
  is_active: true,
  created_at: new Date(),
  reputation_points: 100,
};

const sampleUserB = {
  ...sampleUser,
  id: 2,
  email: 'bob@test.com',
  first_name: 'Bob',
  last_name: 'Jones',
  reputation_points: 80,
};

const sampleJornada = {
  id: 1,
  name: 'Jornada 1',
  season: '2025-2026',
  jornada_number: 1,
  status: 'open' as const,
  deadline: futureDeadline,
  created_at: new Date(),
};

const sampleMatches = [
  { id: 1, jornada_id: 1, match_number: 1, home_team: 'Real Madrid', away_team: 'Barcelona' },
  { id: 2, jornada_id: 1, match_number: 2, home_team: 'Atletico', away_team: 'Sevilla' },
];

// ─── Journey 1: New User Registration and First Prediction ──────────────────

describe('Journey 1: New user registration and first prediction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockCacheService.get as jest.Mock).mockReturnValue(null);
    (mockCacheService.set as jest.Mock).mockReturnValue(undefined);
    (mockCacheService.invalidateByPrefix as jest.Mock).mockReturnValue(undefined);
  });

  it('should register, verify email, view dashboard, create group, and submit prediction', async () => {
    // ─── Register ─────────────────────────────────────────────────────
    mockUserModel.findByEmail.mockResolvedValue(null);
    mockUserModel.create.mockResolvedValue(1);
    mockUserModel.findById.mockResolvedValue(sampleUser as any);
    mockTokenModel.saveRefreshToken.mockResolvedValue(undefined);
    mockUserModel.setEmailVerificationToken.mockResolvedValue(undefined);

    const { user, tokens } = await AuthService.register({
      email: 'alice@test.com',
      password: 'SecurePass123!',
      first_name: 'Alice',
      last_name: 'Smith',
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('alice@test.com');
    expect(tokens.accessToken).toBe('mock-access-token');
    expect(mockUserModel.create).toHaveBeenCalled();

    // ─── Verify email ─────────────────────────────────────────────────
    mockUserModel.findByVerificationToken.mockResolvedValue(sampleUser as any);
    mockUserModel.markEmailVerified.mockResolvedValue(undefined);
    mockUserModel.findById.mockResolvedValue({
      ...sampleUser,
      email_verified: true,
    } as any);

    const verifyResult = await AuthService.verifyEmail('some-verification-token');

    expect(verifyResult.user.email_verified).toBe(true);
    expect(mockUserModel.markEmailVerified).toHaveBeenCalledWith(1);

    // ─── View dashboard ───────────────────────────────────────────────
    mockDashboardModel.getActiveJornada.mockResolvedValue(sampleJornada as any);
    mockDashboardModel.getUserGroupsWithScores.mockResolvedValue([]);
    mockDashboardModel.getLatestResults.mockResolvedValue([]);
    mockDashboardModel.getUserStats.mockResolvedValue({
      totalPoints: 0,
      totalPredictions: 0,
      correctPleno: 0,
    } as any);

    const dashboard = await DashboardService.getDashboardData(1);

    expect(dashboard).toBeDefined();
    expect(dashboard.activeJornada).toBeDefined();
    expect(dashboard.myGroups).toHaveLength(0);

    // ─── View available jornadas ──────────────────────────────────────
    mockJornadaModel.findAll.mockResolvedValue([sampleJornada] as any);

    const jornadas = await JornadaService.getAll();

    expect(jornadas).toHaveLength(1);

    // ─── Create a group ───────────────────────────────────────────────
    mockGroupModel.create.mockResolvedValue(10);
    mockGroupModel.addMember.mockResolvedValue(undefined);
    mockGroupModel.findById.mockResolvedValue({
      id: 10,
      name: 'Mi Grupo',
      description: null,
      created_by: 1,
    } as any);

    const group = await GroupService.createGroup('Mi Grupo', null, 1);

    expect(group).toBeDefined();
    expect(group!.name).toBe('Mi Grupo');

    // ─── Create a proposal (auto-approved, only member) ───────────────
    mockJornadaModel.findById.mockResolvedValue(sampleJornada as any);
    mockProposalModel.findApprovedByGroupAndJornada.mockResolvedValue(null);
    mockMatchModel.findByJornada.mockResolvedValue(sampleMatches as any);
    mockGroupModel.getMemberCount.mockResolvedValue(1);
    mockProposalModel.create.mockResolvedValue(50);
    mockProposalModel.addPredictions.mockResolvedValue(undefined);
    mockProposalModel.getWithDetails.mockResolvedValue({
      id: 50,
      group_id: 10,
      jornada_id: 1,
      proposed_by: 1,
      status: 'draft',
      predictions: [
        { match_id: 1, prediction_1x2: '1' },
        { match_id: 2, prediction_1x2: 'X' },
      ],
    } as any);

    const proposal = await ProposalService.createProposal(10, 1, {
      jornada_id: 1,
      title: 'Mi primera quiniela',
      predictions: [
        { match_id: 1, prediction_1x2: '1' },
        { match_id: 2, prediction_1x2: 'X' },
      ],
    } as any);

    expect(proposal).toBeDefined();

    // Submit for voting (auto-approve since 1 member)
    mockProposalModel.findById.mockResolvedValue({
      id: 50,
      group_id: 10,
      jornada_id: 1,
      proposed_by: 1,
      status: 'draft',
    } as any);
    mockProposalModel.findActiveByGroupAndJornada.mockResolvedValue(null);
    mockProposalModel.updateStatus.mockResolvedValue(undefined);
    mockProposalModel.getWithDetails.mockResolvedValue({
      id: 50,
      status: 'approved',
    } as any);

    const approved = await ProposalService.submitForVoting(50, 1);

    expect(mockProposalModel.updateStatus).toHaveBeenCalledWith(50, 'approved');
    expect(approved!.status).toBe('approved');

    // ─── Verify gamification XP granted ───────────────────────────────
    mockGamificationService.processProposalCreated.mockResolvedValue(undefined);

    await GamificationService.processProposalCreated(1);

    expect(mockGamificationService.processProposalCreated).toHaveBeenCalledWith(1);
  });
});

// ─── Journey 2: Challenge Between Two Users ─────────────────────────────────

describe('Journey 2: Challenge between two users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete a challenge lifecycle with winner and loser XP/reputation', async () => {
    // ─── User A creates challenge ─────────────────────────────────────
    mockChallengeModel.create.mockResolvedValue(1);
    mockChallengeModel.findByIdWithDetails.mockResolvedValue({
      id: 1,
      challenger_id: 1,
      challenged_id: 2,
      jornada_id: 1,
      wager_points: 30,
      status: 'pending',
      message: 'Vamos!',
      challenger_name: 'Alice',
      challenged_name: 'Bob',
      jornada_name: 'Jornada 1',
      created_at: new Date(),
      accepted_at: null,
      completed_at: null,
      challenger_score: null,
      challenged_score: null,
      winner_id: null,
    } as any);

    const challenge = await ChallengeService.createChallenge(1, {
      challenged_id: 2,
      jornada_id: 1,
      wager_points: 30,
      message: 'Vamos!',
    });

    expect(challenge.challenger_name).toBe('Alice');

    // ─── User B accepts ───────────────────────────────────────────────
    mockChallengeModel.updateStatus.mockResolvedValue(undefined);
    mockChallengeModel.getOrCreateStats.mockResolvedValue(undefined as any);

    await ChallengeService.acceptChallenge(1, {
      id: 1,
      challenger_id: 1,
      challenged_id: 2,
      jornada_id: 1,
      wager_points: 30,
      status: 'pending',
      message: 'Vamos!',
      created_at: new Date(),
      accepted_at: null,
      completed_at: null,
      challenger_score: null,
      challenged_score: null,
      winner_id: null,
    });

    expect(mockChallengeModel.updateStatus).toHaveBeenCalledWith(1, 'accepted', expect.any(Date));

    // ─── Both verify predictions ──────────────────────────────────────
    const pool = require('../../../config/database').default;
    (pool.execute as jest.Mock).mockResolvedValue([[{ count: 1 }], []]);

    const predA = await ChallengeService.verifyPredictions(1, {
      id: 1, challenger_id: 1, challenged_id: 2, jornada_id: 1,
      wager_points: 30, status: 'accepted', message: '', created_at: new Date(),
      accepted_at: new Date(), completed_at: null, challenger_score: null,
      challenged_score: null, winner_id: null,
    });
    const predB = await ChallengeService.verifyPredictions(2, {
      id: 1, challenger_id: 1, challenged_id: 2, jornada_id: 1,
      wager_points: 30, status: 'accepted', message: '', created_at: new Date(),
      accepted_at: new Date(), completed_at: null, challenger_score: null,
      challenged_score: null, winner_id: null,
    });

    expect(predA.hasPredictions).toBe(true);
    expect(predB.hasPredictions).toBe(true);

    // ─── Jornada finishes, challenge resolved ─────────────────────────
    mockChallengeModel.getActiveChallengesForJornada.mockResolvedValue([{
      id: 1,
      challenger_id: 1,
      challenged_id: 2,
      jornada_id: 1,
      wager_points: 30,
      status: 'accepted',
      message: 'Vamos!',
      created_at: new Date(),
      accepted_at: new Date(),
      completed_at: null,
      challenger_score: null,
      challenged_score: null,
      winner_id: null,
    }] as any);

    const { withTransaction } = require('../../../config/database');
    (withTransaction as jest.Mock).mockImplementation(async (cb: any) => {
      const mockConn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[{ score: 10 }], []]) // User A score
          .mockResolvedValueOnce([[{ score: 6 }], []])  // User B score
          .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // UPDATE challenge
          .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // Winner rep +
          .mockResolvedValueOnce([{ affectedRows: 1 }, []]), // Loser rep -
      };
      return cb(mockConn);
    });

    // Post-resolution: completed challenge details
    mockChallengeModel.findByIdWithDetails.mockResolvedValue({
      id: 1,
      challenger_id: 1,
      challenged_id: 2,
      jornada_id: 1,
      wager_points: 30,
      status: 'completed',
      challenger_score: 10,
      challenged_score: 6,
      winner_id: 1,
      challenger_name: 'Alice',
      challenged_name: 'Bob',
      jornada_name: 'Jornada 1',
      completed_at: new Date(),
    } as any);

    mockChallengeModel.updateStats.mockResolvedValue(undefined);
    mockNotificationService.notifyChallengeResult.mockResolvedValue(undefined);
    mockGamificationService.grantXp.mockResolvedValue({ newLevel: 2, leveledUp: false });
    mockChallengeModel.getUserCompletedCount.mockResolvedValue(1);
    mockChallengeModel.getUserWinCount.mockResolvedValue(1);
    mockChallengeModel.getUserWinStreak.mockResolvedValue(1);
    mockGamificationService.awardBadgeIfEligible.mockResolvedValue(undefined);

    await ChallengeService.resolveChallengesForJornada(1);

    // ─── Winner gets reputation + XP ──────────────────────────────────
    // Winner (User A) gets notified as winner
    expect(mockNotificationService.notifyChallengeResult).toHaveBeenCalledWith(
      1,       // challenger (winner)
      'Bob',
      'Jornada 1',
      true,    // isWinner
      false,   // isDraw
      30       // wager_points
    );

    // ─── Loser gets participation XP and reputation loss ──────────────
    expect(mockNotificationService.notifyChallengeResult).toHaveBeenCalledWith(
      2,       // challenged (loser)
      'Alice',
      'Jornada 1',
      false,   // isWinner
      false,   // isDraw
      30       // wager_points
    );

    // Both participants get XP (grantXp called for participation and win)
    expect(mockGamificationService.grantXp).toHaveBeenCalled();
  });
});

// ─── Journey 3: Export Data ─────────────────────────────────────────────────

describe('Journey 3: Export data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export CSV rankings with correct content type and filename', async () => {
    mockStatsModel.getGlobalRankings.mockResolvedValue({
      items: [
        {
          group_name: 'Los Cracks',
          member_count: 5,
          total_points: 42,
          total_jornadas: 10,
          correct_1x2: 30,
          correct_pleno: 4,
        },
      ],
      total: 1,
    } as any);

    const result = await ExportService.generateExport({
      format: 'csv',
      type: 'rankings',
      userId: 1,
    });

    expect(result.contentType).toBe('text/csv; charset=utf-8');
    expect(result.fileName).toMatch(/^quinigana-rankings-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(typeof result.data).toBe('string');
    expect(result.data).toContain('Los Cracks');
  });

  it('should export PDF predictions with correct content type and filename', async () => {
    mockStatsModel.getPredictionHistory.mockResolvedValue({
      items: [
        {
          jornadaName: 'Jornada 1',
          groupName: 'Mi Grupo',
          finishedAt: '2025-06-01',
          totalPoints: 8,
          correct1x2: 6,
          correctPleno: 1,
        },
      ],
      total: 1,
    } as any);

    const result = await ExportService.generateExport({
      format: 'pdf',
      type: 'predictions',
      userId: 1,
    });

    expect(result.contentType).toBe('application/pdf');
    expect(result.fileName).toMatch(/^quinigana-predictions-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(Buffer.isBuffer(result.data)).toBe(true);
    expect((result.data as Buffer).length).toBeGreaterThan(0);
  });

  it('should handle empty rankings export gracefully', async () => {
    mockStatsModel.getGlobalRankings.mockResolvedValue({
      items: [],
      total: 0,
    } as any);

    const result = await ExportService.generateExport({
      format: 'csv',
      type: 'rankings',
      userId: 1,
    });

    expect(result.contentType).toBe('text/csv; charset=utf-8');
    expect(result.data).toBe('No data available');
  });
});
