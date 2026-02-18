import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { FootballDataService } from '../services/football-data.service';
import { ApiFootballService } from '../services/api-football.service';
import { env } from '../config/environment';
import { sendSuccess, sendError } from '../utils/response.util';

export class DashboardController {
  private static toErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  static async getDashboard(req: Request, res: Response): Promise<void> {
    console.log('=== DASHBOARD CALLED ===');
    console.log('Request received at:', new Date().toISOString());
    console.log('User ID:', req.authUser?.userId);

    try {
      const userId = req.authUser!.userId;
      console.log('[DASHBOARD] Loading dashboard for user:', userId);

      // Import pool to test database connection first
      const pool = (await import('../config/database')).default;
      console.log('[DASHBOARD] Database pool imported successfully');

      // Test simple query first
      console.log('[DASHBOARD] Testing database connection...');
      await pool.execute('SELECT 1');
      console.log('[DASHBOARD] Database connection OK');

      console.log('[DASHBOARD] Calling DashboardService.getDashboardData...');
      const data = await DashboardService.getDashboardData(userId);
      console.log('[DASHBOARD] Dashboard data loaded successfully:', {
        hasActiveJornada: !!data.activeJornada,
        groupsCount: data.myGroups.length,
        latestResultsCount: data.latestResults.length,
      });
      sendSuccess(res, data);
    } catch (error) {
      console.error('[DASHBOARD] !!!!! ERROR !!!!!');
      console.error('[DASHBOARD] Error type:', error?.constructor?.name);
      console.error('[DASHBOARD] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[DASHBOARD] Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('[DASHBOARD] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

      // Send detailed error in response for debugging (ONLY FOR DEBUGGING - REMOVE IN PRODUCTION)
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 10).join('\n') : undefined,
        type: error?.constructor?.name,
        code: (error as any)?.code,
        errno: (error as any)?.errno,
        sqlState: (error as any)?.sqlState,
        sqlMessage: (error as any)?.sqlMessage,
      };

      sendError(res, 'INTERNAL_ERROR', `Dashboard error: ${JSON.stringify(errorDetails, null, 2)}`, 500);
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
        console.warn('[STANDINGS] API-Football failed, falling back:', apiFootballError);
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
      console.error('[STANDINGS] Error loading standings (will return empty):', err);
      const hasAnyProviderKey = Boolean(env.apiFootball.apiKey || env.footballData.apiKey);
      const message = hasAnyProviderKey
        ? 'Proveedor de clasificación temporalmente no disponible'
        : 'Falta configurar API_FOOTBALL_KEY en backend';
      // Return empty array instead of 500 to avoid breaking dashboard UI.
      sendSuccess(res, [], message);
    }
  }

  static async getStandingsDebug(req: Request, res: Response): Promise<void> {
    const division = req.query.division as 'primera' | 'segunda' || 'primera';
    const competitionCode = division === 'primera' ? 'PD' : 'SD';

    const result: {
      division: 'primera' | 'segunda';
      config: {
        apiFootballKeyConfigured: boolean;
        footballDataKeyConfigured: boolean;
      };
      providers: {
        apiFootball: { ok: boolean; count: number; error?: string };
        footballData: { ok: boolean; count: number; error?: string };
      };
    } = {
      division,
      config: {
        apiFootballKeyConfigured: Boolean(env.apiFootball.apiKey),
        footballDataKeyConfigured: Boolean(env.footballData.apiKey),
      },
      providers: {
        apiFootball: { ok: false, count: 0 },
        footballData: { ok: false, count: 0 },
      },
    };

    try {
      const data = await ApiFootballService.getStandings(division);
      result.providers.apiFootball = { ok: data.length > 0, count: data.length };
    } catch (error) {
      result.providers.apiFootball = {
        ok: false,
        count: 0,
        error: DashboardController.toErrorMessage(error),
      };
    }

    try {
      const data = await FootballDataService.getStandings(competitionCode);
      result.providers.footballData = { ok: data.length > 0, count: data.length };
    } catch (error) {
      result.providers.footballData = {
        ok: false,
        count: 0,
        error: DashboardController.toErrorMessage(error),
      };
    }

    sendSuccess(res, result);
  }

  static async testDb(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      console.log('[DB TEST] Testing database connection for user:', userId);

      // Import pool directly
      const pool = (await import('../config/database')).default;

      // Test simple query
      console.log('[DB TEST] Executing test query...');
      const [rows] = await pool.execute('SELECT 1 + 1 AS result');
      console.log('[DB TEST] Test query successful:', rows);

      // Test user query
      console.log('[DB TEST] Fetching user data...');
      const [userRows] = await pool.execute('SELECT id, email, first_name FROM users WHERE id = ?', [userId]);
      console.log('[DB TEST] User data:', userRows);

      sendSuccess(res, {
        message: 'Database connection successful',
        userId,
        testResult: rows,
        userData: userRows,
      });
    } catch (error) {
      console.error('[DB TEST] Database test failed:', error);
      console.error('[DB TEST] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any).code,
        errno: (error as any).errno,
        sqlState: (error as any).sqlState,
        sqlMessage: (error as any).sqlMessage,
      });
      sendError(res, 'INTERNAL_ERROR', `Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }
}
