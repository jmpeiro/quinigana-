import { Request, Response } from 'express';
import { SeasonService } from '../services/season.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { parseId } from '../utils/parse-id.util';

export class SeasonController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const seasons = await SeasonService.getAll();
      sendSuccess(res, seasons);
    } catch (err: any) {
      sendError(res, err.code || 'FETCH_ERROR', err.message || 'Error fetching seasons', err.statusCode || 500);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req.params.id);
      const season = await SeasonService.getById(id);
      if (!season) {
        sendError(res, 'SEASON_NOT_FOUND', 'Season not found', 404);
        return;
      }
      sendSuccess(res, season);
    } catch (err: any) {
      sendError(res, err.code || 'FETCH_ERROR', err.message || 'Error fetching season', err.statusCode || 500);
    }
  }

  static async getCurrent(req: Request, res: Response): Promise<void> {
    try {
      const season = await SeasonService.getCurrent();
      sendSuccess(res, season);
    } catch (err: any) {
      sendError(res, err.code || 'FETCH_ERROR', err.message || 'Error fetching current season', err.statusCode || 500);
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, display_name, start_date, end_date, is_current } = req.body;

      if (!name || !display_name || !start_date || !end_date) {
        sendError(res, 'VALIDATION_ERROR', 'Name, display_name, start_date, and end_date are required', 400);
        return;
      }

      const id = await SeasonService.create({ name, display_name, start_date, end_date, is_current });
      const season = await SeasonService.getById(id);
      sendSuccess(res, season, undefined, 201);
    } catch (err: any) {
      sendError(res, err.code || 'CREATE_ERROR', err.message || 'Error creating season', err.statusCode || 500);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req.params.id);
      const { name, display_name, start_date, end_date, is_current } = req.body;

      await SeasonService.update(id, { name, display_name, start_date, end_date, is_current });
      const season = await SeasonService.getById(id);
      sendSuccess(res, season);
    } catch (err: any) {
      sendError(res, err.code || 'UPDATE_ERROR', err.message || 'Error updating season', err.statusCode || 500);
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req.params.id);
      await SeasonService.delete(id);
      sendSuccess(res, { message: 'Season deleted successfully' });
    } catch (err: any) {
      sendError(res, err.code || 'DELETE_ERROR', err.message || 'Error deleting season', err.statusCode || 500);
    }
  }

  static async setAsCurrent(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req.params.id);
      await SeasonService.setAsCurrent(id);
      const season = await SeasonService.getById(id);
      sendSuccess(res, season);
    } catch (err: any) {
      sendError(res, err.code || 'UPDATE_ERROR', err.message || 'Error setting current season', err.statusCode || 500);
    }
  }

  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const id = parseId(req.params.id);
      const stats = await SeasonService.getSeasonStats(id);
      sendSuccess(res, stats);
    } catch (err: any) {
      sendError(res, err.code || 'FETCH_ERROR', err.message || 'Error fetching season stats', err.statusCode || 500);
    }
  }
}
