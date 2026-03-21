import { Request, Response } from 'express';
import { LeagueModel } from '../models/league.model';
import { LeagueService } from '../services/league.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { parsePagination } from '../utils/pagination';
import logger from '../config/logger';

export class LeagueController {
  // Get all divisions
  static async getDivisions(req: Request, res: Response): Promise<void> {
    try {
      const divisions = await LeagueModel.getAllDivisions();
      sendSuccess(res, divisions);
    } catch (err) {
      logger.error({ error: err }, 'Get divisions error');
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener divisiones', 500);
    }
  }

  // Get active season info
  static async getActiveSeason(req: Request, res: Response): Promise<void> {
    try {
      const season = await LeagueModel.getActiveSeason();
      if (!season) {
        sendError(res, 'NOT_FOUND', 'No hay temporada activa', 404);
        return;
      }
      sendSuccess(res, season);
    } catch (err) {
      logger.error({ error: err }, 'Get active season error');
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener temporada', 500);
    }
  }

  // Get current user's league profile
  static async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const profile = await LeagueModel.getUserLeagueProfile(userId);

      if (!profile) {
        // User not in any league yet - try to add them
        const season = await LeagueModel.getActiveSeason();
        if (season) {
          await LeagueModel.ensureUserInSeason(userId, season.id);
          const newProfile = await LeagueModel.getUserLeagueProfile(userId);
          sendSuccess(res, newProfile);
          return;
        }
        sendError(res, 'NOT_FOUND', 'No hay temporada activa', 404);
        return;
      }

      sendSuccess(res, profile);
    } catch (err) {
      logger.error({ error: err }, 'Get my league profile error');
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener perfil de liga', 500);
    }
  }

  // Get standings for a specific division
  static async getDivisionStandings(req: Request, res: Response): Promise<void> {
    try {
      const divisionId = parseInt(req.params.divisionId as string);
      const { page, limit } = parsePagination(req.query);
      const offset = (page - 1) * limit;

      const season = await LeagueModel.getActiveSeason();
      if (!season) {
        sendError(res, 'NOT_FOUND', 'No hay temporada activa', 404);
        return;
      }

      const division = await LeagueModel.getDivisionById(divisionId);
      if (!division) {
        sendError(res, 'NOT_FOUND', 'Division no encontrada', 404);
        return;
      }

      const { standings, total } = await LeagueModel.getDivisionStandings(
        season.id,
        divisionId,
        limit,
        offset
      );

      sendSuccess(res, {
        division,
        items: standings,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      logger.error({ error: err }, 'Get division standings error');
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener clasificacion', 500);
    }
  }

  // Get user's league history
  static async getMyHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const history = await LeagueModel.getUserHistory(userId);
      sendSuccess(res, history);
    } catch (err) {
      logger.error({ error: err }, 'Get league history error');
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener historial', 500);
    }
  }

  // Admin: Create a new league season
  static async createSeason(req: Request, res: Response): Promise<void> {
    try {
      const { name, season_id, start_jornada_id, end_jornada_id } = req.body;

      if (!name || !season_id) {
        sendError(res, 'VALIDATION_ERROR', 'Nombre y temporada son requeridos', 400);
        return;
      }

      const id = await LeagueModel.createSeason(
        name,
        season_id,
        start_jornada_id,
        end_jornada_id
      );

      const season = await LeagueModel.getSeasonById(id);
      sendSuccess(res, season, 'Temporada de liga creada', 201);
    } catch (err) {
      logger.error({ error: err }, 'Create league season error');
      sendError(res, 'INTERNAL_ERROR', 'Error al crear temporada', 500);
    }
  }

  // Admin: Activate a season
  static async activateSeason(req: Request, res: Response): Promise<void> {
    try {
      const seasonId = parseInt(req.params.seasonId as string);

      const season = await LeagueModel.getSeasonById(seasonId);
      if (!season) {
        sendError(res, 'NOT_FOUND', 'Temporada no encontrada', 404);
        return;
      }

      // Deactivate current active season if any
      const currentActive = await LeagueModel.getActiveSeason();
      if (currentActive) {
        await LeagueModel.updateSeasonStatus(currentActive.id, 'completed');
      }

      await LeagueModel.updateSeasonStatus(seasonId, 'active');
      sendSuccess(res, { message: 'Temporada activada' });
    } catch (err) {
      logger.error({ error: err }, 'Activate season error');
      sendError(res, 'INTERNAL_ERROR', 'Error al activar temporada', 500);
    }
  }

  // Admin: End season and process promotions/relegations
  static async endSeason(req: Request, res: Response): Promise<void> {
    try {
      const seasonId = parseInt(req.params.seasonId as string);

      const season = await LeagueModel.getSeasonById(seasonId);
      if (!season) {
        sendError(res, 'NOT_FOUND', 'Temporada no encontrada', 404);
        return;
      }

      if (season.status !== 'active') {
        sendError(res, 'VALIDATION_ERROR', 'Solo se pueden finalizar temporadas activas', 400);
        return;
      }

      // Process promotions/relegations + mark completed inside a transaction
      await LeagueService.processSeasonEnd(seasonId);

      sendSuccess(res, { message: 'Temporada finalizada, ascensos/descensos procesados' });
    } catch (err) {
      logger.error({ error: err }, 'End season error');
      sendError(res, 'INTERNAL_ERROR', 'Error al finalizar temporada', 500);
    }
  }

  // Admin: Initialize new season from previous
  static async initializeFromPrevious(req: Request, res: Response): Promise<void> {
    try {
      const newSeasonId = parseInt(req.params.newSeasonId as string);
      const previousSeasonId = parseInt(req.params.previousSeasonId as string);

      const newSeason = await LeagueModel.getSeasonById(newSeasonId);
      const previousSeason = await LeagueModel.getSeasonById(previousSeasonId);

      if (!newSeason || !previousSeason) {
        sendError(res, 'NOT_FOUND', 'Temporada no encontrada', 404);
        return;
      }

      await LeagueModel.initializeNewSeason(newSeasonId, previousSeasonId);
      sendSuccess(res, { message: 'Temporada inicializada con datos de la anterior' });
    } catch (err) {
      logger.error({ error: err }, 'Initialize season error');
      sendError(res, 'INTERNAL_ERROR', 'Error al inicializar temporada', 500);
    }
  }
}
