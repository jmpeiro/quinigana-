import { Request, Response } from 'express';
import { ChallengeModel } from '../models/challenge.model';
import { JornadaModel } from '../models/jornada.model';
import { ChallengeService } from '../services/challenge.service';
import { NotificationService } from '../services/notification.service';
import { ChallengeAutoService } from '../services/challenge-auto.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { CreateChallengeDto } from '../types';
import logger from '../config/logger';

export class ChallengeController {
  // POST /challenges - Create a new challenge
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const { challenged_id, jornada_id, wager_points, message } = req.body as CreateChallengeDto;

      // Validations
      if (challenged_id === userId) {
        sendError(res, 'VALIDATION_ERROR', 'No puedes retarte a ti mismo', 400);
        return;
      }

      if (wager_points < 0 || wager_points > 50) {
        sendError(res, 'VALIDATION_ERROR', 'Los puntos de apuesta deben ser entre 0 y 50', 400);
        return;
      }

      // Check jornada is open
      const jornada = await JornadaModel.findById(jornada_id);
      if (!jornada || jornada.status !== 'open') {
        sendError(res, 'VALIDATION_ERROR', 'La jornada no esta disponible para retos', 400);
        return;
      }

      // Check user has enough reputation
      const userRep = await ChallengeModel.getUserReputation(userId);
      if (userRep < wager_points) {
        sendError(res, 'VALIDATION_ERROR', 'No tienes suficientes puntos de reputacion', 400);
        return;
      }

      // Check no existing active challenge between these users for this jornada
      const exists = await ChallengeModel.existsForJornada(userId, challenged_id, jornada_id);
      if (exists) {
        sendError(res, 'VALIDATION_ERROR', 'Ya existe un reto para esta jornada con este usuario', 400);
        return;
      }

      const challenge = await ChallengeService.createChallenge(userId, {
        challenged_id,
        jornada_id,
        wager_points,
        message,
      });

      // Notify the challenged user
      await NotificationService.notifyChallengeReceived(challenged_id, userId, jornada.name);

      sendSuccess(res, challenge, 'Reto enviado', 201);
    } catch (err) {
      logger.error({ error: err }, 'Create challenge error');
      sendError(res, 'INTERNAL_ERROR', 'Error al crear el reto', 500);
    }
  }

  // GET /challenges/:id - Get challenge detail
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const challengeId = parseInt(req.params.id as string);

      const challenge = await ChallengeModel.findById(challengeId);
      if (!challenge) {
        sendError(res, 'NOT_FOUND', 'Reto no encontrado', 404);
        return;
      }

      // Check-on-access expiration
      const checkedChallenge = await ChallengeService.checkAndExpireIfNeeded(challenge);

      // Only participants can view
      if (checkedChallenge.challenger_id !== userId && checkedChallenge.challenged_id !== userId) {
        sendError(res, 'FORBIDDEN', 'No tienes acceso a este reto', 403);
        return;
      }

      const details = await ChallengeService.getChallengeById(challengeId);
      sendSuccess(res, details);
    } catch (err) {
      logger.error({ error: err }, 'Get challenge error');
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener el reto', 500);
    }
  }

  // PUT /challenges/:id/accept - Accept a challenge
  static async accept(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const challengeId = parseInt(req.params.id as string);

      const challenge = await ChallengeModel.findById(challengeId);
      if (!challenge) {
        sendError(res, 'NOT_FOUND', 'Reto no encontrado', 404);
        return;
      }

      if (challenge.challenged_id !== userId) {
        sendError(res, 'FORBIDDEN', 'No puedes aceptar este reto', 403);
        return;
      }

      // Check-on-access expiration
      const checkedChallenge = await ChallengeService.checkAndExpireIfNeeded(challenge);
      if (checkedChallenge.status !== 'pending') {
        sendError(res, 'VALIDATION_ERROR', 'Este reto ya no esta pendiente', 400);
        return;
      }

      // Check jornada still open
      const jornada = await JornadaModel.findById(challenge.jornada_id);
      if (!jornada || jornada.status !== 'open') {
        sendError(res, 'VALIDATION_ERROR', 'La jornada ya no esta disponible', 400);
        return;
      }

      // Check user has enough reputation
      const userRep = await ChallengeModel.getUserReputation(userId);
      if (userRep < challenge.wager_points) {
        sendError(res, 'VALIDATION_ERROR', 'No tienes suficientes puntos de reputacion', 400);
        return;
      }

      await ChallengeService.acceptChallenge(challengeId, challenge);

      // Notify challenger
      await NotificationService.notifyChallengeAccepted(challenge.challenger_id, userId, jornada!.name);

      sendSuccess(res, { message: 'Reto aceptado' });
    } catch (err) {
      logger.error({ error: err }, 'Accept challenge error');
      sendError(res, 'INTERNAL_ERROR', 'Error al aceptar el reto', 500);
    }
  }

  // PUT /challenges/:id/predictions - Submit predictions context for a challenge
  static async submitPredictions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const challengeId = parseInt(req.params.id as string);

      const challenge = await ChallengeModel.findById(challengeId);
      if (!challenge) {
        sendError(res, 'NOT_FOUND', 'Reto no encontrado', 404);
        return;
      }

      // Only participants
      if (challenge.challenger_id !== userId && challenge.challenged_id !== userId) {
        sendError(res, 'FORBIDDEN', 'No eres participante de este reto', 403);
        return;
      }

      if (challenge.status !== 'accepted') {
        sendError(res, 'VALIDATION_ERROR', 'El reto debe estar aceptado para enviar predicciones', 400);
        return;
      }

      // Check jornada still open
      const jornada = await JornadaModel.findById(challenge.jornada_id);
      if (!jornada || jornada.status !== 'open') {
        sendError(res, 'VALIDATION_ERROR', 'La jornada ya no esta disponible para predicciones', 400);
        return;
      }

      // Verify the user has active predictions via the proposal system
      const result = await ChallengeService.verifyPredictions(userId, challenge);

      sendSuccess(res, {
        challengeId: challenge.id,
        jornadaId: challenge.jornada_id,
        hasPredictions: result.hasPredictions,
        message: result.message,
      });
    } catch (err) {
      logger.error({ error: err }, 'Submit predictions error');
      sendError(res, 'INTERNAL_ERROR', 'Error al verificar predicciones del reto', 500);
    }
  }

  // GET /challenges/history - User challenge history (cursor-based)
  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const direction = (req.query.direction as 'next' | 'prev') || 'next';

      const result = await ChallengeModel.getUserChallengeHistory(userId, cursor, limit, direction);
      sendSuccess(res, result);
    } catch (err) {
      logger.error({ error: err }, 'Get challenge history error');
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener el historial de retos', 500);
    }
  }

  // GET /challenges - Get user's challenges (offset-based, backward compat)
  static async getMyChallenges(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const status = req.query.status as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const { challenges, total } = await ChallengeModel.getUserChallenges(
        userId,
        status,
        limit,
        offset
      );

      sendSuccess(res, {
        items: challenges,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      logger.error({ error: err }, 'Get challenges error');
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener los retos', 500);
    }
  }

  // GET /challenges/pending
  static async getPending(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const challenges = await ChallengeModel.getPendingChallengesForUser(userId);
      sendSuccess(res, challenges);
    } catch (err) {
      logger.error({ error: err }, 'Get pending challenges error');
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener retos pendientes', 500);
    }
  }

  // POST /challenges/:id/reject - Reject/Decline a challenge
  static async reject(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const challengeId = parseInt(req.params.id as string);

      const challenge = await ChallengeModel.findById(challengeId);
      if (!challenge) {
        sendError(res, 'NOT_FOUND', 'Reto no encontrado', 404);
        return;
      }

      if (challenge.challenged_id !== userId) {
        sendError(res, 'FORBIDDEN', 'No puedes rechazar este reto', 403);
        return;
      }

      // Check-on-access expiration
      const checkedChallenge = await ChallengeService.checkAndExpireIfNeeded(challenge);
      if (checkedChallenge.status !== 'pending') {
        sendError(res, 'VALIDATION_ERROR', 'Este reto ya no esta pendiente', 400);
        return;
      }

      await ChallengeService.declineChallenge(challengeId);
      sendSuccess(res, { message: 'Reto rechazado' });
    } catch (err) {
      logger.error({ error: err }, 'Reject challenge error');
      sendError(res, 'INTERNAL_ERROR', 'Error al rechazar el reto', 500);
    }
  }

  // POST /challenges/:id/cancel
  static async cancel(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const challengeId = parseInt(req.params.id as string);

      const challenge = await ChallengeModel.findById(challengeId);
      if (!challenge) {
        sendError(res, 'NOT_FOUND', 'Reto no encontrado', 404);
        return;
      }

      if (challenge.challenger_id !== userId) {
        sendError(res, 'FORBIDDEN', 'No puedes cancelar este reto', 403);
        return;
      }

      if (challenge.status !== 'pending') {
        sendError(res, 'VALIDATION_ERROR', 'Solo puedes cancelar retos pendientes', 400);
        return;
      }

      await ChallengeService.cancelChallenge(challengeId);
      sendSuccess(res, { message: 'Reto cancelado' });
    } catch (err) {
      logger.error({ error: err }, 'Cancel challenge error');
      sendError(res, 'INTERNAL_ERROR', 'Error al cancelar el reto', 500);
    }
  }

  // GET /challenges/rivalries
  static async getRivalries(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const rivalries = await ChallengeModel.getUserRivalries(userId);
      sendSuccess(res, rivalries);
    } catch (err) {
      logger.error({ error: err }, 'Get rivalries error');
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener rivalidades', 500);
    }
  }

  // GET /challenges/head-to-head/:opponentId
  static async getHeadToHead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const opponentId = parseInt(req.params.opponentId as string);
      const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 10));

      const [stats, recent] = await Promise.all([
        ChallengeModel.getHeadToHead(userId, opponentId),
        ChallengeModel.getHeadToHeadRecent(userId, opponentId, limit),
      ]);

      sendSuccess(res, { stats, recent });
    } catch (err) {
      logger.error({ error: err }, 'Get head to head error');
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener estadisticas', 500);
    }
  }

  // GET /challenges/stats
  static async getMyStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const stats = await ChallengeModel.getUserChallengeStats(userId);
      const reputation = await ChallengeModel.getUserReputation(userId);
      sendSuccess(res, { ...stats, reputation });
    } catch (err) {
      logger.error({ error: err }, 'Get challenge stats error');
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener estadisticas', 500);
    }
  }

  static async autoGenerate(req: Request, res: Response): Promise<void> {
    try {
      const result = await ChallengeAutoService.autoGenerateForOpenJornadas();
      sendSuccess(res, result, 'Retos semanales generados');
    } catch (err) {
      logger.error({ error: err }, 'Auto-generate challenges error');
      sendError(res, 'INTERNAL_ERROR', 'Error al autogenerar retos', 500);
    }
  }
}
