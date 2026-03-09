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

jest.mock('../../models/stats.model');
jest.mock('../../services/cache.service', () => ({
  CacheService: {
    get: jest.fn(),
    set: jest.fn(),
    buildKey: jest.fn((...parts: any[]) => parts.join(':')),
  },
}));

import { StatsService } from '../../services/stats.service';
import { StatsModel } from '../../models/stats.model';
import { CacheService } from '../../services/cache.service';

const mockStatsModel = StatsModel as jest.Mocked<typeof StatsModel>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;

describe('StatsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPersonalStats', () => {
    it('should calculate accuracy percentages correctly', async () => {
      (mockStatsModel.getPersonalStats as jest.Mock).mockResolvedValue({
        totalPredictions: 100,
        correct1x2: 60,
        correctPleno: 10,
        totalPoints: 200,
      });
      (mockStatsModel.getEvolution as jest.Mock).mockResolvedValue([]);
      (mockStatsModel.getGroupComparison as jest.Mock).mockResolvedValue([]);
      (mockStatsModel.getStreaks as jest.Mock).mockResolvedValue({ currentStreak: 3, bestStreak: 7 });

      const result = await StatsService.getPersonalStats(1);

      expect(result.accuracy1x2Percent).toBe(60);
      expect(result.accuracyPlenoPercent).toBe(10);
      expect(result.currentStreak).toBe(3);
      expect(result.bestStreak).toBe(7);
    });

    it('should return 0 percentages when totalPredictions is 0', async () => {
      (mockStatsModel.getPersonalStats as jest.Mock).mockResolvedValue({
        totalPredictions: 0,
        correct1x2: 0,
        correctPleno: 0,
        totalPoints: 0,
      });
      (mockStatsModel.getEvolution as jest.Mock).mockResolvedValue([]);
      (mockStatsModel.getGroupComparison as jest.Mock).mockResolvedValue([]);
      (mockStatsModel.getStreaks as jest.Mock).mockResolvedValue({ currentStreak: 0, bestStreak: 0 });

      const result = await StatsService.getPersonalStats(1);

      expect(result.accuracy1x2Percent).toBe(0);
      expect(result.accuracyPlenoPercent).toBe(0);
    });

    it('should pass seasonId to model methods', async () => {
      (mockStatsModel.getPersonalStats as jest.Mock).mockResolvedValue({
        totalPredictions: 0, correct1x2: 0, correctPleno: 0,
      });
      (mockStatsModel.getEvolution as jest.Mock).mockResolvedValue([]);
      (mockStatsModel.getGroupComparison as jest.Mock).mockResolvedValue([]);
      (mockStatsModel.getStreaks as jest.Mock).mockResolvedValue({ currentStreak: 0, bestStreak: 0 });

      await StatsService.getPersonalStats(1, 5);

      expect(mockStatsModel.getPersonalStats).toHaveBeenCalledWith(1, 5);
      expect(mockStatsModel.getEvolution).toHaveBeenCalledWith(1, 5);
      expect(mockStatsModel.getGroupComparison).toHaveBeenCalledWith(1, 5);
      expect(mockStatsModel.getStreaks).toHaveBeenCalledWith(1, 5);
    });

    it('should round percentages', async () => {
      (mockStatsModel.getPersonalStats as jest.Mock).mockResolvedValue({
        totalPredictions: 3,
        correct1x2: 1,
        correctPleno: 1,
      });
      (mockStatsModel.getEvolution as jest.Mock).mockResolvedValue([]);
      (mockStatsModel.getGroupComparison as jest.Mock).mockResolvedValue([]);
      (mockStatsModel.getStreaks as jest.Mock).mockResolvedValue({ currentStreak: 0, bestStreak: 0 });

      const result = await StatsService.getPersonalStats(1);

      expect(result.accuracy1x2Percent).toBe(33); // Math.round(1/3 * 100) = 33
      expect(result.accuracyPlenoPercent).toBe(33);
    });
  });

  describe('getGroupHistory', () => {
    it('should return paginated results', async () => {
      (mockStatsModel.getGroupHistory as jest.Mock).mockResolvedValue({
        items: [{ id: 1 }, { id: 2 }],
        total: 15,
      });

      const result = await StatsService.getGroupHistory(1, 2, 5);

      expect(result).toEqual({
        items: [{ id: 1 }, { id: 2 }],
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3,
      });
    });

    it('should calculate totalPages correctly for exact division', async () => {
      (mockStatsModel.getGroupHistory as jest.Mock).mockResolvedValue({
        items: [],
        total: 10,
      });

      const result = await StatsService.getGroupHistory(1, 1, 5);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('getJornadaDetail', () => {
    it('should delegate to StatsModel', async () => {
      (mockStatsModel.getJornadaDetail as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await StatsService.getJornadaDetail(1, 2);
      expect(result).toEqual({ id: 1 });
      expect(mockStatsModel.getJornadaDetail).toHaveBeenCalledWith(1, 2);
    });
  });

  describe('getGroupRankings', () => {
    it('should delegate to StatsModel', async () => {
      (mockStatsModel.getGroupRankings as jest.Mock).mockResolvedValue([{ userId: 1, points: 100 }]);

      const result = await StatsService.getGroupRankings(5);
      expect(result).toEqual([{ userId: 1, points: 100 }]);
    });
  });

  describe('getPredictionHistory', () => {
    it('should calculate accuracy for each item', async () => {
      (mockStatsModel.getPredictionHistory as jest.Mock).mockResolvedValue({
        items: [
          { id: 1, totalMatches: 10, correct1x2: 7 },
          { id: 2, totalMatches: 0, correct1x2: 0 },
        ],
        total: 2,
      });

      const result = await StatsService.getPredictionHistory(1, 1, 10);

      expect(result.items[0].accuracy1x2Percent).toBe(70);
      expect(result.items[1].accuracy1x2Percent).toBe(0);
    });

    it('should paginate correctly', async () => {
      (mockStatsModel.getPredictionHistory as jest.Mock).mockResolvedValue({
        items: [],
        total: 25,
      });

      const result = await StatsService.getPredictionHistory(1, 3, 10);
      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
    });
  });

  describe('getGlobalRankings', () => {
    it('should return cached data when available', async () => {
      const cachedResult = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      (mockCacheService.get as jest.Mock).mockReturnValue(cachedResult);

      const result = await StatsService.getGlobalRankings(1, 10);

      expect(result).toEqual(cachedResult);
      expect(mockStatsModel.getGlobalRankings).not.toHaveBeenCalled();
    });

    it('should fetch, transform, and cache when not cached', async () => {
      (mockCacheService.get as jest.Mock).mockReturnValue(undefined);
      (mockStatsModel.getGlobalRankings as jest.Mock).mockResolvedValue({
        items: [
          {
            group_id: 1,
            group_name: 'Group A',
            member_count: '5',
            total_points: '100',
            total_jornadas: '10',
            correct_1x2: '50',
            correct_pleno: '5',
          },
        ],
        total: 1,
      });

      const result = await StatsService.getGlobalRankings(1, 10);

      expect(result.items[0]).toEqual({
        groupId: 1,
        groupName: 'Group A',
        memberCount: 5,
        totalPoints: 100,
        totalJornadas: 10,
        correct1x2: 50,
        correctPleno: 5,
      });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ items: expect.any(Array), total: 1 })
      );
    });
  });

  describe('getExportData', () => {
    it('should return CSV formatted data with header', async () => {
      (mockStatsModel.getExportData as jest.Mock).mockResolvedValue([
        {
          jornadaName: 'Jornada 1',
          groupName: 'Group A',
          finishedAt: '2025-01-01',
          totalPoints: 15,
          correct1x2: 10,
          correctPleno: 2,
        },
      ]);

      const result = await StatsService.getExportData(1);

      expect(result).toContain('Jornada,Grupo,Fecha,Puntos,Aciertos 1X2,Plenos');
      expect(result).toContain('"Jornada 1","Group A","2025-01-01",15,10,2');
    });

    it('should handle multiple rows', async () => {
      (mockStatsModel.getExportData as jest.Mock).mockResolvedValue([
        { jornadaName: 'J1', groupName: 'G1', finishedAt: '2025-01-01', totalPoints: 10, correct1x2: 5, correctPleno: 1 },
        { jornadaName: 'J2', groupName: 'G2', finishedAt: '2025-01-02', totalPoints: 20, correct1x2: 8, correctPleno: 3 },
      ]);

      const result = await StatsService.getExportData(1);
      const lines = result.split('\n');

      expect(lines).toHaveLength(3); // header + 2 rows
    });

    it('should handle empty data', async () => {
      (mockStatsModel.getExportData as jest.Mock).mockResolvedValue([]);

      const result = await StatsService.getExportData(1);
      expect(result).toBe('Jornada,Grupo,Fecha,Puntos,Aciertos 1X2,Plenos');
    });
  });

  describe('getPredictionsHeatmap', () => {
    it('should delegate to StatsModel with default limit', async () => {
      (mockStatsModel.getPredictionsHeatmap as jest.Mock).mockResolvedValue([]);

      await StatsService.getPredictionsHeatmap(1);
      expect(mockStatsModel.getPredictionsHeatmap).toHaveBeenCalledWith(1, 10);
    });

    it('should pass custom limit', async () => {
      (mockStatsModel.getPredictionsHeatmap as jest.Mock).mockResolvedValue([]);

      await StatsService.getPredictionsHeatmap(1, 20);
      expect(mockStatsModel.getPredictionsHeatmap).toHaveBeenCalledWith(1, 20);
    });
  });
});
