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
jest.mock('../../models/jornada.model');
jest.mock('../../models/match.model');
jest.mock('../../models/user.model');
jest.mock('../../models/proposal.model');
jest.mock('../../services/notification.service');
jest.mock('../../services/scraper-fallback.service');
jest.mock('../../services/cache.service', () => ({
  CacheService: {
    get: jest.fn(),
    set: jest.fn(),
    buildKey: jest.fn((...args: any[]) => args.join(':')),
    invalidateByPrefix: jest.fn(),
    invalidateScoresAndStandings: jest.fn(),
  },
}));
jest.mock('../../config/cache', () => ({
  CacheKey: {
    STANDINGS: 'standings',
    RANKINGS: 'rankings',
    DASHBOARD: 'dashboard',
    JORNADA_LIST: 'jornada_list',
    LEAGUE_STANDINGS: 'league_standings',
  },
}));
jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { JornadaService } from '../../services/jornada.service';
import { JornadaModel } from '../../models/jornada.model';
import { MatchModel } from '../../models/match.model';
import { UserModel } from '../../models/user.model';
import { ProposalModel } from '../../models/proposal.model';
import { NotificationService } from '../../services/notification.service';
import { ScraperFallbackService } from '../../services/scraper-fallback.service';
import { CacheService } from '../../services/cache.service';

beforeEach(() => {
  jest.clearAllMocks();
  // Default: getAllActiveUserIds returns empty to avoid unhandled promises
  (UserModel.getAllActiveUserIds as jest.Mock).mockResolvedValue([]);
  (NotificationService.notifyNewJornada as jest.Mock).mockResolvedValue(undefined);
  (NotificationService.notifyResultsPublished as jest.Mock).mockResolvedValue(undefined);
});

// ── Test data ────────────────────────────────────────────────────────────────

const sampleJornada = {
  id: 1, name: 'Jornada 1', season: '2025-26', jornada_number: 1,
  status: 'open', deadline: new Date('2099-12-31'),
  matches: [
    { id: 10, match_number: 1, home_team: 'Real Madrid', away_team: 'Barcelona', result: null },
    { id: 11, match_number: 2, home_team: 'Sevilla', away_team: 'Valencia', result: null },
  ],
};

const createDto = {
  name: 'Jornada 1', season: '2025-26', jornada_number: 1, deadline: '2099-12-31',
  matches: [
    { match_number: 1, home_team: 'Real Madrid', away_team: 'Barcelona' },
    { match_number: 2, home_team: 'Sevilla', away_team: 'Valencia' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

describe('JornadaService', () => {
  // ── createJornada ──────────────────────────────────────────────────────

  describe('createJornada', () => {
    it('creates jornada and matches, invalidates cache, sends notifications', async () => {
      (JornadaModel.create as jest.Mock).mockResolvedValue(1);
      (MatchModel.createMany as jest.Mock).mockResolvedValue(undefined);
      (JornadaModel.findByIdWithMatches as jest.Mock).mockResolvedValue(sampleJornada);

      const result = await JornadaService.createJornada(createDto);

      expect(JornadaModel.create).toHaveBeenCalledWith('Jornada 1', '2025-26', 1, '2099-12-31');
      expect(MatchModel.createMany).toHaveBeenCalledWith(1, createDto.matches);
      expect(CacheService.invalidateByPrefix).toHaveBeenCalledWith('jornada_list');
      expect(result).toEqual(sampleJornada);
    });
  });

  // ── getAll ─────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('delegates to JornadaModel.findAll', async () => {
      const jornadas = [sampleJornada];
      (JornadaModel.findAll as jest.Mock).mockResolvedValue(jornadas);

      const result = await JornadaService.getAll();
      expect(JornadaModel.findAll).toHaveBeenCalled();
      expect(result).toEqual(jornadas);
    });
  });

  // ── getAllForUser ──────────────────────────────────────────────────────

  describe('getAllForUser', () => {
    it('returns cached data when available', async () => {
      const cached = { items: [sampleJornada], total: 1, page: 1, limit: 20, totalPages: 1 };
      (CacheService.get as jest.Mock).mockReturnValue(cached);

      const result = await JornadaService.getAllForUser(1, 1, 20);
      expect(result).toEqual(cached);
      expect(JornadaModel.findForUser).not.toHaveBeenCalled();
    });

    it('fetches and caches when not cached', async () => {
      (CacheService.get as jest.Mock).mockReturnValue(undefined);
      (JornadaModel.findForUser as jest.Mock).mockResolvedValue({ items: [sampleJornada], total: 1 });

      const result = await JornadaService.getAllForUser(1, 1, 20);
      expect(JornadaModel.findForUser).toHaveBeenCalledWith(1, 1, 20);
      expect(CacheService.set).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.totalPages).toBe(1);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('delegates to JornadaModel.findByIdWithMatches', async () => {
      (JornadaModel.findByIdWithMatches as jest.Mock).mockResolvedValue(sampleJornada);

      const result = await JornadaService.getById(1);
      expect(JornadaModel.findByIdWithMatches).toHaveBeenCalledWith(1);
      expect(result).toEqual(sampleJornada);
    });
  });

  // ── getActive ──────────────────────────────────────────────────────────

  describe('getActive', () => {
    it('returns cached data when available', async () => {
      (CacheService.get as jest.Mock).mockReturnValue(sampleJornada);

      const result = await JornadaService.getActive();
      expect(result).toEqual(sampleJornada);
      expect(JornadaModel.findActive).not.toHaveBeenCalled();
    });

    it('fetches and caches with 120s TTL when not cached', async () => {
      (CacheService.get as jest.Mock).mockReturnValue(undefined);
      (JornadaModel.findActive as jest.Mock).mockResolvedValue(sampleJornada);

      const result = await JornadaService.getActive();
      expect(JornadaModel.findActive).toHaveBeenCalled();
      expect(CacheService.set).toHaveBeenCalledWith(expect.any(String), sampleJornada, 120);
      expect(result).toEqual(sampleJornada);
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('updates status successfully', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(sampleJornada);
      (JornadaModel.updateStatus as jest.Mock).mockResolvedValue(undefined);

      await JornadaService.updateStatus(1, 'closed');
      expect(JornadaModel.updateStatus).toHaveBeenCalledWith(1, 'closed');
      expect(CacheService.invalidateScoresAndStandings).toHaveBeenCalled();
    });

    it('throws when jornada not found', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(JornadaService.updateStatus(1, 'closed')).rejects.toThrow('Jornada not found');
    });
  });

  // ── getLiveScores ─────────────────────────────────────────────────────

  describe('getLiveScores', () => {
    it('returns live data from scraper', async () => {
      const jornadaWithMatches = {
        ...sampleJornada,
        matches: [
          { match_number: 1, home_team: 'Real Madrid', away_team: 'Barcelona', result: null },
        ],
      };
      (JornadaModel.findByIdWithMatches as jest.Mock).mockResolvedValue(jornadaWithMatches);

      const liveMap = new Map([['real madrid', { home_score: 2, away_score: 1, status: 'FINISHED' }]]);
      (ScraperFallbackService.getLiveScores as jest.Mock).mockResolvedValue({
        source: 'football-data-api', matches: liveMap, fetchedAt: new Date().toISOString(), reliable: true,
      });

      const result = await JornadaService.getLiveScores(1);
      expect(result[0].home_score).toBe(2);
      expect(result[0].away_score).toBe(1);
      expect(result[0].sign).toBe('1');
    });

    it('falls back to DB results when scraper fails', async () => {
      const jornadaWithMatches = {
        ...sampleJornada,
        matches: [
          { match_number: 1, home_team: 'Real Madrid', away_team: 'Barcelona', result: { home_score: 3, away_score: 0 } },
        ],
      };
      (JornadaModel.findByIdWithMatches as jest.Mock).mockResolvedValue(jornadaWithMatches);
      (ScraperFallbackService.getLiveScores as jest.Mock).mockRejectedValue(new Error('All failed'));

      const result = await JornadaService.getLiveScores(1);
      expect(result[0].home_score).toBe(3);
      expect(result[0].away_score).toBe(0);
      expect(result[0].status).toBe('FINISHED');
    });

    it('throws when jornada not found', async () => {
      (JornadaModel.findByIdWithMatches as jest.Mock).mockResolvedValue(null);

      await expect(JornadaService.getLiveScores(999)).rejects.toThrow('Jornada not found');
    });
  });

  // ── getUserPredictions ────────────────────────────────────────────────

  describe('getUserPredictions', () => {
    it('returns predictions successfully', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(sampleJornada);
      const predictions = [{ match_id: 10, prediction_1x2: '1' }];
      (ProposalModel.getUserPredictionsForJornada as jest.Mock).mockResolvedValue(predictions);

      const result = await JornadaService.getUserPredictions(1, 5);
      expect(ProposalModel.getUserPredictionsForJornada).toHaveBeenCalledWith(5, 1);
      expect(result).toEqual(predictions);
    });

    it('throws when jornada not found', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(JornadaService.getUserPredictions(999, 5)).rejects.toThrow('Jornada not found');
    });
  });

  // ── submitResults ─────────────────────────────────────────────────────

  describe('submitResults', () => {
    it('submits results successfully', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(sampleJornada);
      (MatchModel.findByJornada as jest.Mock).mockResolvedValue([{ id: 10 }, { id: 11 }]);
      (MatchModel.addResult as jest.Mock).mockResolvedValue(undefined);
      (JornadaModel.findByIdWithMatches as jest.Mock).mockResolvedValue(sampleJornada);

      const data = { results: [{ match_id: 10, home_score: 2, away_score: 1 }] };
      const result = await JornadaService.submitResults(1, data);

      expect(MatchModel.addResult).toHaveBeenCalledWith(10, 2, 1);
      expect(CacheService.invalidateScoresAndStandings).toHaveBeenCalled();
      expect(result).toEqual(sampleJornada);
    });

    it('throws when jornada not found', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(JornadaService.submitResults(999, { results: [] })).rejects.toThrow('Jornada not found');
    });

    it('throws when match id does not belong to jornada', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(sampleJornada);
      (MatchModel.findByJornada as jest.Mock).mockResolvedValue([{ id: 10 }, { id: 11 }]);

      const data = { results: [{ match_id: 999, home_score: 1, away_score: 0 }] };
      await expect(JornadaService.submitResults(1, data)).rejects.toThrow('Match 999 does not belong to this jornada');
    });
  });
});
