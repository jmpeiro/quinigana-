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

jest.mock('../../models/score.model');
jest.mock('../../models/proposal.model');
jest.mock('../../models/match.model');
jest.mock('../../models/group.model');
jest.mock('../../services/cache.service');

import { ScoreService } from '../../services/score.service';
import { ScoreModel } from '../../models/score.model';
import { ProposalModel } from '../../models/proposal.model';
import { MatchModel } from '../../models/match.model';
import { GroupModel } from '../../models/group.model';
import { CacheService } from '../../services/cache.service';
import pool, { withTransaction } from '../../config/database';

const mockScoreModel = ScoreModel as jest.Mocked<typeof ScoreModel>;
const mockProposalModel = ProposalModel as jest.Mocked<typeof ProposalModel>;
const mockMatchModel = MatchModel as jest.Mocked<typeof MatchModel>;
const mockGroupModel = GroupModel as jest.Mocked<typeof GroupModel>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;
const mockPool = pool as jest.Mocked<typeof pool>;
const mockWithTransaction = withTransaction as jest.MockedFunction<typeof withTransaction>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ScoreService', () => {
  // =====================================================
  // CALCULATE SCORES FOR JORNADA
  // =====================================================
  describe('calculateScoresForJornada', () => {
    it('should return early when no match results', async () => {
      mockMatchModel.getResultsByJornada.mockResolvedValue([]);

      await ScoreService.calculateScoresForJornada(1);

      expect(mockPool.execute).not.toHaveBeenCalled();
      expect(mockWithTransaction).not.toHaveBeenCalled();
    });

    it('should score single prediction correct 1X2 as 1 point', async () => {
      const matchResults = [{ match_id: 100, result_1x2: '1', home_score: 2, away_score: 1 }];
      mockMatchModel.getResultsByJornada.mockResolvedValue(matchResults as any);

      const proposals = [{ id: 10, group_id: 5, jornada_id: 1, status: 'approved' }];
      (mockPool.execute as jest.Mock).mockResolvedValue([proposals, []]);

      const predictions = [{
        match_id: 100,
        prediction_1x2: '1',  // single => length 1
        home_score_prediction: null,
        away_score_prediction: null,
      }];
      mockProposalModel.getPredictions.mockResolvedValue(predictions as any);

      const mockConn = { execute: jest.fn().mockResolvedValue([[], []]) };
      mockWithTransaction.mockImplementation(async (cb: any) => cb(mockConn));

      await ScoreService.calculateScoresForJornada(1);

      // quiniela_results insert: points_1x2 = 1, points_pleno = 0
      expect(mockConn.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO quiniela_results'),
        [10, 100, 1, 0, true, false]
      );
      // group_scores insert: total = 1, correct_1x2 = 1, correct_pleno = 0
      expect(mockConn.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO group_scores'),
        [5, 1, 10, 1, 1, 0]
      );
      expect(mockCacheService.invalidateScoresAndStandings).toHaveBeenCalled();
    });

    it('should score double prediction correct 1X2 as 0.5 points', async () => {
      const matchResults = [{ match_id: 100, result_1x2: '1', home_score: 2, away_score: 1 }];
      mockMatchModel.getResultsByJornada.mockResolvedValue(matchResults as any);

      const proposals = [{ id: 10, group_id: 5, jornada_id: 1, status: 'approved' }];
      (mockPool.execute as jest.Mock).mockResolvedValue([proposals, []]);

      const predictions = [{
        match_id: 100,
        prediction_1x2: '1X',  // double => length 2
        home_score_prediction: null,
        away_score_prediction: null,
      }];
      mockProposalModel.getPredictions.mockResolvedValue(predictions as any);

      const mockConn = { execute: jest.fn().mockResolvedValue([[], []]) };
      mockWithTransaction.mockImplementation(async (cb: any) => cb(mockConn));

      await ScoreService.calculateScoresForJornada(1);

      expect(mockConn.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO quiniela_results'),
        [10, 100, 0.5, 0, true, false]
      );
      expect(mockConn.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO group_scores'),
        [5, 1, 10, 0.5, 1, 0]
      );
    });

    it('should score triple prediction as 0 points', async () => {
      const matchResults = [{ match_id: 100, result_1x2: '1', home_score: 2, away_score: 1 }];
      mockMatchModel.getResultsByJornada.mockResolvedValue(matchResults as any);

      const proposals = [{ id: 10, group_id: 5, jornada_id: 1, status: 'approved' }];
      (mockPool.execute as jest.Mock).mockResolvedValue([proposals, []]);

      const predictions = [{
        match_id: 100,
        prediction_1x2: '1X2',  // triple => length 3
        home_score_prediction: null,
        away_score_prediction: null,
      }];
      mockProposalModel.getPredictions.mockResolvedValue(predictions as any);

      const mockConn = { execute: jest.fn().mockResolvedValue([[], []]) };
      mockWithTransaction.mockImplementation(async (cb: any) => cb(mockConn));

      await ScoreService.calculateScoresForJornada(1);

      // Triple correct still counts as is_correct_1x2 = true, but 0 points
      expect(mockConn.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO quiniela_results'),
        [10, 100, 0, 0, true, false]
      );
      expect(mockConn.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO group_scores'),
        [5, 1, 10, 0, 1, 0]
      );
    });

    it('should score pleno correct as 3 points', async () => {
      const matchResults = [{ match_id: 100, result_1x2: '1', home_score: 2, away_score: 1 }];
      mockMatchModel.getResultsByJornada.mockResolvedValue(matchResults as any);

      const proposals = [{ id: 10, group_id: 5, jornada_id: 1, status: 'approved' }];
      (mockPool.execute as jest.Mock).mockResolvedValue([proposals, []]);

      const predictions = [{
        match_id: 100,
        prediction_1x2: 'X',  // wrong 1X2 (result is '1')
        home_score_prediction: 2,
        away_score_prediction: 1,
      }];
      mockProposalModel.getPredictions.mockResolvedValue(predictions as any);

      const mockConn = { execute: jest.fn().mockResolvedValue([[], []]) };
      mockWithTransaction.mockImplementation(async (cb: any) => cb(mockConn));

      await ScoreService.calculateScoresForJornada(1);

      // 1X2 wrong = 0 pts, pleno correct = 3 pts
      expect(mockConn.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO quiniela_results'),
        [10, 100, 0, 3, false, true]
      );
      expect(mockConn.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO group_scores'),
        [5, 1, 10, 3, 0, 1]
      );
    });

    it('should combine 1X2 and pleno scoring', async () => {
      const matchResults = [{ match_id: 100, result_1x2: '1', home_score: 2, away_score: 1 }];
      mockMatchModel.getResultsByJornada.mockResolvedValue(matchResults as any);

      const proposals = [{ id: 10, group_id: 5, jornada_id: 1, status: 'approved' }];
      (mockPool.execute as jest.Mock).mockResolvedValue([proposals, []]);

      const predictions = [{
        match_id: 100,
        prediction_1x2: '1',  // single correct 1X2 = 1 pt
        home_score_prediction: 2,
        away_score_prediction: 1,  // pleno correct = 3 pts
      }];
      mockProposalModel.getPredictions.mockResolvedValue(predictions as any);

      const mockConn = { execute: jest.fn().mockResolvedValue([[], []]) };
      mockWithTransaction.mockImplementation(async (cb: any) => cb(mockConn));

      await ScoreService.calculateScoresForJornada(1);

      // 1 + 3 = 4 total points
      expect(mockConn.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO quiniela_results'),
        [10, 100, 1, 3, true, true]
      );
      expect(mockConn.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO group_scores'),
        [5, 1, 10, 4, 1, 1]
      );
    });

    it('should invalidate cache after scoring', async () => {
      const matchResults = [{ match_id: 100, result_1x2: '1', home_score: 2, away_score: 1 }];
      mockMatchModel.getResultsByJornada.mockResolvedValue(matchResults as any);
      (mockPool.execute as jest.Mock).mockResolvedValue([[], []]);

      const mockConn = { execute: jest.fn().mockResolvedValue([[], []]) };
      mockWithTransaction.mockImplementation(async (cb: any) => cb(mockConn));

      await ScoreService.calculateScoresForJornada(1);

      expect(mockCacheService.invalidateScoresAndStandings).toHaveBeenCalled();
    });
  });

  // =====================================================
  // GET GROUP SCORES
  // =====================================================
  describe('getGroupScores', () => {
    it('should return group scores with total', async () => {
      mockGroupModel.findById.mockResolvedValue({ id: 5, name: 'Test Group' } as any);
      mockScoreModel.getGroupScores.mockResolvedValue([
        { jornada_id: 1, total_points: 10 },
        { jornada_id: 2, total_points: 15 },
      ] as any);
      mockScoreModel.getGroupTotalPoints.mockResolvedValue(25);

      const result = await ScoreService.getGroupScores(5);

      expect(result).toEqual({
        group_id: 5,
        group_name: 'Test Group',
        total_points: 25,
        jornadas: expect.arrayContaining([
          expect.objectContaining({ jornada_id: 1, total_points: 10 }),
        ]),
      });
    });

    it('should throw error when group not found', async () => {
      mockGroupModel.findById.mockResolvedValue(null);

      await expect(ScoreService.getGroupScores(999)).rejects.toThrow('Group not found');
    });
  });

  // =====================================================
  // GET GROUP SCORE BY JORNADA
  // =====================================================
  describe('getGroupScoreByJornada', () => {
    it('should return score with proposal details', async () => {
      const score = { group_id: 5, jornada_id: 1, proposal_id: 10, total_points: 8 };
      mockScoreModel.getGroupScoreByJornada.mockResolvedValue(score as any);
      const details = [{ match_id: 100, points_1x2: 1, points_pleno: 3 }];
      mockScoreModel.getResultsByProposal.mockResolvedValue(details as any);

      const result = await ScoreService.getGroupScoreByJornada(5, 1);

      expect(result).toEqual({ ...score, details });
      expect(mockScoreModel.getResultsByProposal).toHaveBeenCalledWith(10);
    });

    it('should return score without details when no proposal_id', async () => {
      const score = { group_id: 5, jornada_id: 1, proposal_id: null, total_points: 0 };
      mockScoreModel.getGroupScoreByJornada.mockResolvedValue(score as any);

      const result = await ScoreService.getGroupScoreByJornada(5, 1);

      expect(result).toEqual({ ...score, details: null });
      expect(mockScoreModel.getResultsByProposal).not.toHaveBeenCalled();
    });

    it('should return null when score not found', async () => {
      mockScoreModel.getGroupScoreByJornada.mockResolvedValue(null);

      const result = await ScoreService.getGroupScoreByJornada(5, 99);

      expect(result).toBeNull();
    });
  });
});
