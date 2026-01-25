import { Request, Response } from 'express';
import { GroupService } from '../services/group.service';
import { GroupModel } from '../models/group.model';
import { UserModel } from '../models/user.model';
import { NotificationService } from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { parseId } from '../utils/parse-id.util';

export class InvitationController {
  static async invite(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      const invitedBy = req.authUser!.userId;
      const { user_id } = req.body;
      await GroupService.inviteUser(groupId, invitedBy, user_id);

      // Notify invited user (fire-and-forget)
      Promise.all([GroupModel.findById(groupId), UserModel.findById(invitedBy)]).then(([group, inviter]) => {
        if (group && inviter) {
          const inviterName = `${inviter.first_name} ${inviter.last_name || ''}`.trim();
          NotificationService.notifyInvitationReceived(group.name, inviterName, user_id).catch(() => {});
        }
      });

      sendSuccess(res, null, 'Invitation sent', 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to invite user';
      sendError(res, 'INVITE_ERROR', message, 400);
    }
  }

  static async getPending(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const invitations = await GroupService.getPendingInvitations(userId);
      sendSuccess(res, invitations);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch invitations', 500);
    }
  }

  static async accept(req: Request, res: Response): Promise<void> {
    try {
      const invitationId = parseId(req.params.id);
      const userId = req.authUser!.userId;
      await GroupService.acceptInvitation(invitationId, userId);
      sendSuccess(res, null, 'Invitation accepted');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to accept invitation';
      sendError(res, 'ACCEPT_ERROR', message, 400);
    }
  }

  static async reject(req: Request, res: Response): Promise<void> {
    try {
      const invitationId = parseId(req.params.id);
      const userId = req.authUser!.userId;
      await GroupService.rejectInvitation(invitationId, userId);
      sendSuccess(res, null, 'Invitation rejected');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reject invitation';
      sendError(res, 'REJECT_ERROR', message, 400);
    }
  }
}
