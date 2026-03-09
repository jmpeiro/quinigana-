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

jest.mock('../../models/season.model');

import { SeasonService } from '../../services/season.service';
import { SeasonModel } from '../../models/season.model';

const mockSeasonModel = SeasonModel as jest.Mocked<typeof SeasonModel>;

describe('SeasonService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should delegate to SeasonModel.getAll', async () => {
      const seasons = [{ id: 1, name: 'Season 1' }];
      (mockSeasonModel.getAll as jest.Mock).mockResolvedValue(seasons);

      const result = await SeasonService.getAll();
      expect(result).toEqual(seasons);
    });
  });

  describe('getById', () => {
    it('should delegate to SeasonModel.getById', async () => {
      (mockSeasonModel.getById as jest.Mock).mockResolvedValue({ id: 1, name: 'Season 1' });

      const result = await SeasonService.getById(1);
      expect(result).toEqual({ id: 1, name: 'Season 1' });
    });

    it('should return null when not found', async () => {
      (mockSeasonModel.getById as jest.Mock).mockResolvedValue(null);

      const result = await SeasonService.getById(999);
      expect(result).toBeNull();
    });
  });

  describe('getCurrent', () => {
    it('should delegate to SeasonModel.getCurrent', async () => {
      (mockSeasonModel.getCurrent as jest.Mock).mockResolvedValue({ id: 1, is_current: true });

      const result = await SeasonService.getCurrent();
      expect(result).toEqual({ id: 1, is_current: true });
    });
  });

  describe('create', () => {
    it('should create season when data is valid', async () => {
      (mockSeasonModel.getByName as jest.Mock).mockResolvedValue(null);
      (mockSeasonModel.create as jest.Mock).mockResolvedValue(1);

      const data = { name: 'Season 2025', start_date: '2025-01-01', end_date: '2025-06-30' };
      const result = await SeasonService.create(data as any);

      expect(result).toBe(1);
      expect(mockSeasonModel.create).toHaveBeenCalledWith(data);
    });

    it('should throw INVALID_DATES when end date is before start date', async () => {
      const data = { name: 'Season', start_date: '2025-06-30', end_date: '2025-01-01' };

      try {
        await SeasonService.create(data as any);
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.code).toBe('INVALID_DATES');
        expect(err.statusCode).toBe(400);
      }
    });

    it('should throw INVALID_DATES when end date equals start date', async () => {
      const data = { name: 'Season', start_date: '2025-01-01', end_date: '2025-01-01' };

      try {
        await SeasonService.create(data as any);
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.code).toBe('INVALID_DATES');
      }
    });

    it('should throw SEASON_EXISTS when name already exists', async () => {
      (mockSeasonModel.getByName as jest.Mock).mockResolvedValue({ id: 1, name: 'Existing' });

      const data = { name: 'Existing', start_date: '2025-01-01', end_date: '2025-06-30' };

      try {
        await SeasonService.create(data as any);
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.code).toBe('SEASON_EXISTS');
        expect(err.statusCode).toBe(400);
      }
    });
  });

  describe('update', () => {
    it('should update when season exists and data is valid', async () => {
      (mockSeasonModel.getById as jest.Mock).mockResolvedValue({ id: 1, name: 'Season 1' });
      (mockSeasonModel.getByName as jest.Mock).mockResolvedValue(null);
      (mockSeasonModel.update as jest.Mock).mockResolvedValue(true);

      const result = await SeasonService.update(1, {
        name: 'Updated Season',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      } as any);

      expect(result).toBe(true);
    });

    it('should throw SEASON_NOT_FOUND when season does not exist', async () => {
      (mockSeasonModel.getById as jest.Mock).mockResolvedValue(null);

      try {
        await SeasonService.update(999, { name: 'Update' } as any);
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.code).toBe('SEASON_NOT_FOUND');
        expect(err.statusCode).toBe(404);
      }
    });

    it('should throw INVALID_DATES when updated dates are invalid', async () => {
      (mockSeasonModel.getById as jest.Mock).mockResolvedValue({ id: 1, name: 'Season' });

      try {
        await SeasonService.update(1, {
          start_date: '2025-12-31',
          end_date: '2025-01-01',
        } as any);
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.code).toBe('INVALID_DATES');
      }
    });

    it('should throw SEASON_EXISTS when new name conflicts', async () => {
      (mockSeasonModel.getById as jest.Mock).mockResolvedValue({ id: 1, name: 'Season 1' });
      (mockSeasonModel.getByName as jest.Mock).mockResolvedValue({ id: 2, name: 'Existing' });

      try {
        await SeasonService.update(1, { name: 'Existing' } as any);
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.code).toBe('SEASON_EXISTS');
      }
    });

    it('should not check name uniqueness when name is unchanged', async () => {
      (mockSeasonModel.getById as jest.Mock).mockResolvedValue({ id: 1, name: 'Same Name' });
      (mockSeasonModel.update as jest.Mock).mockResolvedValue(true);

      await SeasonService.update(1, { name: 'Same Name' } as any);

      expect(mockSeasonModel.getByName).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete when season exists', async () => {
      (mockSeasonModel.getById as jest.Mock).mockResolvedValue({ id: 1 });
      (mockSeasonModel.delete as jest.Mock).mockResolvedValue(true);

      const result = await SeasonService.delete(1);
      expect(result).toBe(true);
    });

    it('should throw SEASON_NOT_FOUND when season does not exist', async () => {
      (mockSeasonModel.getById as jest.Mock).mockResolvedValue(null);

      try {
        await SeasonService.delete(999);
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.code).toBe('SEASON_NOT_FOUND');
        expect(err.statusCode).toBe(404);
      }
    });
  });

  describe('setAsCurrent', () => {
    it('should set season as current when it exists', async () => {
      (mockSeasonModel.getById as jest.Mock).mockResolvedValue({ id: 1 });
      (mockSeasonModel.setAsCurrent as jest.Mock).mockResolvedValue(true);

      const result = await SeasonService.setAsCurrent(1);
      expect(result).toBe(true);
      expect(mockSeasonModel.setAsCurrent).toHaveBeenCalledWith(1);
    });

    it('should throw SEASON_NOT_FOUND when season does not exist', async () => {
      (mockSeasonModel.getById as jest.Mock).mockResolvedValue(null);

      try {
        await SeasonService.setAsCurrent(999);
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.code).toBe('SEASON_NOT_FOUND');
      }
    });
  });

  describe('getSeasonStats', () => {
    it('should return stats when season exists', async () => {
      (mockSeasonModel.getById as jest.Mock).mockResolvedValue({ id: 1 });
      (mockSeasonModel.getSeasonStats as jest.Mock).mockResolvedValue({
        totalJornadas: 10,
        totalParticipants: 50,
      });

      const result = await SeasonService.getSeasonStats(1);
      expect(result).toEqual({ totalJornadas: 10, totalParticipants: 50 });
    });

    it('should throw SEASON_NOT_FOUND when season does not exist', async () => {
      (mockSeasonModel.getById as jest.Mock).mockResolvedValue(null);

      try {
        await SeasonService.getSeasonStats(999);
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.code).toBe('SEASON_NOT_FOUND');
      }
    });
  });
});
