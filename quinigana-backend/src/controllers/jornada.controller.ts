import { Request, Response } from 'express';
import { JornadaService } from '../services/jornada.service';
import { ScoreService } from '../services/score.service';
import { GamificationService } from '../services/gamification.service';
import { JornadaModel } from '../models/jornada.model';
import { sendSuccess, sendError } from '../utils/response.util';
import { parseId } from '../utils/parse-id.util';

export class JornadaController {
  // Admin endpoints
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const jornada = await JornadaService.createJornada(req.body);
      sendSuccess(res, jornada, 'Jornada created', 201);
    } catch (error: any) {
      if (error?.statusCode) {
        sendError(res, error.code || 'CREATE_JORNADA_ERROR', error.message, error.statusCode);
        return;
      }
      const message = error instanceof Error ? error.message : 'Failed to create jornada';
      sendError(res, 'CREATE_JORNADA_ERROR', message, 400);
    }
  }

  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const jornadaId = parseId(req.params.id);
      const { status } = req.body;
      const jornada = await JornadaService.updateStatus(jornadaId, status);
      sendSuccess(res, jornada, 'Jornada status updated');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update jornada';
      sendError(res, 'UPDATE_JORNADA_ERROR', message, 400);
    }
  }

  static async submitResults(req: Request, res: Response): Promise<void> {
    try {
      const jornadaId = parseId(req.params.id);
      const jornada = await JornadaService.submitResults(jornadaId, req.body);

      // Calculate scores after results are submitted
      await ScoreService.calculateScoresForJornada(jornadaId);

      // Process gamification (badges + XP)
      await GamificationService.processJornadaAchievements(jornadaId);

      sendSuccess(res, jornada, 'Results submitted and scores calculated');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit results';
      sendError(res, 'SUBMIT_RESULTS_ERROR', message, 400);
    }
  }

  // Public endpoints
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const jornadas = await JornadaService.getAllForUser(userId);
      sendSuccess(res, jornadas);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch jornadas', 500);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const jornadaId = parseId(req.params.id);
      const jornada = await JornadaService.getById(jornadaId);
      if (!jornada) {
        sendError(res, 'JORNADA_NOT_FOUND', 'Jornada not found', 404);
        return;
      }
      sendSuccess(res, jornada);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch jornada', 500);
    }
  }

  static async getActive(req: Request, res: Response): Promise<void> {
    try {
      const jornada = await JornadaService.getActive();
      sendSuccess(res, jornada);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch active jornada', 500);
    }
  }

  static async getLiveScores(req: Request, res: Response): Promise<void> {
    try {
      const jornadaId = parseId(req.params.id);
      const results = await JornadaService.getLiveScores(jornadaId);
      sendSuccess(res, results);
    } catch (err: any) {
      sendError(res, 'LIVE_SCORES_ERROR', err.message || 'Failed to fetch live scores', 500);
    }
  }

  static async getMyPredictions(req: Request, res: Response): Promise<void> {
    try {
      const jornadaId = parseId(req.params.id);
      const userId = req.authUser!.userId;
      const predictions = await JornadaService.getUserPredictions(jornadaId, userId);
      sendSuccess(res, predictions);
    } catch (err: any) {
      sendError(res, 'PREDICTIONS_ERROR', err.message || 'Failed to fetch predictions', 500);
    }
  }

  // Admin: Delete jornada
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const jornadaId = parseId(req.params.id);

      // Check if can delete
      const check = await JornadaModel.canDelete(jornadaId);
      if (!check.canDelete) {
        sendError(res, 'CANNOT_DELETE', check.reason || 'No se puede eliminar esta jornada', 400);
        return;
      }

      await JornadaModel.delete(jornadaId);
      sendSuccess(res, { message: 'Jornada eliminada' });
    } catch (err: any) {
      if (err.code === 'JORNADA_HAS_PREDICTIONS') {
        sendError(res, err.code, err.message, err.statusCode || 400);
        return;
      }
      sendError(res, 'DELETE_ERROR', err.message || 'Error al eliminar jornada', 500);
    }
  }
}
