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

jest.mock('../../models/league.model');
jest.mock('../../services/notification.service');
jest.mock('../../services/cache.service', () => ({
  CacheService: {
    invalidateByPrefix: jest.fn(),
    buildKey: jest.fn((...parts: any[]) => parts.join(':')),
  },
}));

import { LeagueService } from '../../services/league.service';
import { LeagueModel } from '../../models/league.model';
import { NotificationService } from '../../services/notification.service';
import { CacheService } from '../../services/cache.service';
import { withTransaction } from '../../config/database';

const mockLeagueModel = LeagueModel as jest.Mocked<typeof LeagueModel>;
const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;
const mockWithTransaction = withTransaction as jest.Mock;

describe('LeagueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithTransaction.mockImplementation((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) }));
  });

  describe('processJornadaScores', () => {
    const userScores = [
      { userId: 1, points: 10, correct1x2: 5, correctPleno: 1 },
      { userId: 2, points: 8, correct1x2: 4, correctPleno: 0 },
    ];

    it('should return early when no active season', async () => {
      (mockLeagueModel.getActiveSeason as jest.Mock).mockResolvedValue(null);

      await LeagueService.processJornadaScores(1, userScores);

      expect(mockWithTransaction).not.toHaveBeenCalled();
    });

    it('should return early when jornada is before season start', async () => {
      (mockLeagueModel.getActiveSeason as jest.Mock).mockResolvedValue({
        id: 1,
        start_jornada_id: 5,
        end_jornada_id: 20,
      });

      await LeagueService.processJornadaScores(3, userScores);

      expect(mockWithTransaction).not.toHaveBeenCalled();
    });

    it('should return early when jornada is after season end', async () => {
      (mockLeagueModel.getActiveSeason as jest.Mock).mockResolvedValue({
        id: 1,
        start_jornada_id: 5,
        end_jornada_id: 20,
      });

      await LeagueService.processJornadaScores(25, userScores);

      expect(mockWithTransaction).not.toHaveBeenCalled();
    });

    it('should process scores within season range', async () => {
      (mockLeagueModel.getActiveSeason as jest.Mock).mockResolvedValue({
        id: 1,
        start_jornada_id: 1,
        end_jornada_id: 38,
      });
      (mockLeagueModel.ensureUserInSeason as jest.Mock).mockResolvedValue({ division_id: 1 });
      (mockLeagueModel.updateStandingPoints as jest.Mock).mockResolvedValue(undefined);
      (mockLeagueModel.recalculatePositions as jest.Mock).mockResolvedValue(undefined);

      await LeagueService.processJornadaScores(10, userScores);

      expect(mockWithTransaction).toHaveBeenCalled();
      expect(mockLeagueModel.ensureUserInSeason).toHaveBeenCalledTimes(2);
      expect(mockLeagueModel.updateStandingPoints).toHaveBeenCalledTimes(2);
      expect(mockLeagueModel.updateStandingPoints).toHaveBeenCalledWith(1, 1, 10, 5, 1);
      expect(mockLeagueModel.updateStandingPoints).toHaveBeenCalledWith(2, 1, 8, 4, 0);
    });

    it('should recalculate positions for affected divisions', async () => {
      (mockLeagueModel.getActiveSeason as jest.Mock).mockResolvedValue({
        id: 1,
        start_jornada_id: 1,
        end_jornada_id: 38,
      });
      (mockLeagueModel.ensureUserInSeason as jest.Mock)
        .mockResolvedValueOnce({ division_id: 1 })
        .mockResolvedValueOnce({ division_id: 2 });
      (mockLeagueModel.updateStandingPoints as jest.Mock).mockResolvedValue(undefined);
      (mockLeagueModel.recalculatePositions as jest.Mock).mockResolvedValue(undefined);

      await LeagueService.processJornadaScores(10, userScores);

      expect(mockLeagueModel.recalculatePositions).toHaveBeenCalledWith(1, 1);
      expect(mockLeagueModel.recalculatePositions).toHaveBeenCalledWith(1, 2);
    });

    it('should invalidate league standings cache', async () => {
      (mockLeagueModel.getActiveSeason as jest.Mock).mockResolvedValue({
        id: 1,
        start_jornada_id: 1,
        end_jornada_id: 38,
      });
      (mockLeagueModel.ensureUserInSeason as jest.Mock).mockResolvedValue({ division_id: 1 });
      (mockLeagueModel.updateStandingPoints as jest.Mock).mockResolvedValue(undefined);
      (mockLeagueModel.recalculatePositions as jest.Mock).mockResolvedValue(undefined);

      await LeagueService.processJornadaScores(10, userScores);

      expect(mockCacheService.invalidateByPrefix).toHaveBeenCalledWith('league_standings');
    });

    it('should handle season with no start/end jornada bounds', async () => {
      (mockLeagueModel.getActiveSeason as jest.Mock).mockResolvedValue({
        id: 1,
        start_jornada_id: null,
        end_jornada_id: null,
      });
      (mockLeagueModel.ensureUserInSeason as jest.Mock).mockResolvedValue({ division_id: 1 });
      (mockLeagueModel.updateStandingPoints as jest.Mock).mockResolvedValue(undefined);
      (mockLeagueModel.recalculatePositions as jest.Mock).mockResolvedValue(undefined);

      await LeagueService.processJornadaScores(10, userScores);

      expect(mockWithTransaction).toHaveBeenCalled();
    });
  });

  describe('processSeasonEnd', () => {
    it('should process promotions and mark season completed', async () => {
      (mockLeagueModel.processSeasonEnd as jest.Mock).mockResolvedValue(undefined);
      (mockLeagueModel.updateSeasonStatus as jest.Mock).mockResolvedValue(undefined);

      await LeagueService.processSeasonEnd(1);

      expect(mockWithTransaction).toHaveBeenCalled();
      expect(mockLeagueModel.processSeasonEnd).toHaveBeenCalledWith(1);
      expect(mockLeagueModel.updateSeasonStatus).toHaveBeenCalledWith(1, 'completed');
    });

    it('should invalidate league standings cache', async () => {
      (mockLeagueModel.processSeasonEnd as jest.Mock).mockResolvedValue(undefined);
      (mockLeagueModel.updateSeasonStatus as jest.Mock).mockResolvedValue(undefined);

      await LeagueService.processSeasonEnd(1);

      expect(mockCacheService.invalidateByPrefix).toHaveBeenCalledWith('league_standings');
    });
  });

  describe('checkAndNotifyZoneChanges', () => {
    it('should return early when no profile found', async () => {
      (mockLeagueModel.getUserLeagueProfile as jest.Mock).mockResolvedValue(null);

      await LeagueService.checkAndNotifyZoneChanges(1);

      expect(mockNotificationService.notify).not.toHaveBeenCalled();
    });

    it('should return early when previous_position is null', async () => {
      (mockLeagueModel.getUserLeagueProfile as jest.Mock).mockResolvedValue({
        previous_position: null,
      });

      await LeagueService.checkAndNotifyZoneChanges(1);

      expect(mockNotificationService.notify).not.toHaveBeenCalled();
    });

    it('should notify when user enters promotion zone', async () => {
      (mockLeagueModel.getUserLeagueProfile as jest.Mock).mockResolvedValue({
        previous_position: 5,
        promotion_status: 'promoted',
        is_promotion_zone: true,
        is_relegation_zone: false,
        total_in_division: 20,
        division_name: 'Division 1',
      });
      (mockNotificationService.notify as jest.Mock).mockResolvedValue(undefined);

      await LeagueService.checkAndNotifyZoneChanges(1);

      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        1,
        'league_update',
        'Zona de ascenso!',
        expect.stringContaining('Division 1'),
        '/leagues'
      );
    });

    it('should notify when user enters relegation zone', async () => {
      (mockLeagueModel.getUserLeagueProfile as jest.Mock).mockResolvedValue({
        previous_position: 10,
        promotion_status: 'relegated',
        is_promotion_zone: false,
        is_relegation_zone: true,
        total_in_division: 20,
        division_name: 'Division 2',
      });
      (mockNotificationService.notify as jest.Mock).mockResolvedValue(undefined);

      await LeagueService.checkAndNotifyZoneChanges(1);

      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        1,
        'league_update',
        'Zona de descenso',
        expect.stringContaining('Division 2'),
        '/leagues'
      );
    });

    it('should not notify when not in any zone', async () => {
      (mockLeagueModel.getUserLeagueProfile as jest.Mock).mockResolvedValue({
        previous_position: 10,
        promotion_status: null,
        is_promotion_zone: false,
        is_relegation_zone: false,
        total_in_division: 20,
        division_name: 'Division 1',
      });

      await LeagueService.checkAndNotifyZoneChanges(1);

      expect(mockNotificationService.notify).not.toHaveBeenCalled();
    });
  });
});
