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
jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { ExportService } from '../../services/export.service';
import { StatsModel } from '../../models/stats.model';

// ── Test data ────────────────────────────────────────────────────────────────

const rankingRows = [
  { groupName: 'Los Campeones', memberCount: 5, totalPoints: 120, totalJornadas: 10, correct1x2: 80, correctPleno: 5 },
  { groupName: 'Peña Futbolera', memberCount: 3, totalPoints: 95, totalJornadas: 10, correct1x2: 60, correctPleno: 3 },
];

const predictionRows = [
  { jornadaName: 'Jornada 1', groupName: 'Los Campeones', finishedAt: '2025-09-15', totalPoints: 12, correct1x2: 8, correctPleno: 1 },
  { jornadaName: 'Jornada 2', groupName: 'Los Campeones', finishedAt: '2025-09-22', totalPoints: 15, correct1x2: 10, correctPleno: 2 },
];

const globalRankingItems = rankingRows.map(r => ({
  group_name: r.groupName,
  member_count: r.memberCount,
  total_points: r.totalPoints,
  total_jornadas: r.totalJornadas,
  correct_1x2: r.correct1x2,
  correct_pleno: r.correctPleno,
}));

const predictionItems = predictionRows.map(r => ({
  jornadaName: r.jornadaName,
  groupName: r.groupName,
  finishedAt: r.finishedAt,
  totalPoints: r.totalPoints,
  correct1x2: r.correct1x2,
  correctPleno: r.correctPleno,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ExportService', () => {
  // ── Rankings CSV ────────────────────────────────────────────────────────

  describe('Rankings CSV export', () => {
    it('generates CSV with data', async () => {
      (StatsModel.getGlobalRankings as jest.Mock).mockResolvedValue({ items: globalRankingItems, total: 2 });

      const result = await ExportService.generateExport({ format: 'csv', type: 'rankings', userId: 1 });
      expect(result.contentType).toBe('text/csv; charset=utf-8');
      expect(result.data).toContain('Los Campeones');
      expect(result.data).toContain('Peña Futbolera');
    });

    it('returns "No data available" for empty data', async () => {
      (StatsModel.getGlobalRankings as jest.Mock).mockResolvedValue({ items: [], total: 0 });

      const result = await ExportService.generateExport({ format: 'csv', type: 'rankings', userId: 1 });
      expect(result.data).toBe('No data available');
    });
  });

  // ── Rankings PDF ────────────────────────────────────────────────────────

  describe('Rankings PDF export', () => {
    it('generates PDF buffer with data', async () => {
      (StatsModel.getGlobalRankings as jest.Mock).mockResolvedValue({ items: globalRankingItems, total: 2 });

      const result = await ExportService.generateExport({ format: 'pdf', type: 'rankings', userId: 1 });
      expect(result.contentType).toBe('application/pdf');
      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect((result.data as Buffer).length).toBeGreaterThan(0);
    });

    it('generates PDF buffer for empty data', async () => {
      (StatsModel.getGlobalRankings as jest.Mock).mockResolvedValue({ items: [], total: 0 });

      const result = await ExportService.generateExport({ format: 'pdf', type: 'rankings', userId: 1 });
      expect(result.contentType).toBe('application/pdf');
      expect(Buffer.isBuffer(result.data)).toBe(true);
    });
  });

  // ── Predictions CSV ─────────────────────────────────────────────────────

  describe('Predictions CSV export', () => {
    it('generates CSV with data', async () => {
      (StatsModel.getPredictionHistory as jest.Mock).mockResolvedValue({ items: predictionItems, total: 2 });

      const result = await ExportService.generateExport({ format: 'csv', type: 'predictions', userId: 1 });
      expect(result.contentType).toBe('text/csv; charset=utf-8');
      expect(result.data).toContain('Jornada 1');
      expect(result.data).toContain('Jornada 2');
    });

    it('returns "No data available" for empty data', async () => {
      (StatsModel.getPredictionHistory as jest.Mock).mockResolvedValue({ items: [], total: 0 });

      const result = await ExportService.generateExport({ format: 'csv', type: 'predictions', userId: 1 });
      expect(result.data).toBe('No data available');
    });
  });

  // ── Predictions PDF ─────────────────────────────────────────────────────

  describe('Predictions PDF export', () => {
    it('generates PDF buffer with data', async () => {
      (StatsModel.getPredictionHistory as jest.Mock).mockResolvedValue({ items: predictionItems, total: 2 });

      const result = await ExportService.generateExport({ format: 'pdf', type: 'predictions', userId: 1 });
      expect(result.contentType).toBe('application/pdf');
      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect((result.data as Buffer).length).toBeGreaterThan(0);
    });
  });

  // ── Rankings with groupId ───────────────────────────────────────────────

  describe('Rankings with groupId', () => {
    it('uses getGroupRankings when groupId is provided', async () => {
      (StatsModel.getGroupRankings as jest.Mock).mockResolvedValue(rankingRows);

      const result = await ExportService.generateExport({ format: 'csv', type: 'rankings', userId: 1, groupId: 42 });
      expect(StatsModel.getGroupRankings).toHaveBeenCalledWith(42);
      expect(StatsModel.getGlobalRankings).not.toHaveBeenCalled();
      expect(result.data).toContain('Los Campeones');
    });
  });

  // ── Rankings without groupId ────────────────────────────────────────────

  describe('Rankings without groupId', () => {
    it('uses getGlobalRankings when groupId is not provided', async () => {
      (StatsModel.getGlobalRankings as jest.Mock).mockResolvedValue({ items: globalRankingItems, total: 2 });

      await ExportService.generateExport({ format: 'csv', type: 'rankings', userId: 1 });
      expect(StatsModel.getGlobalRankings).toHaveBeenCalledWith(1, 500);
      expect(StatsModel.getGroupRankings).not.toHaveBeenCalled();
    });
  });

  // ── Content type and filename ───────────────────────────────────────────

  describe('Content type and filename correctness', () => {
    it('returns correct content type and .csv extension for CSV', async () => {
      (StatsModel.getGlobalRankings as jest.Mock).mockResolvedValue({ items: [], total: 0 });

      const result = await ExportService.generateExport({ format: 'csv', type: 'rankings', userId: 1 });
      expect(result.contentType).toBe('text/csv; charset=utf-8');
      expect(result.fileName).toMatch(/\.csv$/);
    });

    it('returns correct content type and .pdf extension for PDF', async () => {
      (StatsModel.getGlobalRankings as jest.Mock).mockResolvedValue({ items: [], total: 0 });

      const result = await ExportService.generateExport({ format: 'pdf', type: 'rankings', userId: 1 });
      expect(result.contentType).toBe('application/pdf');
      expect(result.fileName).toMatch(/\.pdf$/);
    });
  });

  // ── Date in filename ───────────────────────────────────────────────────

  describe('Date in filename', () => {
    it('matches current date in YYYY-MM-DD format', async () => {
      (StatsModel.getGlobalRankings as jest.Mock).mockResolvedValue({ items: [], total: 0 });

      const result = await ExportService.generateExport({ format: 'csv', type: 'rankings', userId: 1 });
      const today = new Date().toISOString().slice(0, 10);
      expect(result.fileName).toBe(`quinigana-rankings-${today}.csv`);
    });

    it('includes type in filename', async () => {
      (StatsModel.getPredictionHistory as jest.Mock).mockResolvedValue({ items: [], total: 0 });

      const result = await ExportService.generateExport({ format: 'csv', type: 'predictions', userId: 1 });
      const today = new Date().toISOString().slice(0, 10);
      expect(result.fileName).toBe(`quinigana-predictions-${today}.csv`);
    });
  });
});
