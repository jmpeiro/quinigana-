import { Request, Response } from 'express';
import { ComparisonModel } from '../models/comparison.model';
import { GroupModel } from '../models/group.model';
import { JornadaService } from '../services/jornada.service';
import { ApiResponse } from '../types';
import { parseId } from '../utils/parse-id.util';

export class ComparisonController {
  /**
   * GET /api/groups/:groupId/jornadas/:jornadaId/ranking
   * Get live ranking for a group in a specific jornada
   */
  static async getGroupJornadaRanking(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.groupId || req.params.id);
      const jornadaId = parseId(req.params.jornadaId);
      const userId = req.authUser!.userId;

      // Verify user is member of group
      const isMember = await GroupModel.isMember(groupId, userId);
      if (!isMember) {
        const response: ApiResponse = {
          success: false,
          error: { code: 'FORBIDDEN', message: 'No eres miembro de este grupo' }
        };
        res.status(403).json(response);
        return;
      }

      // Build jornada-scoped live results map (match_number -> score/status/sign)
      let liveScoresByMatch: Map<number, { home_score: number | null; away_score: number | null; status: string; sign: string | null }> | null = null;
      try {
        const liveRows = await JornadaService.getLiveScores(jornadaId);
        liveScoresByMatch = new Map(liveRows.map((r) => [r.match_number, r]));
      } catch {
        // If live service fails, model will use DB match_results fallback.
        liveScoresByMatch = null;
      }

      const ranking = await ComparisonModel.getGroupLiveRanking(groupId, jornadaId, liveScoresByMatch);

      const response: ApiResponse = {
        success: true,
        data: ranking
      };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error al obtener ranking' }
      };
      res.status(500).json(response);
    }
  }

  /**
   * GET /api/groups/:groupId/jornadas/:jornadaId/comparison
   * Get detailed comparison of all predictions for a group/jornada
   */
  static async getGroupJornadaComparison(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.groupId || req.params.id);
      const jornadaId = parseId(req.params.jornadaId);
      const userId = req.authUser!.userId;

      // Verify user is member of group
      const isMember = await GroupModel.isMember(groupId, userId);
      if (!isMember) {
        const response: ApiResponse = {
          success: false,
          error: { code: 'FORBIDDEN', message: 'No eres miembro de este grupo' }
        };
        res.status(403).json(response);
        return;
      }

      // Build jornada-scoped live results map (match_number -> score/status/sign)
      let liveScoresByMatch: Map<number, { home_score: number | null; away_score: number | null; status: string; sign: string | null }> | null = null;
      try {
        const liveRows = await JornadaService.getLiveScores(jornadaId);
        liveScoresByMatch = new Map(liveRows.map((r) => [r.match_number, r]));
      } catch {
        liveScoresByMatch = null;
      }

      const comparison = await ComparisonModel.getGroupComparison(groupId, jornadaId, liveScoresByMatch);

      const response: ApiResponse = {
        success: true,
        data: comparison
      };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Error al obtener comparativa' }
      };
      res.status(500).json(response);
    }
  }
}
