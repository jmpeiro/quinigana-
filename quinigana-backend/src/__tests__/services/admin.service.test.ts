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

jest.mock('../../models/admin.model');

import { AdminService } from '../../services/admin.service';
import { AdminModel } from '../../models/admin.model';

const mockAdminModel = AdminModel as jest.Mocked<typeof AdminModel>;

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      (mockAdminModel.getAllUsers as jest.Mock).mockResolvedValue({
        users: [{ id: 1, email: 'a@b.com' }, { id: 2, email: 'c@d.com' }],
        total: 20,
      });

      const result = await AdminService.getUsers(1, 10);

      expect(result).toEqual({
        items: [{ id: 1, email: 'a@b.com' }, { id: 2, email: 'c@d.com' }],
        total: 20,
        page: 1,
        limit: 10,
        totalPages: 2,
      });

      expect(mockAdminModel.getAllUsers).toHaveBeenCalledWith(1, 10, undefined);
    });

    it('should pass search parameter', async () => {
      (mockAdminModel.getAllUsers as jest.Mock).mockResolvedValue({
        users: [],
        total: 0,
      });

      await AdminService.getUsers(1, 10, 'john');

      expect(mockAdminModel.getAllUsers).toHaveBeenCalledWith(1, 10, 'john');
    });

    it('should calculate totalPages correctly', async () => {
      (mockAdminModel.getAllUsers as jest.Mock).mockResolvedValue({
        users: [],
        total: 25,
      });

      const result = await AdminService.getUsers(1, 10);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('toggleAdmin', () => {
    it('should delegate to AdminModel.toggleAdmin', async () => {
      (mockAdminModel.toggleAdmin as jest.Mock).mockResolvedValue(true);

      const result = await AdminService.toggleAdmin(1);
      expect(result).toBe(true);
      expect(mockAdminModel.toggleAdmin).toHaveBeenCalledWith(1);
    });
  });

  describe('toggleUserActive', () => {
    it('should delegate to AdminModel.toggleUserActive', async () => {
      (mockAdminModel.toggleUserActive as jest.Mock).mockResolvedValue(true);

      const result = await AdminService.toggleUserActive(1);
      expect(result).toBe(true);
      expect(mockAdminModel.toggleUserActive).toHaveBeenCalledWith(1);
    });
  });

  describe('getGlobalStats', () => {
    it('should return global stats from model', async () => {
      const stats = {
        totalUsers: 100,
        totalGroups: 20,
        totalJornadas: 10,
        totalPredictions: 5000,
      };
      (mockAdminModel.getGlobalStats as jest.Mock).mockResolvedValue(stats);

      const result = await AdminService.getGlobalStats();
      expect(result).toEqual(stats);
    });
  });

  describe('getAllGroups', () => {
    it('should return paginated groups', async () => {
      (mockAdminModel.getAllGroups as jest.Mock).mockResolvedValue({
        groups: [{ id: 1, name: 'Group A' }],
        total: 5,
      });

      const result = await AdminService.getAllGroups(1, 10);

      expect(result).toEqual({
        items: [{ id: 1, name: 'Group A' }],
        total: 5,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should pass search parameter', async () => {
      (mockAdminModel.getAllGroups as jest.Mock).mockResolvedValue({
        groups: [],
        total: 0,
      });

      await AdminService.getAllGroups(1, 10, 'group');

      expect(mockAdminModel.getAllGroups).toHaveBeenCalledWith(1, 10, 'group');
    });
  });

  describe('deactivateGroup', () => {
    it('should delegate to AdminModel.deactivateGroup', async () => {
      (mockAdminModel.deactivateGroup as jest.Mock).mockResolvedValue(undefined);

      await AdminService.deactivateGroup(5);
      expect(mockAdminModel.deactivateGroup).toHaveBeenCalledWith(5);
    });
  });

  describe('updateMatch', () => {
    it('should delegate to AdminModel.updateMatch', async () => {
      (mockAdminModel.updateMatch as jest.Mock).mockResolvedValue(undefined);

      const data = { home_team: 'Real Madrid', away_team: 'Barcelona' };
      await AdminService.updateMatch(1, data);

      expect(mockAdminModel.updateMatch).toHaveBeenCalledWith(1, data);
    });

    it('should pass match_date when provided', async () => {
      (mockAdminModel.updateMatch as jest.Mock).mockResolvedValue(undefined);

      const data = { match_date: '2025-03-15' };
      await AdminService.updateMatch(1, data);

      expect(mockAdminModel.updateMatch).toHaveBeenCalledWith(1, { match_date: '2025-03-15' });
    });
  });

  describe('reopenJornada', () => {
    it('should delegate to AdminModel.reopenJornada', async () => {
      (mockAdminModel.reopenJornada as jest.Mock).mockResolvedValue(undefined);

      await AdminService.reopenJornada(10);
      expect(mockAdminModel.reopenJornada).toHaveBeenCalledWith(10);
    });
  });
});
