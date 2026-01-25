import { Request, Response } from 'express';
import { ComparisonModel } from '../models/comparison.model';
import { GroupModel } from '../models/group.model';
import { QuinielaScraper } from '../services/quiniela-scraper.service';
import { ApiResponse } from '../types';

export class ComparisonController {
  /**
   * GET /api/groups/:groupId/jornadas/:jornadaId/ranking
   * Get live ranking for a group in a specific jornada
   */
  static async getGroupJornadaRanking(req: Request, res: Response): Promise<void> {
    try {
      const groupId = Number(req.params.groupId);
      const jornadaId = Number(req.params.jornadaId);
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

      // Get live results
      let liveResults: Map<string, { home_score: number; away_score: number; status: string }> | null = null;
      try {
        liveResults = await QuinielaScraper.getLiveResults();
      } catch {
        // Scraping failed, continue with DB results only
      }

      const ranking = await ComparisonModel.getGroupLiveRanking(groupId, jornadaId, liveResults);

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
      const groupId = Number(req.params.groupId);
      const jornadaId = Number(req.params.jornadaId);
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

      // Get live results
      let liveResults: Map<string, { home_score: number; away_score: number; status: string }> | null = null;
      try {
        liveResults = await QuinielaScraper.getLiveResults();
      } catch {
        // Scraping failed, continue with DB results only
      }

      const comparison = await ComparisonModel.getGroupComparison(groupId, jornadaId, liveResults);

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
