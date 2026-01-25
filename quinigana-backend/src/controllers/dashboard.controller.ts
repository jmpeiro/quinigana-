import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { FootballDataService } from '../services/football-data.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class DashboardController {
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const data = await DashboardService.getDashboardData(userId);
      sendSuccess(res, data);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to load dashboard', 500);
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
      console.error('Standings error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Failed to load standings', 500);
    }
  }
}
