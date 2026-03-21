import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { FootballDataService } from '../services/football-data.service';
import { ApiFootballService } from '../services/api-football.service';
import { env } from '../config/environment';
import { sendSuccess, sendError } from '../utils/response.util';
import logger from '../config/logger';

export class DashboardController {
  private static toErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const data = await DashboardService.getDashboardData(userId);
      sendSuccess(res, data);
    } catch (error) {
      logger.error({ error, userId: req.authUser?.userId }, 'Error loading dashboard');
      sendError(res, 'INTERNAL_ERROR', 'Error al cargar el dashboard', 500);
    }
  }

  static async getStandings(req: Request, res: Response): Promise<void> {
    try {
      const division = req.query.division as 'primera' | 'segunda' || 'primera';
      const debug = req.query.debug === '1';
      const diagnostics: string[] = [];

      // Primary provider: API-Football
      try {
        const standings = await ApiFootballService.getStandings(division);
        if (standings.length > 0) {
          sendSuccess(res, standings, debug ? 'provider=api-football' : undefined);
          return;
        }
        diagnostics.push('api-football:empty');
      } catch (apiFootballError) {
        logger.warn({ error: apiFootballError }, 'API-Football failed, falling back');
        diagnostics.push(`api-football:error:${DashboardController.toErrorMessage(apiFootballError)}`);
      }

      // Fallback provider: football-data/scraper chain
      const competitionCode = division === 'primera' ? 'PD' : 'SD';
      let fallbackStandings: Awaited<ReturnType<typeof FootballDataService.getStandings>> = [];
      try {
        fallbackStandings = await FootballDataService.getStandings(competitionCode);
      } catch (fallbackError) {
        diagnostics.push(`football-data:error:${DashboardController.toErrorMessage(fallbackError)}`);
      }

      if (fallbackStandings.length === 0) {
        const message = debug
          ? `provider=none; ${diagnostics.join(' | ')}`
          : 'Proveedor de clasificación sin datos en este momento';
        sendSuccess(res, fallbackStandings, message);
        return;
      }

      sendSuccess(res, fallbackStandings, debug ? 'provider=football-data' : undefined);
    } catch (err) {
      logger.error({ error: err }, 'Error loading standings');
      const hasAnyProviderKey = Boolean(env.apiFootball.apiKey || env.footballData.apiKey);
      const message = hasAnyProviderKey
        ? 'Proveedor de clasificación temporalmente no disponible'
        : 'Falta configurar API_FOOTBALL_KEY en backend';
      sendSuccess(res, [], message);
    }
  }
}
