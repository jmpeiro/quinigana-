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
jest.mock('../../services/dashboard.service');
jest.mock('../../services/football-data.service');
jest.mock('../../utils/response.util');

import { DashboardService } from '../../services/dashboard.service';
import { FootballDataService } from '../../services/football-data.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { DashboardController } from '../../controllers/dashboard.controller';

function mockRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}
function mockReq(overrides: any = {}): any {
  return { body: {}, params: {}, query: {}, cookies: {}, authUser: { userId: 1, email: 'test@test.com' }, ...overrides };
}

describe('DashboardController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return dashboard data successfully', async () => {
      const dashData = { stats: { totalPredictions: 10 }, groups: [] };
      (DashboardService.getDashboardData as jest.Mock).mockResolvedValue(dashData);

      const req = mockReq();
      const res = mockRes();
      await DashboardController.getDashboard(req, res);

      expect(DashboardService.getDashboardData).toHaveBeenCalledWith(1);
      expect(sendSuccess).toHaveBeenCalledWith(res, dashData);
    });

    it('should return 500 on error', async () => {
      (DashboardService.getDashboardData as jest.Mock).mockRejectedValue(new Error('DB fail'));

      const req = mockReq();
      const res = mockRes();
      await DashboardController.getDashboard(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'INTERNAL_ERROR', 'Failed to load dashboard', 500);
    });
  });

  describe('getStandings', () => {
    it('should return standings for primera by default', async () => {
      const standings = [{ team: 'Real Madrid', points: 75 }];
      (FootballDataService.getStandings as jest.Mock).mockResolvedValue(standings);

      const req = mockReq({ query: {} });
      const res = mockRes();
      await DashboardController.getStandings(req, res);

      expect(FootballDataService.getStandings).toHaveBeenCalledWith('PD');
      expect(sendSuccess).toHaveBeenCalledWith(res, standings);
    });

    it('should return standings for segunda when requested', async () => {
      const standings = [{ team: 'Team B', points: 50 }];
      (FootballDataService.getStandings as jest.Mock).mockResolvedValue(standings);

      const req = mockReq({ query: { division: 'segunda' } });
      const res = mockRes();
      await DashboardController.getStandings(req, res);

      expect(FootballDataService.getStandings).toHaveBeenCalledWith('SD');
      expect(sendSuccess).toHaveBeenCalledWith(res, standings);
    });

    it('should return 500 on error', async () => {
      (FootballDataService.getStandings as jest.Mock).mockRejectedValue(new Error('API fail'));

      const req = mockReq({ query: {} });
      const res = mockRes();
      await DashboardController.getStandings(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'INTERNAL_ERROR', 'Failed to load standings', 500);
    });
  });
});
