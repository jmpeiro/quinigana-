import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { parseId } from '../utils/parse-id.util';
import { parsePagination } from '../utils/pagination';

export class NotificationController {
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const { page, limit } = parsePagination(req.query);

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
