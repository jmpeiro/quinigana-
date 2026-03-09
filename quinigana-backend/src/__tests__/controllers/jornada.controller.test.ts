jest.mock('../../config/environment', () => ({
  env: { nodeEnv: 'test', frontendUrl: 'http://localhost:4200', db: { host: 'localhost', port: 3306, user: 'root', password: '', name: 'test' }, jwt: { accessSecret: 'test-secret-min-32-chars-long!!!', refreshSecret: 'test-refresh-min-32-chars!!!!!!!', accessExpiry: '15m', refreshExpiry: '7d' }, email: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', from: 'test@test.com' }, google: { clientId: '', clientSecret: '', callbackUrl: '' }, rateLimit: { windowMs: 900000, max: 100 } },
}));
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));
jest.mock('../../services/jornada.service');
jest.mock('../../services/score.service');
jest.mock('../../services/gamification.service');
jest.mock('../../models/jornada.model');

import { JornadaController } from '../../controllers/jornada.controller';
import { JornadaService } from '../../services/jornada.service';
import { ScoreService } from '../../services/score.service';
import { GamificationService } from '../../services/gamification.service';
import { JornadaModel } from '../../models/jornada.model';

const mockJornadaService = JornadaService as jest.Mocked<typeof JornadaService>;
const mockScoreService = ScoreService as jest.Mocked<typeof ScoreService>;
const mockGamificationService = GamificationService as jest.Mocked<typeof GamificationService>;
const mockJornadaModel = JornadaModel as jest.Mocked<typeof JornadaModel>;

function mockRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}
function mockReq(overrides: any = {}): any {
  return { body: {}, params: {}, query: {}, cookies: {}, authUser: { userId: 1, email: 'test@test.com' }, ...overrides };
}

describe('JornadaController', () => {
  beforeEach(() => jest.clearAllMocks());

  // =====================================================
  // CREATE
  // =====================================================
  describe('create', () => {
    it('should create a jornada and return 201', async () => {
      const jornada = { id: 1, name: 'Jornada 1', matches: [] };
      mockJornadaService.createJornada.mockResolvedValue(jornada as any);

      const req = mockReq({ body: { name: 'Jornada 1', season: '2024-25', jornada_number: 1, deadline: '2024-12-01', matches: [] } });
      const res = mockRes();
      await JornadaController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 on creation error', async () => {
      mockJornadaService.createJornada.mockRejectedValue(new Error('Invalid data'));

      const req = mockReq({ body: {} });
      const res = mockRes();
      await JornadaController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // =====================================================
  // UPDATE STATUS
  // =====================================================
  describe('updateStatus', () => {
    it('should update jornada status', async () => {
      mockJornadaService.updateStatus.mockResolvedValue({ id: 1, status: 'closed' } as any);

      const req = mockReq({ params: { id: '1' }, body: { status: 'closed' } });
      const res = mockRes();
      await JornadaController.updateStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 when jornada not found', async () => {
      mockJornadaService.updateStatus.mockRejectedValue(new Error('Jornada not found'));

      const req = mockReq({ params: { id: '999' }, body: { status: 'closed' } });
      const res = mockRes();
      await JornadaController.updateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 with invalid ID', async () => {
      const req = mockReq({ params: { id: 'abc' }, body: { status: 'closed' } });
      const res = mockRes();
      await JornadaController.updateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // =====================================================
  // SUBMIT RESULTS
  // =====================================================
  describe('submitResults', () => {
    it('should submit results, calculate scores, and process gamification', async () => {
      mockJornadaService.submitResults.mockResolvedValue({ id: 1 } as any);
      mockScoreService.calculateScoresForJornada.mockResolvedValue(undefined);
      mockGamificationService.processJornadaAchievements.mockResolvedValue(undefined);

      const req = mockReq({ params: { id: '1' }, body: { results: [] } });
      const res = mockRes();
      await JornadaController.submitResults(req, res);

      expect(mockScoreService.calculateScoresForJornada).toHaveBeenCalledWith(1);
      expect(mockGamificationService.processJornadaAchievements).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 on submit error', async () => {
      mockJornadaService.submitResults.mockRejectedValue(new Error('Jornada not found'));

      const req = mockReq({ params: { id: '1' }, body: { results: [] } });
      const res = mockRes();
      await JornadaController.submitResults(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // =====================================================
  // GET ALL
  // =====================================================
  describe('getAll', () => {
    it('should return jornadas with offset pagination by default', async () => {
      mockJornadaService.getAllForUser.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 } as any);

      const req = mockReq({ query: {} });
      const res = mockRes();
      await JornadaController.getAll(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should use cursor-based pagination when cursor is provided', async () => {
      mockJornadaModel.searchWithCursor.mockResolvedValue({ data: [], nextCursor: null, prevCursor: null, total: 0 } as any);

      const req = mockReq({ query: { cursor: 'abc123' } });
      const res = mockRes();
      await JornadaController.getAll(req, res);

      expect(mockJornadaModel.searchWithCursor).toHaveBeenCalled();
    });

    it('should use cursor-based pagination when filters are provided', async () => {
      mockJornadaModel.searchWithCursor.mockResolvedValue({ data: [], nextCursor: null, prevCursor: null, total: 0 } as any);

      const req = mockReq({ query: { status: 'open' } });
      const res = mockRes();
      await JornadaController.getAll(req, res);

      expect(mockJornadaModel.searchWithCursor).toHaveBeenCalled();
    });

    it('should return 500 on internal error', async () => {
      mockJornadaService.getAllForUser.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ query: {} });
      const res = mockRes();
      await JornadaController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // =====================================================
  // GET BY ID
  // =====================================================
  describe('getById', () => {
    it('should return jornada by ID', async () => {
      mockJornadaService.getById.mockResolvedValue({ id: 1, name: 'J1' } as any);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      await JornadaController.getById(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 when jornada not found', async () => {
      mockJornadaService.getById.mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();
      await JornadaController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // =====================================================
  // GET ACTIVE
  // =====================================================
  describe('getActive', () => {
    it('should return active jornada', async () => {
      mockJornadaService.getActive.mockResolvedValue({ id: 1, status: 'open' } as any);

      const req = mockReq();
      const res = mockRes();
      await JornadaController.getActive(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // =====================================================
  // GET LIVE SCORES
  // =====================================================
  describe('getLiveScores', () => {
    it('should return live scores for a jornada', async () => {
      mockJornadaService.getLiveScores.mockResolvedValue([{ match_number: 1, home_team: 'A', away_team: 'B' }] as any);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      await JornadaController.getLiveScores(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 500 on live scores error', async () => {
      mockJornadaService.getLiveScores.mockRejectedValue(new Error('Jornada not found'));

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();
      await JornadaController.getLiveScores(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // =====================================================
  // GET MY PREDICTIONS
  // =====================================================
  describe('getMyPredictions', () => {
    it('should return user predictions for jornada', async () => {
      mockJornadaService.getUserPredictions.mockResolvedValue([{ match_id: 1, prediction_1x2: '1' }] as any);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      await JornadaController.getMyPredictions(req, res);

      expect(mockJornadaService.getUserPredictions).toHaveBeenCalledWith(1, 1);
    });
  });

  // =====================================================
  // DELETE
  // =====================================================
  describe('delete', () => {
    it('should delete jornada successfully', async () => {
      mockJornadaModel.canDelete.mockResolvedValue({ canDelete: true } as any);
      mockJornadaModel.delete.mockResolvedValue(undefined as any);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      await JornadaController.delete(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 when jornada cannot be deleted', async () => {
      mockJornadaModel.canDelete.mockResolvedValue({ canDelete: false, reason: 'Has predictions' } as any);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      await JornadaController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
