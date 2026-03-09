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

jest.mock('../../../models/jornada.model');
jest.mock('../../../models/match.model');
jest.mock('../../../models/proposal.model');
jest.mock('../../../models/vote.model');
jest.mock('../../../models/group.model');
jest.mock('../../../models/score.model');
jest.mock('../../../models/gamification.model');
jest.mock('../../../models/stats.model');
jest.mock('../../../models/notification.model');
jest.mock('../../../models/user.model');
jest.mock('../../../models/league.model');
jest.mock('../../../services/notification.service');
jest.mock('../../../services/cache.service');
jest.mock('../../../services/scraper-fallback.service');
jest.mock('../../../services/web-push.service');
jest.mock('../../../config/cache', () => ({
  CacheKey: {
    JORNADA_LIST: 'jornada_list',
    LEAGUE_STANDINGS: 'league_standings',
    DASHBOARD: 'dashboard',
  },
}));

import { JornadaService } from '../../../services/jornada.service';
import { ProposalService } from '../../../services/proposal.service';
import { ScoreService } from '../../../services/score.service';
import { GamificationService } from '../../../services/gamification.service';
import { LeagueService } from '../../../services/league.service';
import { JornadaModel } from '../../../models/jornada.model';
import { MatchModel } from '../../../models/match.model';
import { ProposalModel } from '../../../models/proposal.model';
import { VoteModel } from '../../../models/vote.model';
import { GroupModel } from '../../../models/group.model';
import { ScoreModel } from '../../../models/score.model';
import { GamificationModel } from '../../../models/gamification.model';
import { LeagueModel } from '../../../models/league.model';
import { UserModel } from '../../../models/user.model';
import { CacheService } from '../../../services/cache.service';
import pool from '../../../config/database';

const mockJornadaModel = JornadaModel as jest.Mocked<typeof JornadaModel>;
const mockMatchModel = MatchModel as jest.Mocked<typeof MatchModel>;
const mockProposalModel = ProposalModel as jest.Mocked<typeof ProposalModel>;
const mockVoteModel = VoteModel as jest.Mocked<typeof VoteModel>;
const mockGroupModel = GroupModel as jest.Mocked<typeof GroupModel>;
const mockScoreModel = ScoreModel as jest.Mocked<typeof ScoreModel>;
const mockGamificationModel = GamificationModel as jest.Mocked<typeof GamificationModel>;
const mockLeagueModel = LeagueModel as jest.Mocked<typeof LeagueModel>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;
const mockPool = pool as jest.Mocked<typeof pool>;

// ─── Shared test data ────────────────────────────────────────────────────────

const JORNADA_ID = 1;
const GROUP_ID = 10;
const USER_ID = 100;
const PROPOSAL_ID = 50;

const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const sampleJornada = {
  id: JORNADA_ID,
  name: 'Jornada 1',
  season: '2025-2026',
  jornada_number: 1,
  status: 'open' as const,
  deadline: futureDeadline,
  created_at: new Date(),
};

const sampleMatches = [
  { id: 1, jornada_id: JORNADA_ID, match_number: 1, home_team: 'Real Madrid', away_team: 'Barcelona', result: null },
  { id: 2, jornada_id: JORNADA_ID, match_number: 2, home_team: 'Atletico', away_team: 'Sevilla', result: null },
];

const sampleProposal = {
  id: PROPOSAL_ID,
  group_id: GROUP_ID,
  jornada_id: JORNADA_ID,
  proposed_by: USER_ID,
  title: 'Mi quiniela',
  status: 'draft' as const,
  votes_for: 0,
  votes_against: 0,
  total_members_at_creation: 2,
  created_at: new Date(),
};

const sampleProposalDetail = {
  ...sampleProposal,
  predictions: [
    { match_id: 1, prediction_1x2: '1', home_score_prediction: 2, away_score_prediction: 1 },
    { match_id: 2, prediction_1x2: 'X', home_score_prediction: 1, away_score_prediction: 1 },
  ],
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Jornada Lifecycle Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete the full jornada lifecycle from creation to league processing', async () => {
    // ─── Step 1: Create a jornada with matches ────────────────────────
    mockJornadaModel.create.mockResolvedValue(JORNADA_ID);
    mockMatchModel.createMany.mockResolvedValue(undefined);
    mockJornadaModel.findByIdWithMatches.mockResolvedValue({
      ...sampleJornada,
      matches: sampleMatches,
    } as any);
    mockUserModel.getAllActiveUserIds.mockResolvedValue([USER_ID]);
    (mockCacheService.invalidateByPrefix as jest.Mock).mockReturnValue(undefined);

    const createdJornada = await JornadaService.createJornada({
      name: 'Jornada 1',
      season: '2025-2026',
      jornada_number: 1,
      deadline: futureDeadline,
      matches: [
        { match_number: 1, home_team: 'Real Madrid', away_team: 'Barcelona' },
        { match_number: 2, home_team: 'Atletico', away_team: 'Sevilla' },
      ],
    } as any);

    expect(mockJornadaModel.create).toHaveBeenCalledWith('Jornada 1', '2025-2026', 1, futureDeadline);
    expect(mockMatchModel.createMany).toHaveBeenCalledWith(JORNADA_ID, expect.any(Array));
    expect(createdJornada).toBeDefined();
    expect(createdJornada!.matches).toHaveLength(2);

    // ─── Step 2: Verify jornada is open ───────────────────────────────
    const fetchedJornada = await JornadaService.getById(JORNADA_ID);
    expect(mockJornadaModel.findByIdWithMatches).toHaveBeenCalledWith(JORNADA_ID);
    expect(fetchedJornada).toBeDefined();

    // ─── Step 3: Create a proposal for a group ────────────────────────
    mockJornadaModel.findById.mockResolvedValue(sampleJornada as any);
    mockProposalModel.findApprovedByGroupAndJornada.mockResolvedValue(null);
    mockMatchModel.findByJornada.mockResolvedValue(sampleMatches as any);
    mockGroupModel.getMemberCount.mockResolvedValue(2);
    mockProposalModel.create.mockResolvedValue(PROPOSAL_ID);
    mockProposalModel.addPredictions.mockResolvedValue(undefined);
    mockProposalModel.getWithDetails.mockResolvedValue(sampleProposalDetail as any);

    const proposal = await ProposalService.createProposal(GROUP_ID, USER_ID, {
      jornada_id: JORNADA_ID,
      title: 'Mi quiniela',
      predictions: [
        { match_id: 1, prediction_1x2: '1', home_score_prediction: 2, away_score_prediction: 1 },
        { match_id: 2, prediction_1x2: 'X', home_score_prediction: 1, away_score_prediction: 1 },
      ],
    } as any);

    expect(mockProposalModel.create).toHaveBeenCalled();
    expect(proposal).toBeDefined();

    // ─── Step 4: Submit proposal for voting ───────────────────────────
    mockProposalModel.findById.mockResolvedValue(sampleProposal as any);
    mockProposalModel.findActiveByGroupAndJornada.mockResolvedValue(null);
    mockGroupModel.getMemberCount.mockResolvedValue(2);
    mockProposalModel.updateStatus.mockResolvedValue(undefined);
    mockProposalModel.getWithDetails.mockResolvedValue({
      ...sampleProposalDetail,
      status: 'pending',
    } as any);
    mockGroupModel.getMembers.mockResolvedValue([
      { user_id: USER_ID, first_name: 'Alice', last_name: 'Smith', role: 'admin' },
      { user_id: 101, first_name: 'Bob', last_name: 'Jones', role: 'member' },
    ] as any);
    mockGroupModel.findById.mockResolvedValue({ id: GROUP_ID, name: 'Test Group' } as any);

    const submittedProposal = await ProposalService.submitForVoting(PROPOSAL_ID, USER_ID);

    expect(mockProposalModel.updateStatus).toHaveBeenCalledWith(PROPOSAL_ID, 'pending');
    expect(submittedProposal).toBeDefined();

    // ─── Step 5: Vote to approve ──────────────────────────────────────
    mockProposalModel.findById.mockResolvedValue({
      ...sampleProposal,
      status: 'pending',
    } as any);
    mockGroupModel.isMember.mockResolvedValue(true);
    mockVoteModel.findByProposalAndUser.mockResolvedValue(null);

    const { withTransaction } = require('../../../config/database');
    (withTransaction as jest.Mock).mockImplementation(async (cb: any) => {
      const mockConn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[], []]) // INSERT vote
          .mockResolvedValueOnce([[{ votesFor: 2, votesAgainst: 0 }], []]) // COUNT votes
          .mockResolvedValueOnce([[], []]) // UPDATE vote counts
          .mockResolvedValueOnce([[], []]), // UPDATE status to approved
      };
      return cb(mockConn);
    });

    mockProposalModel.getWithDetails.mockResolvedValue({
      ...sampleProposalDetail,
      status: 'approved',
      votes_for: 2,
    } as any);

    const votedProposal = await ProposalService.vote(PROPOSAL_ID, 101, 'approve');
    expect(votedProposal).toBeDefined();

    // ─── Step 6: Submit match results ─────────────────────────────────
    mockJornadaModel.findById.mockResolvedValue(sampleJornada as any);
    mockMatchModel.findByJornada.mockResolvedValue(sampleMatches as any);
    mockMatchModel.addResult.mockResolvedValue(undefined);
    (mockCacheService.invalidateScoresAndStandings as jest.Mock).mockReturnValue(undefined);
    mockUserModel.getAllActiveUserIds.mockResolvedValue([USER_ID, 101]);
    mockJornadaModel.findByIdWithMatches.mockResolvedValue({
      ...sampleJornada,
      matches: sampleMatches.map((m, i) => ({
        ...m,
        result: { home_score: i === 0 ? 2 : 1, away_score: i === 0 ? 1 : 1 },
      })),
    } as any);

    const jornadaWithResults = await JornadaService.submitResults(JORNADA_ID, {
      results: [
        { match_id: 1, home_score: 2, away_score: 1 },
        { match_id: 2, home_score: 1, away_score: 1 },
      ],
    });

    expect(mockMatchModel.addResult).toHaveBeenCalledTimes(2);
    expect(jornadaWithResults).toBeDefined();

    // ─── Step 7: Calculate scores ─────────────────────────────────────
    mockMatchModel.getResultsByJornada.mockResolvedValue([
      { match_id: 1, home_score: 2, away_score: 1, result_1x2: '1' },
      { match_id: 2, home_score: 1, away_score: 1, result_1x2: 'X' },
    ] as any);
    (mockPool.execute as jest.Mock).mockResolvedValue([
      [{ id: PROPOSAL_ID, group_id: GROUP_ID, jornada_id: JORNADA_ID }],
      [],
    ]);
    mockProposalModel.getPredictions.mockResolvedValue([
      { match_id: 1, prediction_1x2: '1', home_score_prediction: 2, away_score_prediction: 1 },
      { match_id: 2, prediction_1x2: 'X', home_score_prediction: 1, away_score_prediction: 1 },
    ] as any);

    (withTransaction as jest.Mock).mockImplementation(async (cb: any) => {
      const mockConn = {
        execute: jest.fn().mockResolvedValue([[], []]),
      };
      return cb(mockConn);
    });

    await ScoreService.calculateScoresForJornada(JORNADA_ID);

    expect(mockMatchModel.getResultsByJornada).toHaveBeenCalledWith(JORNADA_ID);

    // ─── Step 8: Verify group scores ──────────────────────────────────
    mockGroupModel.findById.mockResolvedValue({ id: GROUP_ID, name: 'Test Group' } as any);
    mockScoreModel.getGroupScores.mockResolvedValue([
      { jornada_id: JORNADA_ID, total_points: 5, correct_1x2: 2, correct_pleno: 2 },
    ] as any);
    mockScoreModel.getGroupTotalPoints.mockResolvedValue(5);

    const groupScores = await ScoreService.getGroupScores(GROUP_ID);

    expect(groupScores.group_id).toBe(GROUP_ID);
    expect(groupScores.total_points).toBe(5);
    expect(groupScores.jornadas).toHaveLength(1);

    // ─── Step 9: Process gamification achievements ────────────────────
    mockGamificationModel.getJornadaParticipants.mockResolvedValue([USER_ID, 101]);
    mockGamificationModel.getJornadaCorrects.mockResolvedValue({
      correct1x2: 2,
      doubles1x2: 0,
      correctPleno: 2,
    } as any);
    mockGamificationModel.ensureUserXp.mockResolvedValue(undefined);
    mockGamificationModel.getUserXp.mockResolvedValue({ total_xp: 0, level: 1 } as any);
    mockGamificationModel.addXp.mockResolvedValue(undefined);
    mockGamificationModel.getUserBadgeCodes.mockResolvedValue([]);
    mockGamificationModel.getProposalCount.mockResolvedValue(1);
    mockGamificationModel.getVoteCount.mockResolvedValue(1);
    mockGamificationModel.isGroupChampion.mockResolvedValue(false);
    mockGamificationModel.getBadgeByCode.mockResolvedValue(null);

    const { StatsModel } = require('../../../models/stats.model');
    (StatsModel.getPersonalStats as jest.Mock).mockResolvedValue({
      totalPoints: 5,
      totalPredictions: 2,
      correctPleno: 2,
    });
    (StatsModel.getStreaks as jest.Mock).mockResolvedValue({ bestStreak: 1 });

    await GamificationService.processJornadaAchievements(JORNADA_ID);

    expect(mockGamificationModel.getJornadaParticipants).toHaveBeenCalledWith(JORNADA_ID);
    expect(mockGamificationModel.getJornadaCorrects).toHaveBeenCalledTimes(2);

    // ─── Step 10: Process league standings ────────────────────────────
    mockLeagueModel.getActiveSeason.mockResolvedValue({
      id: 1,
      start_jornada_id: 1,
      end_jornada_id: 38,
    } as any);
    mockLeagueModel.ensureUserInSeason.mockResolvedValue({ division_id: 1 } as any);
    mockLeagueModel.updateStandingPoints.mockResolvedValue(undefined);
    mockLeagueModel.recalculatePositions.mockResolvedValue(undefined);
    (mockCacheService.invalidateByPrefix as jest.Mock).mockReturnValue(undefined);

    (withTransaction as jest.Mock).mockImplementation(async (cb: any) => cb({}));

    await LeagueService.processJornadaScores(JORNADA_ID, [
      { userId: USER_ID, points: 5, correct1x2: 2, correctPleno: 2 },
      { userId: 101, points: 3, correct1x2: 1, correctPleno: 1 },
    ]);

    expect(mockLeagueModel.getActiveSeason).toHaveBeenCalled();
    expect(mockLeagueModel.ensureUserInSeason).toHaveBeenCalledTimes(2);
    expect(mockLeagueModel.updateStandingPoints).toHaveBeenCalledTimes(2);
    expect(mockLeagueModel.recalculatePositions).toHaveBeenCalled();
  });

  it('should handle jornada creation with no active users gracefully', async () => {
    mockJornadaModel.create.mockResolvedValue(JORNADA_ID);
    mockMatchModel.createMany.mockResolvedValue(undefined);
    mockJornadaModel.findByIdWithMatches.mockResolvedValue({
      ...sampleJornada,
      matches: sampleMatches,
    } as any);
    mockUserModel.getAllActiveUserIds.mockResolvedValue([]);
    (mockCacheService.invalidateByPrefix as jest.Mock).mockReturnValue(undefined);

    const result = await JornadaService.createJornada({
      name: 'Jornada 1',
      season: '2025-2026',
      jornada_number: 1,
      deadline: futureDeadline,
      matches: [
        { match_number: 1, home_team: 'Real Madrid', away_team: 'Barcelona' },
      ],
    } as any);

    expect(result).toBeDefined();
    expect(mockJornadaModel.create).toHaveBeenCalled();
  });

  it('should reject score calculation when no results exist', async () => {
    mockMatchModel.getResultsByJornada.mockResolvedValue([]);

    await ScoreService.calculateScoresForJornada(JORNADA_ID);

    // withTransaction should not be called when there are no results
    const { withTransaction } = require('../../../config/database');
    expect(withTransaction).not.toHaveBeenCalled();
  });

  it('should skip league processing when no active season exists', async () => {
    mockLeagueModel.getActiveSeason.mockResolvedValue(null);

    await LeagueService.processJornadaScores(JORNADA_ID, [
      { userId: USER_ID, points: 5, correct1x2: 2, correctPleno: 2 },
    ]);

    expect(mockLeagueModel.ensureUserInSeason).not.toHaveBeenCalled();
  });
});
