import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { OpsMetricsService } from '../services/ops-metrics.service';
import { FootballDataService } from '../services/football-data.service';
import { QuinielaScraper } from '../services/quiniela-scraper.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class AdminController {
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const search = req.query.search as string | undefined;

      const data = await AdminService.getUsers(page, limit, search);
      sendSuccess(res, data);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch users', 500);
    }
  }

  static async toggleAdmin(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.id);
      if (!userId) {
        sendError(res, 'INVALID_ID', 'Invalid user ID', 400);
        return;
      }

      // Prevent self-demotion
      if (userId === req.authUser!.userId) {
        sendError(res, 'SELF_TOGGLE', 'Cannot toggle your own admin status', 400);
        return;
      }

      const newValue = await AdminService.toggleAdmin(userId);
      sendSuccess(res, { is_admin: newValue });
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to toggle admin status', 500);
    }
  }

  static async toggleUserActive(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.id);
      if (!userId) {
        sendError(res, 'INVALID_ID', 'Invalid user ID', 400);
        return;
      }

      if (userId === req.authUser!.userId) {
        sendError(res, 'SELF_TOGGLE', 'Cannot deactivate your own account', 400);
        return;
      }

      const newValue = await AdminService.toggleUserActive(userId);
      sendSuccess(res, { is_active: newValue });
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to toggle user active status', 500);
    }
  }

  static async getGlobalStats(req: Request, res: Response): Promise<void> {
    try {
      const data = await AdminService.getGlobalStats();
      sendSuccess(res, data);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch stats', 500);
    }
  }

  static async getOpsMetrics(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(50, Math.max(5, Number(req.query.limit) || 10));
      const snapshot = OpsMetricsService.snapshot(limit);
      sendSuccess(res, snapshot);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch ops metrics', 500);
    }
  }

  static async getAllGroups(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const search = req.query.search as string | undefined;

      const data = await AdminService.getAllGroups(page, limit, search);
      sendSuccess(res, data);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch groups', 500);
    }
  }

  static async deactivateGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupId = Number(req.params.id);
      if (!groupId) {
        sendError(res, 'INVALID_ID', 'Invalid group ID', 400);
        return;
      }

      await AdminService.deactivateGroup(groupId);
      sendSuccess(res, null, 'Group deactivated');
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to deactivate group', 500);
    }
  }

  static async updateMatch(req: Request, res: Response): Promise<void> {
    try {
      const matchId = Number(req.params.id);
      if (!matchId) {
        sendError(res, 'INVALID_ID', 'Invalid match ID', 400);
        return;
      }

      const { home_team, away_team, match_date } = req.body;
      await AdminService.updateMatch(matchId, { home_team, away_team, match_date });
      sendSuccess(res, null, 'Match updated');
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to update match', 500);
    }
  }

  static async getFootballDataMatches(req: Request, res: Response): Promise<void> {
    try {
      const competition = (req.query.competition as string) || 'PD';
      const matchday = Number(req.query.matchday);

      if (!matchday || matchday < 1) {
        sendError(res, 'INVALID_MATCHDAY', 'A valid matchday number is required', 400);
        return;
      }

      const matches = await FootballDataService.getMatches(competition, matchday);
      sendSuccess(res, matches);
    } catch (err: any) {
      sendError(res, 'FOOTBALL_DATA_ERROR', err.message || 'Failed to fetch matches from football-data.org', 500);
    }
  }

  static async getFootballDataResults(req: Request, res: Response): Promise<void> {
    try {
      const competition = (req.query.competition as string) || 'PD';
      const matchday = Number(req.query.matchday);

      if (!matchday || matchday < 1) {
        sendError(res, 'INVALID_MATCHDAY', 'A valid matchday number is required', 400);
        return;
      }

      const results = await FootballDataService.getResults(competition, matchday);
      sendSuccess(res, results);
    } catch (err: any) {
      sendError(res, 'FOOTBALL_DATA_ERROR', err.message || 'Failed to fetch results from football-data.org', 500);
    }
  }

  static async getFootballDataCurrentMatchday(req: Request, res: Response): Promise<void> {
    try {
      const competition = (req.query.competition as string) || 'PD';
      const matchday = await FootballDataService.getCurrentMatchday(competition);
      sendSuccess(res, { matchday });
    } catch (err: any) {
      sendError(res, 'FOOTBALL_DATA_ERROR', err.message || 'Failed to get current matchday', 500);
    }
  }

  static async getFootballDataCompetitions(req: Request, res: Response): Promise<void> {
    try {
      const competitions = await FootballDataService.getCompetitions();
      sendSuccess(res, competitions);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch competitions', 500);
    }
  }

  static async getQuinielaMatches(req: Request, res: Response): Promise<void> {
    try {
      const matches = await QuinielaScraper.getQuinielaMatches();
      if (matches.length === 0) {
        sendError(res, 'NO_MATCHES', 'No se pudieron obtener los partidos de La Quiniela', 404);
        return;
      }
      sendSuccess(res, matches);
    } catch (err: any) {
      sendError(res, 'SCRAPING_ERROR', err.message || 'Error al obtener partidos de La Quiniela', 500);
    }
  }

  static async reopenJornada(req: Request, res: Response): Promise<void> {
    try {
      const jornadaId = Number(req.params.id);
      if (!jornadaId) {
        sendError(res, 'INVALID_ID', 'Invalid jornada ID', 400);
        return;
      }

      await AdminService.reopenJornada(jornadaId);
      sendSuccess(res, null, 'Jornada reopened');
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to reopen jornada', 500);
    }
  }
}
