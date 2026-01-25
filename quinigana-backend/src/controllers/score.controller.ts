import { Request, Response } from 'express';
import { ScoreService } from '../services/score.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { parseId } from '../utils/parse-id.util';

export class ScoreController {
  static async getGroupScores(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      const scores = await ScoreService.getGroupScores(groupId);
      sendSuccess(res, scores);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch scores';
      sendError(res, 'SCORES_ERROR', message, 500);
    }
  }

  static async getGroupScoreByJornada(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      const jornadaId = parseId(req.params.jornadaId);
      const score = await ScoreService.getGroupScoreByJornada(groupId, jornadaId);
      if (!score) {
        sendError(res, 'SCORE_NOT_FOUND', 'No score found for this jornada', 404);
        return;
      }
      sendSuccess(res, score);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch score', 500);
    }
  }
}
