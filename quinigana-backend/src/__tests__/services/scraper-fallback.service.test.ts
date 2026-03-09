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
jest.mock('../../services/football-data.service');
jest.mock('../../services/quiniela-scraper.service');
jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), fatal: jest.fn() },
}));

import { ScraperFallbackService, setSocketInstance, ScraperResult } from '../../services/scraper-fallback.service';
import { FootballDataService } from '../../services/football-data.service';
import { QuinielaScraper } from '../../services/quiniela-scraper.service';
import pool from '../../config/database';
import logger from '../../config/logger';

// Make sleep resolve immediately to speed up tests
beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(ScraperFallbackService as any, 'sleep').mockResolvedValue(undefined);
  (pool.execute as jest.Mock).mockResolvedValue([[], []]);

  // Reset health cache
  (ScraperFallbackService as any).healthCache = {
    footballDataApi: { available: true, lastCheck: null },
    resultadosFutbol: { available: true, lastCheck: null },
  };
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  setSocketInstance(null);
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePrimaryResult(entries: [string, number, number, string][] = []): ScraperResult {
  const matches = new Map<string, { home_score: number; away_score: number; status: string }>();
  for (const [team, hs, as_, st] of entries) {
    matches.set(team, { home_score: hs, away_score: as_, status: st });
  }
  return { source: 'football-data-api', matches, fetchedAt: new Date().toISOString(), reliable: true };
}

function makeFallbackResult(entries: [string, number, number, string][] = []): ScraperResult {
  const matches = new Map<string, { home_score: number; away_score: number; status: string }>();
  for (const [team, hs, as_, st] of entries) {
    matches.set(team, { home_score: hs, away_score: as_, status: st });
  }
  return { source: 'resultados-futbol', matches, fetchedAt: new Date().toISOString(), reliable: true };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('ScraperFallbackService', () => {
  // ── getLiveScores ────────────────────────────────────────────────────────

  describe('getLiveScores', () => {
    it('returns primary result when primary succeeds', async () => {
      const primary = makePrimaryResult([['real madrid', 2, 1, 'FINISHED']]);
      jest.spyOn(ScraperFallbackService as any, 'fetchFromFootballDataApi').mockResolvedValue(primary);
      jest.spyOn(ScraperFallbackService as any, 'fetchFromResultadosFutbol').mockResolvedValue(
        makeFallbackResult([['real madrid', 2, 1, 'FINISHED']]),
      );

      const result = await ScraperFallbackService.getLiveScores(1, 'PD', 10);
      expect(result.source).toBe('football-data-api');
      expect(result.matches.get('real madrid')).toEqual({ home_score: 2, away_score: 1, status: 'FINISHED' });
    });

    it('returns fallback result when primary fails', async () => {
      jest.spyOn(ScraperFallbackService as any, 'fetchFromFootballDataApi').mockRejectedValue(new Error('API down'));
      const fallback = makeFallbackResult([['barcelona', 3, 0, 'FINISHED']]);
      jest.spyOn(ScraperFallbackService as any, 'fetchFromResultadosFutbol').mockResolvedValue(fallback);

      const result = await ScraperFallbackService.getLiveScores(1);
      expect(result.source).toBe('resultados-futbol');
    });

    it('cross-validates and logs discrepancies when both succeed', async () => {
      const primary = makePrimaryResult([['sevilla', 1, 0, 'FINISHED']]);
      const fallback = makeFallbackResult([['sevilla', 2, 0, 'FINISHED']]);
      jest.spyOn(ScraperFallbackService as any, 'fetchFromFootballDataApi').mockResolvedValue(primary);
      jest.spyOn(ScraperFallbackService as any, 'fetchFromResultadosFutbol').mockResolvedValue(fallback);

      const result = await ScraperFallbackService.getLiveScores(1);
      expect(result.source).toBe('football-data-api');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ discrepancies: expect.any(Array) }),
        expect.stringContaining('Score discrepancies detected'),
      );
    });

    it('throws and emits socket error when both fail', async () => {
      jest.spyOn(ScraperFallbackService as any, 'fetchFromFootballDataApi').mockRejectedValue(new Error('API down'));
      jest.spyOn(ScraperFallbackService as any, 'fetchFromResultadosFutbol').mockRejectedValue(new Error('Scraper down'));

      const mockEmit = jest.fn();
      const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
      setSocketInstance({ to: mockTo });

      await expect(ScraperFallbackService.getLiveScores(1)).rejects.toThrow('All scraper sources failed');
      expect(mockTo).toHaveBeenCalledWith('admin');
      expect(mockEmit).toHaveBeenCalledWith('scraper:error', expect.objectContaining({ jornadaId: 1 }));
    });
  });

  // ── getHealthStatus ─────────────────────────────────────────────────────

  describe('getHealthStatus', () => {
    it('returns cached health status', () => {
      (ScraperFallbackService as any).healthCache = {
        footballDataApi: { available: true, lastCheck: '2025-01-01T00:00:00Z' },
        resultadosFutbol: { available: false, lastCheck: '2025-01-01T00:00:00Z', error: 'timeout' },
      };

      const status = ScraperFallbackService.getHealthStatus();
      expect(status.footballDataApi.available).toBe(true);
      expect(status.resultadosFutbol.available).toBe(false);
      expect(status.resultadosFutbol.error).toBe('timeout');
    });
  });

  // ── checkHealth ─────────────────────────────────────────────────────────

  describe('checkHealth', () => {
    it('reports both healthy when probes succeed', async () => {
      (FootballDataService.getCompetitions as jest.Mock).mockResolvedValue([]);
      (QuinielaScraper.getQuinielaMatches as jest.Mock).mockResolvedValue([]);

      const status = await ScraperFallbackService.checkHealth();
      expect(status.footballDataApi.available).toBe(true);
      expect(status.resultadosFutbol.available).toBe(true);
    });

    it('reports football-data unavailable when probe fails', async () => {
      (FootballDataService.getCompetitions as jest.Mock).mockRejectedValue(new Error('403'));
      (QuinielaScraper.getQuinielaMatches as jest.Mock).mockResolvedValue([]);

      const status = await ScraperFallbackService.checkHealth();
      expect(status.footballDataApi.available).toBe(false);
      expect(status.footballDataApi.error).toBe('403');
      expect(status.resultadosFutbol.available).toBe(true);
    });

    it('reports resultados-futbol unavailable when probe fails', async () => {
      (FootballDataService.getCompetitions as jest.Mock).mockResolvedValue([]);
      (QuinielaScraper.getQuinielaMatches as jest.Mock).mockRejectedValue(new Error('timeout'));

      const status = await ScraperFallbackService.checkHealth();
      expect(status.footballDataApi.available).toBe(true);
      expect(status.resultadosFutbol.available).toBe(false);
      expect(status.resultadosFutbol.error).toBe('timeout');
    });
  });

  // ── Retry logic ─────────────────────────────────────────────────────────

  describe('withRetry', () => {
    it('succeeds on first try without retrying', async () => {
      const fn = jest.fn().mockResolvedValue('ok');

      const result = await (ScraperFallbackService as any).withRetry(fn, 'test-source');
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('fails then succeeds on retry', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail-1'))
        .mockResolvedValue('ok');

      const result = await (ScraperFallbackService as any).withRetry(fn, 'test-source');
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('fails all 3 attempts and throws last error', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail-1'))
        .mockRejectedValueOnce(new Error('fail-2'))
        .mockRejectedValueOnce(new Error('fail-3'));

      await expect((ScraperFallbackService as any).withRetry(fn, 'test-source')).rejects.toThrow('fail-3');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  // ── Score validation ────────────────────────────────────────────────────

  describe('validateScores', () => {
    it('returns empty array when scores match', () => {
      const primary = makePrimaryResult([['real madrid', 2, 1, 'FINISHED']]);
      const fallback = makeFallbackResult([['real madrid', 2, 1, 'FINISHED']]);

      const discrepancies = (ScraperFallbackService as any).validateScores(primary, fallback);
      expect(discrepancies).toHaveLength(0);
    });

    it('returns discrepancies when scores mismatch', () => {
      const primary = makePrimaryResult([['real madrid', 2, 1, 'FINISHED']]);
      const fallback = makeFallbackResult([['real madrid', 3, 1, 'FINISHED']]);

      const discrepancies = (ScraperFallbackService as any).validateScores(primary, fallback);
      expect(discrepancies).toHaveLength(1);
      expect(discrepancies[0].team).toBe('real madrid');
      expect(discrepancies[0].primary.home_score).toBe(2);
      expect(discrepancies[0].fallback.home_score).toBe(3);
    });

    it('uses fuzzy matching for team names', () => {
      const primary = makePrimaryResult([['atletico de ma', 1, 0, 'FINISHED']]);
      const fallback = makeFallbackResult([['atletico de madrid', 2, 0, 'FINISHED']]);

      const discrepancies = (ScraperFallbackService as any).validateScores(primary, fallback);
      expect(discrepancies).toHaveLength(1);
      expect(discrepancies[0].team).toBe('atletico de ma');
    });

    it('skips SCHEDULED matches', () => {
      const primary = makePrimaryResult([['real madrid', 0, 0, 'SCHEDULED']]);
      const fallback = makeFallbackResult([['real madrid', 0, 0, 'SCHEDULED']]);

      const discrepancies = (ScraperFallbackService as any).validateScores(primary, fallback);
      expect(discrepancies).toHaveLength(0);
    });
  });
});
