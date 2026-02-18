import { Request, Response } from 'express';
import { ChallengeModel } from '../models/challenge.model';
import { JornadaModel } from '../models/jornada.model';
import { NotificationService } from '../services/notification.service';
import { ChallengeAutoService } from '../services/challenge-auto.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { CreateChallengeDto } from '../types';

export class ChallengeController {
  // Create a new challenge
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

      // Check no existing challenge
      const exists = await ChallengeModel.existsForJornada(userId, challenged_id, jornada_id);
      if (exists) {
        sendError(res, 'VALIDATION_ERROR', 'Ya existe un reto para esta jornada con este usuario', 400);
        return;
      }

      const challengeId = await ChallengeModel.create(
        userId,
        challenged_id,
        jornada_id,
        wager_points,
        message
      );

      // Notify the challenged user
      await NotificationService.notifyChallengeReceived(challenged_id, userId, jornada.name);

      const challenge = await ChallengeModel.findByIdWithDetails(challengeId);
      sendSuccess(res, challenge, 'Reto enviado', 201);
    } catch (err) {
      console.error('Create challenge error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al crear el reto', 500);
    }
  }

  // Get user's challenges
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
      console.error('Get challenges error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener los retos', 500);
    }
  }

  // Get pending challenges for user
  static async getPending(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const challenges = await ChallengeModel.getPendingChallengesForUser(userId);
      sendSuccess(res, challenges);
    } catch (err) {
      console.error('Get pending challenges error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener retos pendientes', 500);
    }
  }

  // Accept a challenge
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

      if (challenge.status !== 'pending') {
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

      await ChallengeModel.updateStatus(challengeId, 'accepted', new Date());

      // Ensure stats records exist
      await ChallengeModel.getOrCreateStats(challenge.challenger_id, challenge.challenged_id);
      await ChallengeModel.getOrCreateStats(challenge.challenged_id, challenge.challenger_id);

      // Notify challenger
      await NotificationService.notifyChallengeAccepted(challenge.challenger_id, userId, jornada!.name);

      sendSuccess(res, { message: 'Reto aceptado' });
    } catch (err) {
      console.error('Accept challenge error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al aceptar el reto', 500);
    }
  }

  // Reject a challenge
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

      if (challenge.status !== 'pending') {
        sendError(res, 'VALIDATION_ERROR', 'Este reto ya no esta pendiente', 400);
        return;
      }

      await ChallengeModel.updateStatus(challengeId, 'rejected', new Date());
      sendSuccess(res, { message: 'Reto rechazado' });
    } catch (err) {
      console.error('Reject challenge error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al rechazar el reto', 500);
    }
  }

  // Cancel a challenge (only challenger can cancel pending challenges)
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

      await ChallengeModel.updateStatus(challengeId, 'cancelled');
      sendSuccess(res, { message: 'Reto cancelado' });
    } catch (err) {
      console.error('Cancel challenge error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al cancelar el reto', 500);
    }
  }

  // Get challenge details
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const challengeId = parseInt(req.params.id as string);

      const challenge = await ChallengeModel.findByIdWithDetails(challengeId);
      if (!challenge) {
        sendError(res, 'NOT_FOUND', 'Reto no encontrado', 404);
        return;
      }

      // Only participants can view
      if (challenge.challenger_id !== userId && challenge.challenged_id !== userId) {
        sendError(res, 'FORBIDDEN', 'No tienes acceso a este reto', 403);
        return;
      }

      sendSuccess(res, challenge);
    } catch (err) {
      console.error('Get challenge error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener el reto', 500);
    }
  }

  // Get user's rivalries (head-to-head stats)
  static async getRivalries(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const rivalries = await ChallengeModel.getUserRivalries(userId);
      sendSuccess(res, rivalries);
    } catch (err) {
      console.error('Get rivalries error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener rivalidades', 500);
    }
  }

  // Get head-to-head with specific user
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
      console.error('Get head to head error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener estadisticas', 500);
    }
  }

  // Get user's challenge stats
  static async getMyStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const stats = await ChallengeModel.getUserChallengeStats(userId);
      const reputation = await ChallengeModel.getUserReputation(userId);
      sendSuccess(res, { ...stats, reputation });
    } catch (err) {
      console.error('Get challenge stats error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener estadisticas', 500);
    }
  }

  static async autoGenerate(req: Request, res: Response): Promise<void> {
    try {
      const result = await ChallengeAutoService.autoGenerateForOpenJornadas();
      sendSuccess(res, result, 'Retos semanales generados');
    } catch (err) {
      console.error('Auto-generate challenges error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al autogenerar retos', 500);
    }
  }
}
