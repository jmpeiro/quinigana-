import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { FootballDataService } from '../services/football-data.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class DashboardController {
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
      // Map division to football-data.org competition code
      // PD = Primera Division (La Liga), SD = Segunda Division
      const competitionCode = division === 'primera' ? 'PD' : 'SD';
      const standings = await FootballDataService.getStandings(competitionCode);
      sendSuccess(res, standings);
    } catch (err) {
      console.error('[STANDINGS] Error loading standings (will return empty):', err);
      // Return empty array instead of error 500 to not break dashboard
      sendSuccess(res, []);
    }
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
