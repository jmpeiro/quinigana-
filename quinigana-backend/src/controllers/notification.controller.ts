import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { parseId } from '../utils/parse-id.util';

export class NotificationController {
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

      const data = await NotificationService.getNotifications(userId, page, limit);
      sendSuccess(res, data);
    } catch (err: any) {
      sendError(res, err.code || 'FETCH_ERROR', err.message || 'Error fetching notifications', err.statusCode || 500);
    }
  }

  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const count = await NotificationService.getUnreadCount(userId);
      sendSuccess(res, { count });
    } catch (err: any) {
      sendError(res, err.code || 'FETCH_ERROR', err.message || 'Error fetching unread count', err.statusCode || 500);
    }
  }

  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const notificationId = parseId(req.params.id);
      const success = await NotificationService.markAsRead(notificationId, userId);
      if (!success) {
        sendError(res, 'NOT_FOUND', 'Notification not found', 404);
        return;
      }

      sendSuccess(res, null);
    } catch (err: any) {
      sendError(res, err.code || 'UPDATE_ERROR', err.message || 'Error marking as read', err.statusCode || 500);
    }
  }

  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      await NotificationService.markAllAsRead(userId);
      sendSuccess(res, null);
    } catch (err: any) {
      sendError(res, err.code || 'UPDATE_ERROR', err.message || 'Error marking all as read', err.statusCode || 500);
    }
  }
}
