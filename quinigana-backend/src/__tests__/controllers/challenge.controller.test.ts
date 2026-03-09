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
jest.mock('../../models/challenge.model');
jest.mock('../../models/jornada.model');
jest.mock('../../services/challenge.service');
jest.mock('../../services/notification.service');
jest.mock('../../utils/response.util');

import { ChallengeModel } from '../../models/challenge.model';
import { JornadaModel } from '../../models/jornada.model';
import { ChallengeService } from '../../services/challenge.service';
import { NotificationService } from '../../services/notification.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { ChallengeController } from '../../controllers/challenge.controller';

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

const baseChallengeBody = {
  challenged_id: 2,
  jornada_id: 10,
  wager_points: 5,
  message: 'Te reto!',
};

const openJornada = { id: 10, status: 'open', name: 'Jornada 10' };

const pendingChallenge = {
  id: 100,
  challenger_id: 1,
  challenged_id: 2,
  jornada_id: 10,
  wager_points: 5,
  status: 'pending',
};

const acceptedChallenge = {
  ...pendingChallenge,
  status: 'accepted',
};

describe('ChallengeController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a challenge successfully (201)', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(openJornada);
      (ChallengeModel.getUserReputation as jest.Mock).mockResolvedValue(100);
      (ChallengeModel.existsForJornada as jest.Mock).mockResolvedValue(false);
      (ChallengeService.createChallenge as jest.Mock).mockResolvedValue({ id: 100 });
      (NotificationService.notifyChallengeReceived as jest.Mock).mockResolvedValue(undefined);

      const req = mockReq({ body: baseChallengeBody });
      const res = mockRes();
      await ChallengeController.create(req, res);

      expect(sendSuccess).toHaveBeenCalledWith(res, { id: 100 }, 'Reto enviado', 201);
    });

    it('should return 400 when challenging self', async () => {
      const req = mockReq({ body: { ...baseChallengeBody, challenged_id: 1 } });
      const res = mockRes();
      await ChallengeController.create(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });

    it('should return 400 when wager is out of range (negative)', async () => {
      const req = mockReq({ body: { ...baseChallengeBody, wager_points: -1 } });
      const res = mockRes();
      await ChallengeController.create(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });

    it('should return 400 when wager is out of range (> 50)', async () => {
      const req = mockReq({ body: { ...baseChallengeBody, wager_points: 51 } });
      const res = mockRes();
      await ChallengeController.create(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });

    it('should return 400 when jornada is not open', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue({ id: 10, status: 'closed' });

      const req = mockReq({ body: baseChallengeBody });
      const res = mockRes();
      await ChallengeController.create(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });

    it('should return 400 when jornada not found', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(null);

      const req = mockReq({ body: baseChallengeBody });
      const res = mockRes();
      await ChallengeController.create(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });

    it('should return 400 when insufficient reputation', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(openJornada);
      (ChallengeModel.getUserReputation as jest.Mock).mockResolvedValue(2);

      const req = mockReq({ body: baseChallengeBody });
      const res = mockRes();
      await ChallengeController.create(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });

    it('should return 400 when challenge already exists', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(openJornada);
      (ChallengeModel.getUserReputation as jest.Mock).mockResolvedValue(100);
      (ChallengeModel.existsForJornada as jest.Mock).mockResolvedValue(true);

      const req = mockReq({ body: baseChallengeBody });
      const res = mockRes();
      await ChallengeController.create(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });

    it('should return 500 on internal error', async () => {
      (JornadaModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = mockReq({ body: baseChallengeBody });
      const res = mockRes();
      await ChallengeController.create(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'INTERNAL_ERROR', expect.any(String), 500);
    });
  });

  // ─── getById ──────────────────────────────────────────────────────────
  describe('getById', () => {
    it('should return challenge details on success', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(pendingChallenge);
      (ChallengeService.checkAndExpireIfNeeded as jest.Mock).mockResolvedValue(pendingChallenge);
      (ChallengeService.getChallengeById as jest.Mock).mockResolvedValue({ ...pendingChallenge, extra: true });

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.getById(req, res);

      expect(sendSuccess).toHaveBeenCalledWith(res, expect.objectContaining({ id: 100 }));
    });

    it('should return 404 when challenge not found', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();
      await ChallengeController.getById(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'NOT_FOUND', expect.any(String), 404);
    });

    it('should return 403 when user is not a participant', async () => {
      const otherChallenge = { ...pendingChallenge, challenger_id: 3, challenged_id: 4 };
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(otherChallenge);
      (ChallengeService.checkAndExpireIfNeeded as jest.Mock).mockResolvedValue(otherChallenge);

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.getById(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'FORBIDDEN', expect.any(String), 403);
    });
  });

  // ─── accept ───────────────────────────────────────────────────────────
  describe('accept', () => {
    it('should accept a challenge successfully', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue({ ...pendingChallenge, challenged_id: 1 });
      (ChallengeService.checkAndExpireIfNeeded as jest.Mock).mockResolvedValue({ ...pendingChallenge, challenged_id: 1, status: 'pending' });
      (JornadaModel.findById as jest.Mock).mockResolvedValue(openJornada);
      (ChallengeModel.getUserReputation as jest.Mock).mockResolvedValue(100);
      (ChallengeService.acceptChallenge as jest.Mock).mockResolvedValue(undefined);
      (NotificationService.notifyChallengeAccepted as jest.Mock).mockResolvedValue(undefined);

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.accept(req, res);

      expect(sendSuccess).toHaveBeenCalledWith(res, { message: 'Reto aceptado' });
    });

    it('should return 404 when challenge not found', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();
      await ChallengeController.accept(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'NOT_FOUND', expect.any(String), 404);
    });

    it('should return 403 when user is not the challenged user', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(pendingChallenge); // challenged_id=2, user=1

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.accept(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'FORBIDDEN', expect.any(String), 403);
    });

    it('should return 400 when challenge is already expired', async () => {
      const expiredChallenge = { ...pendingChallenge, challenged_id: 1 };
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(expiredChallenge);
      (ChallengeService.checkAndExpireIfNeeded as jest.Mock).mockResolvedValue({ ...expiredChallenge, status: 'expired' });

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.accept(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });

    it('should return 400 when jornada is closed', async () => {
      const ch = { ...pendingChallenge, challenged_id: 1 };
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(ch);
      (ChallengeService.checkAndExpireIfNeeded as jest.Mock).mockResolvedValue({ ...ch, status: 'pending' });
      (JornadaModel.findById as jest.Mock).mockResolvedValue({ id: 10, status: 'closed' });

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.accept(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });

    it('should return 400 when insufficient reputation', async () => {
      const ch = { ...pendingChallenge, challenged_id: 1 };
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(ch);
      (ChallengeService.checkAndExpireIfNeeded as jest.Mock).mockResolvedValue({ ...ch, status: 'pending' });
      (JornadaModel.findById as jest.Mock).mockResolvedValue(openJornada);
      (ChallengeModel.getUserReputation as jest.Mock).mockResolvedValue(1);

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.accept(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });
  });

  // ─── reject ───────────────────────────────────────────────────────────
  describe('reject', () => {
    it('should reject a challenge successfully', async () => {
      const ch = { ...pendingChallenge, challenged_id: 1 };
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(ch);
      (ChallengeService.checkAndExpireIfNeeded as jest.Mock).mockResolvedValue({ ...ch, status: 'pending' });
      (ChallengeService.declineChallenge as jest.Mock).mockResolvedValue(undefined);

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.reject(req, res);

      expect(sendSuccess).toHaveBeenCalledWith(res, { message: 'Reto rechazado' });
    });

    it('should return 404 when challenge not found', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();
      await ChallengeController.reject(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'NOT_FOUND', expect.any(String), 404);
    });

    it('should return 403 when user is not the challenged user', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(pendingChallenge); // challenged_id=2

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.reject(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'FORBIDDEN', expect.any(String), 403);
    });

    it('should return 400 when challenge is not pending', async () => {
      const ch = { ...pendingChallenge, challenged_id: 1 };
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(ch);
      (ChallengeService.checkAndExpireIfNeeded as jest.Mock).mockResolvedValue({ ...ch, status: 'accepted' });

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.reject(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });
  });

  // ─── cancel ───────────────────────────────────────────────────────────
  describe('cancel', () => {
    it('should cancel a challenge successfully', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(pendingChallenge); // challenger_id=1
      (ChallengeService.cancelChallenge as jest.Mock).mockResolvedValue(undefined);

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.cancel(req, res);

      expect(sendSuccess).toHaveBeenCalledWith(res, { message: 'Reto cancelado' });
    });

    it('should return 404 when challenge not found', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();
      await ChallengeController.cancel(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'NOT_FOUND', expect.any(String), 404);
    });

    it('should return 403 when user is not the challenger', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue({ ...pendingChallenge, challenger_id: 3 });

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.cancel(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'FORBIDDEN', expect.any(String), 403);
    });

    it('should return 400 when challenge is not pending', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue({ ...pendingChallenge, status: 'accepted' });

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.cancel(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });
  });

  // ─── submitPredictions ────────────────────────────────────────────────
  describe('submitPredictions', () => {
    it('should verify predictions successfully', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(acceptedChallenge);
      (JornadaModel.findById as jest.Mock).mockResolvedValue(openJornada);
      (ChallengeService.verifyPredictions as jest.Mock).mockResolvedValue({
        hasPredictions: true,
        message: 'Predicciones verificadas',
      });

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.submitPredictions(req, res);

      expect(sendSuccess).toHaveBeenCalledWith(res, expect.objectContaining({ hasPredictions: true }));
    });

    it('should return 404 when challenge not found', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();
      await ChallengeController.submitPredictions(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'NOT_FOUND', expect.any(String), 404);
    });

    it('should return 403 when user is not a participant', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue({ ...acceptedChallenge, challenger_id: 3, challenged_id: 4 });

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.submitPredictions(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'FORBIDDEN', expect.any(String), 403);
    });

    it('should return 400 when challenge is not accepted', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(pendingChallenge);

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.submitPredictions(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });

    it('should return 400 when jornada is closed', async () => {
      (ChallengeModel.findById as jest.Mock).mockResolvedValue(acceptedChallenge);
      (JornadaModel.findById as jest.Mock).mockResolvedValue({ id: 10, status: 'closed' });

      const req = mockReq({ params: { id: '100' } });
      const res = mockRes();
      await ChallengeController.submitPredictions(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'VALIDATION_ERROR', expect.any(String), 400);
    });
  });

  // ─── getHistory ───────────────────────────────────────────────────────
  describe('getHistory', () => {
    it('should return history with cursor params', async () => {
      const historyResult = { data: [], nextCursor: null, prevCursor: null };
      (ChallengeModel.getUserChallengeHistory as jest.Mock).mockResolvedValue(historyResult);

      const req = mockReq({ query: { cursor: 'abc', limit: '10', direction: 'next' } });
      const res = mockRes();
      await ChallengeController.getHistory(req, res);

      expect(ChallengeModel.getUserChallengeHistory).toHaveBeenCalledWith(1, 'abc', 10, 'next');
      expect(sendSuccess).toHaveBeenCalledWith(res, historyResult);
    });

    it('should default limit and direction', async () => {
      (ChallengeModel.getUserChallengeHistory as jest.Mock).mockResolvedValue({ data: [] });

      const req = mockReq({ query: {} });
      const res = mockRes();
      await ChallengeController.getHistory(req, res);

      expect(ChallengeModel.getUserChallengeHistory).toHaveBeenCalledWith(1, undefined, 20, 'next');
    });
  });

  // ─── getMyChallenges ──────────────────────────────────────────────────
  describe('getMyChallenges', () => {
    it('should return paginated challenges', async () => {
      (ChallengeModel.getUserChallenges as jest.Mock).mockResolvedValue({
        challenges: [{ id: 1 }],
        total: 1,
      });

      const req = mockReq({ query: { page: '1', limit: '10', status: 'pending' } });
      const res = mockRes();
      await ChallengeController.getMyChallenges(req, res);

      expect(ChallengeModel.getUserChallenges).toHaveBeenCalledWith(1, 'pending', 10, 0);
      expect(sendSuccess).toHaveBeenCalledWith(
        res,
        expect.objectContaining({ items: [{ id: 1 }], total: 1, page: 1, limit: 10, totalPages: 1 }),
      );
    });
  });

  // ─── getPending ───────────────────────────────────────────────────────
  describe('getPending', () => {
    it('should return pending challenges', async () => {
      (ChallengeModel.getPendingChallengesForUser as jest.Mock).mockResolvedValue([{ id: 1 }]);

      const req = mockReq();
      const res = mockRes();
      await ChallengeController.getPending(req, res);

      expect(sendSuccess).toHaveBeenCalledWith(res, [{ id: 1 }]);
    });
  });

  // ─── getRivalries ─────────────────────────────────────────────────────
  describe('getRivalries', () => {
    it('should return user rivalries', async () => {
      (ChallengeModel.getUserRivalries as jest.Mock).mockResolvedValue([{ opponentId: 2, wins: 3 }]);

      const req = mockReq();
      const res = mockRes();
      await ChallengeController.getRivalries(req, res);

      expect(sendSuccess).toHaveBeenCalledWith(res, [{ opponentId: 2, wins: 3 }]);
    });
  });

  // ─── getHeadToHead ────────────────────────────────────────────────────
  describe('getHeadToHead', () => {
    it('should return head-to-head stats', async () => {
      const stats = { wins: 2, losses: 1, draws: 0 };
      (ChallengeModel.getHeadToHead as jest.Mock).mockResolvedValue(stats);

      const req = mockReq({ params: { opponentId: '2' } });
      const res = mockRes();
      await ChallengeController.getHeadToHead(req, res);

      expect(ChallengeModel.getHeadToHead).toHaveBeenCalledWith(1, 2);
      expect(sendSuccess).toHaveBeenCalledWith(res, stats);
    });
  });

  // ─── getMyStats ───────────────────────────────────────────────────────
  describe('getMyStats', () => {
    it('should return challenge stats with reputation', async () => {
      (ChallengeModel.getUserChallengeStats as jest.Mock).mockResolvedValue({ wins: 5, losses: 2 });
      (ChallengeModel.getUserReputation as jest.Mock).mockResolvedValue(80);

      const req = mockReq();
      const res = mockRes();
      await ChallengeController.getMyStats(req, res);

      expect(sendSuccess).toHaveBeenCalledWith(res, { wins: 5, losses: 2, reputation: 80 });
    });
  });
});
