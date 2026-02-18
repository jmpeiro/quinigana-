import { NotificationModel } from '../models/notification.model';
import { EmailService } from './email.service';
import { WebPushService } from './web-push.service';
import { CreateNotificationDto, Notification, NotificationType, PaginatedResponse } from '../types';

export class NotificationService {
  static async getNotifications(userId: number, page: number, limit: number): Promise<PaginatedResponse<Notification>> {
    const { items, total } = await NotificationModel.findByUser(userId, page, limit);
    const normalizedItems = items.map((item) => ({
      ...item,
      actionType: item.action_type || null,
      actionTarget: item.action_type
        ? {
            groupId: item.action_group_id || undefined,
            jornadaId: item.action_jornada_id || undefined,
            proposalId: item.action_proposal_id || undefined,
            challengeId: item.action_challenge_id || undefined,
          }
        : null,
    }));
    return {
      items: normalizedItems as unknown as Notification[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getUnreadCount(userId: number): Promise<number> {
    return NotificationModel.getUnreadCount(userId);
  }

  static async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    return NotificationModel.markAsRead(notificationId, userId);
  }

  static async markAllAsRead(userId: number): Promise<void> {
    return NotificationModel.markAllAsRead(userId);
  }

  // Generic notification method
  static async notify(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    link?: string
  ): Promise<void> {
    const notification: CreateNotificationDto = {
      user_id: userId,
      type,
      title,
      message,
      link,
    };

    await NotificationModel.create(notification);

    WebPushService.sendToUser(userId, {
      title,
      body: message,
      url: link || '/',
      tag: type,
    }).catch(() => {});
  }

  static async notifyNewJornada(jornadaName: string, userIds: number[]): Promise<void> {
    const notifications: CreateNotificationDto[] = userIds.map(user_id => ({
      user_id,
      type: 'new_jornada' as const,
      title: 'Nueva jornada disponible',
      message: `La jornada "${jornadaName}" ya esta abierta. Crea una propuesta con tu grupo!`,
      link: '/quiniela/jornadas',
      actionType: 'open_jornada',
    }));

    await NotificationModel.createBulk(notifications);

    WebPushService.sendToUsers(userIds, {
      title: 'Nueva jornada disponible',
      body: `La jornada "${jornadaName}" ya esta abierta. Crea una propuesta con tu grupo!`,
      url: '/quiniela/jornadas',
      tag: 'new_jornada',
    }).catch(() => {});
  }

  static async notifyProposalSubmitted(
    groupName: string,
    proposerName: string,
    memberUserIds: number[],
    groupId: number,
    proposalId: number
  ): Promise<void> {
    const notifications: CreateNotificationDto[] = memberUserIds.map(user_id => ({
      user_id,
      type: 'proposal_submitted' as const,
      title: 'Nueva propuesta para votar',
      message: `${proposerName} ha enviado una propuesta en "${groupName}". Vota ahora!`,
      link: `/quiniela/groups/${groupId}/proposals/${proposalId}`,
      actionType: 'open_proposal',
      actionTarget: { groupId, proposalId },
    }));

    await NotificationModel.createBulk(notifications);

    WebPushService.sendToUsers(memberUserIds, {
      title: 'Nueva propuesta para votar',
      body: `${proposerName} ha enviado una propuesta en "${groupName}". Vota ahora!`,
      url: `/quiniela/groups/${groupId}/proposals/${proposalId}`,
      tag: 'proposal_submitted',
    }).catch(() => {});
  }

  static async notifyResultsPublished(jornadaName: string, userIds: number[]): Promise<void> {
    const notifications: CreateNotificationDto[] = userIds.map(user_id => ({
      user_id,
      type: 'results_published' as const,
      title: 'Resultados publicados',
      message: `Los resultados de "${jornadaName}" han sido publicados. Revisa tus puntuaciones!`,
      link: '/dashboard',
      actionType: 'open_jornada',
    }));

    await NotificationModel.createBulk(notifications);

    // Send email notification for results (important event)
    try {
      for (const userId of userIds) {
        await EmailService.sendNotificationEmail(
          userId,
          'Resultados publicados',
          `Los resultados de "${jornadaName}" han sido publicados. Revisa tus puntuaciones en QuiniGana.`
        );
      }
    } catch {
      // Email failures should not block the notification
    }

    WebPushService.sendToUsers(userIds, {
      title: 'Resultados publicados',
      body: `Los resultados de "${jornadaName}" han sido publicados. Revisa tus puntuaciones!`,
      url: '/dashboard',
      tag: 'results_published',
    }).catch(() => {});
  }

  static async notifyInvitationReceived(
    groupName: string,
    inviterName: string,
    invitedUserId: number
  ): Promise<void> {
    const notification: CreateNotificationDto = {
      user_id: invitedUserId,
      type: 'invitation_received' as const,
      title: 'Invitacion a grupo',
      message: `${inviterName} te ha invitado a unirte a "${groupName}".`,
      link: '/groups/invitations',
      actionType: 'open_invite',
    };

    await NotificationModel.create(notification);

    WebPushService.sendToUser(invitedUserId, {
      title: 'Invitacion a grupo',
      body: `${inviterName} te ha invitado a unirte a "${groupName}".`,
      url: '/groups/invitations',
      tag: 'invitation_received',
    }).catch(() => {});
  }

  // Challenge notifications
  static async notifyChallengeReceived(
    challengedUserId: number,
    challengerUserId: number,
    jornadaName: string
  ): Promise<void> {
    // Get challenger name from DB
    const pool = (await import('../config/database')).default;
    const [rows] = await pool.execute<import('mysql2').RowDataPacket[]>(
      'SELECT first_name FROM users WHERE id = ?',
      [challengerUserId]
    );
    const challengerName = rows.length > 0 ? (rows[0] as { first_name: string }).first_name : 'Alguien';

    const notification: CreateNotificationDto = {
      user_id: challengedUserId,
      type: 'challenge_received' as const,
      title: 'Nuevo reto 1vs1',
      message: `${challengerName} te ha retado en la ${jornadaName}!`,
      link: '/challenges',
      actionType: 'open_challenge',
    };

    await NotificationModel.create(notification);

    WebPushService.sendToUser(challengedUserId, {
      title: 'Nuevo reto 1vs1',
      body: `${challengerName} te ha retado en la ${jornadaName}!`,
      url: '/challenges',
      tag: 'challenge_received',
    }).catch(() => {});
  }

  static async notifyChallengeAccepted(
    challengerUserId: number,
    challengedUserId: number,
    jornadaName: string
  ): Promise<void> {
    const pool = (await import('../config/database')).default;
    const [rows] = await pool.execute<import('mysql2').RowDataPacket[]>(
      'SELECT first_name FROM users WHERE id = ?',
      [challengedUserId]
    );
    const challengedName = rows.length > 0 ? (rows[0] as { first_name: string }).first_name : 'Tu rival';

    const notification: CreateNotificationDto = {
      user_id: challengerUserId,
      type: 'challenge_accepted' as const,
      title: 'Reto aceptado',
      message: `${challengedName} ha aceptado tu reto en la ${jornadaName}!`,
      link: '/challenges',
      actionType: 'open_challenge',
    };

    await NotificationModel.create(notification);

    WebPushService.sendToUser(challengerUserId, {
      title: 'Reto aceptado',
      body: `${challengedName} ha aceptado tu reto en la ${jornadaName}!`,
      url: '/challenges',
      tag: 'challenge_accepted',
    }).catch(() => {});
  }

  static async notifyChallengeResult(
    userId: number,
    opponentName: string,
    jornadaName: string,
    isWinner: boolean,
    isDraw: boolean,
    pointsChange: number
  ): Promise<void> {
    let title: string;
    let message: string;

    if (isDraw) {
      title = 'Empate en reto';
      message = `Tu reto con ${opponentName} en ${jornadaName} termino en empate.`;
    } else if (isWinner) {
      title = 'Ganaste el reto!';
      message = `Venciste a ${opponentName} en ${jornadaName}! +${pointsChange} puntos de reputacion.`;
    } else {
      title = 'Perdiste el reto';
      message = `${opponentName} te vencio en ${jornadaName}. -${pointsChange} puntos de reputacion.`;
    }

    const notification: CreateNotificationDto = {
      user_id: userId,
      type: 'challenge_result' as const,
      title,
      message,
      link: '/challenges',
      actionType: 'open_challenge',
    };

    await NotificationModel.create(notification);

    WebPushService.sendToUser(userId, {
      title,
      body: message,
      url: '/challenges',
      tag: 'challenge_result',
    }).catch(() => {});
  }
}
