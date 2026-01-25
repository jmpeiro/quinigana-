import webPush from 'web-push';
import { env } from '../config/environment';
import { PushSubscriptionModel, PushSubscriptionRecord } from '../models/push-subscription.model';
import logger from '../config/logger';

if (env.webPush.publicKey && env.webPush.privateKey) {
  webPush.setVapidDetails(
    env.webPush.subject,
    env.webPush.publicKey,
    env.webPush.privateKey
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export class WebPushService {
  static async sendToUsers(userIds: number[], payload: PushPayload): Promise<void> {
    if (!env.webPush.publicKey || !env.webPush.privateKey) {
      return;
    }

    try {
      const subscriptions = await PushSubscriptionModel.findByUserIds(userIds);
      if (subscriptions.length === 0) return;

      const angularPayload = JSON.stringify({
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          data: { url: payload.url || '/' },
          tag: payload.tag,
        },
      });

      await Promise.allSettled(
        subscriptions.map(sub => this.sendToSubscription(sub, angularPayload))
      );
    } catch (error) {
      logger.error({ error }, 'Error sending push notifications');
    }
  }

  static async sendToUser(userId: number, payload: PushPayload): Promise<void> {
    return this.sendToUsers([userId], payload);
  }

  private static async sendToSubscription(sub: PushSubscriptionRecord, payload: string): Promise<void> {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 86400 }
      );
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await PushSubscriptionModel.deleteByEndpoint(sub.endpoint);
      }
    }
  }
}
