import { Request, Response } from 'express';
import { PushSubscriptionModel } from '../models/push-subscription.model';
import { sendSuccess, sendError } from '../utils/response.util';
import { env } from '../config/environment';

export class PushSubscriptionController {
  static async getVapidPublicKey(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, { publicKey: env.webPush.publicKey });
  }

  static async subscribe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const { endpoint, keys, userAgent } = req.body;

      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        sendError(res, 'INVALID_SUBSCRIPTION', 'Invalid push subscription data', 400);
        return;
      }

      await PushSubscriptionModel.upsert({
        user_id: userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent || null,
      });

      sendSuccess(res, { message: 'Subscription registered' });
    } catch (err: any) {
      sendError(res, err.code || 'SUBSCRIBE_ERROR', err.message || 'Error subscribing', err.statusCode || 500);
    }
  }

  static async unsubscribe(req: Request, res: Response): Promise<void> {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        sendError(res, 'MISSING_ENDPOINT', 'Endpoint is required', 400);
        return;
      }

      await PushSubscriptionModel.deleteByEndpoint(endpoint);
      sendSuccess(res, { message: 'Subscription removed' });
    } catch (err: any) {
      sendError(res, err.code || 'UNSUBSCRIBE_ERROR', err.message || 'Error unsubscribing', err.statusCode || 500);
    }
  }

  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const subscribed = await PushSubscriptionModel.hasSubscriptions(userId);
      sendSuccess(res, { subscribed });
    } catch (err: any) {
      sendError(res, err.code || 'STATUS_ERROR', err.message || 'Error checking status', err.statusCode || 500);
    }
  }
}
