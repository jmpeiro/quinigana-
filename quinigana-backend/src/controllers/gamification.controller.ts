import { Request, Response } from 'express';
import { GamificationService } from '../services/gamification.service';
import { GamificationModel } from '../models/gamification.model';
import { sendSuccess, sendError } from '../utils/response.util';

export class GamificationController {
  static async getMyGamification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const data = await GamificationService.getUserGamification(userId);
      sendSuccess(res, data);
    } catch (err: any) {
      sendError(res, err.code || 'GAMIFICATION_ERROR', err.message || 'Error fetching gamification data', err.statusCode || 500);
    }
  }

  static async getAllBadges(req: Request, res: Response): Promise<void> {
    try {
      const badges = await GamificationModel.getAllBadgeDefinitions();
      sendSuccess(res, badges);
    } catch (err: any) {
      sendError(res, err.code || 'BADGES_ERROR', err.message || 'Error fetching badges', err.statusCode || 500);
    }
  }

  static async markBadgesSeen(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      await GamificationModel.markAllSeen(userId);
      sendSuccess(res, null, 'Badges marked as seen');
    } catch (err: any) {
      sendError(res, err.code || 'BADGES_SEEN_ERROR', err.message || 'Error marking badges as seen', err.statusCode || 500);
    }
  }
}
