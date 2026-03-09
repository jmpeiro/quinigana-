import { Request, Response } from 'express';
import { StatsService } from '../services/stats.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { parseId } from '../utils/parse-id.util';
import { parsePagination } from '../utils/pagination';

export class StatsController {
  static async getPersonalStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : undefined;
      const data = await StatsService.getPersonalStats(userId, seasonId);
      sendSuccess(res, data);
    } catch (err: any) {
      sendError(res, err.code || 'STATS_ERROR', err.message || 'Error fetching stats', err.statusCode || 500);
    }
  }

  static async getGroupHistory(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      const { page, limit } = parsePagination(req.query);

      const data = await StatsService.getGroupHistory(groupId, page, limit);
      sendSuccess(res, data);
    } catch (err: any) {
      sendError(res, err.code || 'HISTORY_ERROR', err.message || 'Error fetching history', err.statusCode || 500);
    }
  }

  static async getJornadaDetail(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      const jornadaId = parseId(req.params.jornadaId);

      const data = await StatsService.getJornadaDetail(groupId, jornadaId);
      if (!data) {
        sendError(res, 'NOT_FOUND', 'No results found for this jornada', 404);
        return;
      }
      sendSuccess(res, data);
    } catch (err: any) {
      sendError(res, err.code || 'DETAIL_ERROR', err.message || 'Error fetching detail', err.statusCode || 500);
    }
  }

  static async getGroupRankings(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      const data = await StatsService.getGroupRankings(groupId);
      sendSuccess(res, data);
    } catch (err: any) {
      sendError(res, err.code || 'RANKING_ERROR', err.message || 'Error fetching rankings', err.statusCode || 500);
    }
  }

  static async getPredictionHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const { page, limit } = parsePagination(req.query);

      const data = await StatsService.getPredictionHistory(userId, page, limit);
      sendSuccess(res, data);
    } catch (err: any) {
      sendError(res, err.code || 'PREDICTIONS_ERROR', err.message || 'Error fetching prediction history', err.statusCode || 500);
    }
  }

  static async getGlobalRankings(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const data = await StatsService.getGlobalRankings(page, limit);
      sendSuccess(res, data);
    } catch (err: any) {
      sendError(res, err.code || 'GLOBAL_RANKING_ERROR', err.message || 'Error fetching global rankings', err.statusCode || 500);
    }
  }

  static async exportCsv(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const csv = await StatsService.getExportData(userId);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="quinigana-stats.csv"');
      res.send(csv);
    } catch (err: any) {
      sendError(res, err.code || 'EXPORT_ERROR', err.message || 'Error exporting data', err.statusCode || 500);
    }
  }

  static async getPredictionsHeatmap(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 10));
      const data = await StatsService.getPredictionsHeatmap(userId, limit);
      sendSuccess(res, data);
    } catch (err: any) {
      sendError(res, err.code || 'HEATMAP_ERROR', err.message || 'Error fetching heatmap', err.statusCode || 500);
    }
  }
}
