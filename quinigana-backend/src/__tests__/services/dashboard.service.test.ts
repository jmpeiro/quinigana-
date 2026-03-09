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

jest.mock('../../models/dashboard.model');
jest.mock('../../services/cache.service', () => ({
  CacheService: {
    get: jest.fn(),
    set: jest.fn(),
    buildKey: jest.fn((...parts: any[]) => parts.join(':')),
  },
}));

import { DashboardService } from '../../services/dashboard.service';
import { DashboardModel } from '../../models/dashboard.model';
import { CacheService } from '../../services/cache.service';

const mockDashboardModel = DashboardModel as jest.Mocked<typeof DashboardModel>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;

describe('DashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardData', () => {
    const mockActiveJornada = { id: 1, name: 'Jornada 1' };
    const mockMyGroups = [{ id: 1, name: 'Group A' }];
    const mockLatestResults = [{ jornadaId: 1, points: 10 }];
    const mockStats = { totalPoints: 100, totalPredictions: 20 };

    it('should return cached data when available', async () => {
      const cachedData = {
        activeJornada: mockActiveJornada,
        myGroups: mockMyGroups,
        latestResults: mockLatestResults,
        stats: mockStats,
      };
      (mockCacheService.get as jest.Mock).mockReturnValue(cachedData);

      const result = await DashboardService.getDashboardData(1);

      expect(result).toEqual(cachedData);
      expect(mockDashboardModel.getActiveJornada).not.toHaveBeenCalled();
      expect(mockDashboardModel.getUserGroupsWithScores).not.toHaveBeenCalled();
      expect(mockDashboardModel.getLatestResults).not.toHaveBeenCalled();
      expect(mockDashboardModel.getUserStats).not.toHaveBeenCalled();
    });

    it('should fetch from models and cache when not cached', async () => {
      (mockCacheService.get as jest.Mock).mockReturnValue(undefined);
      (mockDashboardModel.getActiveJornada as jest.Mock).mockResolvedValue(mockActiveJornada);
      (mockDashboardModel.getUserGroupsWithScores as jest.Mock).mockResolvedValue(mockMyGroups);
      (mockDashboardModel.getLatestResults as jest.Mock).mockResolvedValue(mockLatestResults);
      (mockDashboardModel.getUserStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await DashboardService.getDashboardData(1);

      expect(result).toEqual({
        activeJornada: mockActiveJornada,
        myGroups: mockMyGroups,
        latestResults: mockLatestResults,
        stats: mockStats,
      });

      expect(mockDashboardModel.getActiveJornada).toHaveBeenCalledWith(1);
      expect(mockDashboardModel.getUserGroupsWithScores).toHaveBeenCalledWith(1);
      expect(mockDashboardModel.getLatestResults).toHaveBeenCalledWith(1, 5);
      expect(mockDashboardModel.getUserStats).toHaveBeenCalledWith(1);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          activeJornada: mockActiveJornada,
          myGroups: mockMyGroups,
          latestResults: mockLatestResults,
          stats: mockStats,
        })
      );
    });

    it('should return all 4 data fields', async () => {
      (mockCacheService.get as jest.Mock).mockReturnValue(undefined);
      (mockDashboardModel.getActiveJornada as jest.Mock).mockResolvedValue(null);
      (mockDashboardModel.getUserGroupsWithScores as jest.Mock).mockResolvedValue([]);
      (mockDashboardModel.getLatestResults as jest.Mock).mockResolvedValue([]);
      (mockDashboardModel.getUserStats as jest.Mock).mockResolvedValue({});

      const result = await DashboardService.getDashboardData(1);

      expect(result).toHaveProperty('activeJornada');
      expect(result).toHaveProperty('myGroups');
      expect(result).toHaveProperty('latestResults');
      expect(result).toHaveProperty('stats');
    });

    it('should build cache key using CacheService.buildKey', async () => {
      (mockCacheService.get as jest.Mock).mockReturnValue({ activeJornada: null, myGroups: [], latestResults: [], stats: {} });

      await DashboardService.getDashboardData(42);

      expect(mockCacheService.buildKey).toHaveBeenCalledWith(expect.anything(), 42);
    });
  });
});
