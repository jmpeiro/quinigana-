import { Request, Response } from 'express';
import { InviteLinkModel } from '../models/invite-link.model';
import { GroupModel } from '../models/group.model';
import { sendSuccess, sendError } from '../utils/response.util';
import { parseId } from '../utils/parse-id.util';

export class InviteLinkController {
  static async generate(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      const userId = req.authUser!.userId;

      const isAdmin = await GroupModel.isAdmin(groupId, userId);
      if (!isAdmin) {
        sendError(res, 'NOT_ADMIN', 'Only group admins can generate invite links', 403);
        return;
      }

      const link = await InviteLinkModel.create(groupId, userId);
      sendSuccess(res, { token: link.token, expiresAt: link.expires_at }, 'Invite link generated', 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate invite link';
      sendError(res, 'INVITE_LINK_ERROR', message, 500);
    }
  }

  static async getInfo(req: Request, res: Response): Promise<void> {
    try {
      const token = String(req.params.token);
      const link = await InviteLinkModel.findByToken(token);

      if (!link) {
        sendError(res, 'LINK_NOT_FOUND', 'Invite link not found or expired', 404);
        return;
      }

      if (new Date(link.expires_at) < new Date()) {
        sendError(res, 'LINK_EXPIRED', 'This invite link has expired', 410);
        return;
      }

      if (link.max_uses > 0 && link.use_count >= link.max_uses) {
        sendError(res, 'LINK_EXHAUSTED', 'This invite link has reached its maximum uses', 410);
        return;
      }

      const group = await GroupModel.findById(link.group_id);
      if (!group) {
        sendError(res, 'GROUP_NOT_FOUND', 'Group not found', 404);
        return;
      }

      const members = await GroupModel.getMembers(link.group_id);

      sendSuccess(res, {
        groupName: group.name,
        groupDescription: group.description,
        memberCount: members.length,
        expiresAt: link.expires_at,
      });
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch invite link info', 500);
    }
  }

  static async accept(req: Request, res: Response): Promise<void> {
    try {
      const token = String(req.params.token);
      const userId = req.authUser!.userId;

      const link = await InviteLinkModel.findByToken(token);

      if (!link) {
        sendError(res, 'LINK_NOT_FOUND', 'Invite link not found or expired', 404);
        return;
      }

      if (new Date(link.expires_at) < new Date()) {
        sendError(res, 'LINK_EXPIRED', 'This invite link has expired', 410);
        return;
      }

      if (link.max_uses > 0 && link.use_count >= link.max_uses) {
        sendError(res, 'LINK_EXHAUSTED', 'This invite link has reached its maximum uses', 410);
        return;
      }

      const isMember = await GroupModel.isMember(link.group_id, userId);
      if (isMember) {
        sendError(res, 'ALREADY_MEMBER', 'You are already a member of this group', 409);
        return;
      }

      await GroupModel.addMember(link.group_id, userId, 'member');
      await InviteLinkModel.incrementUseCount(link.id);

      sendSuccess(res, { groupId: link.group_id }, 'Successfully joined group');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to accept invite';
      sendError(res, 'ACCEPT_INVITE_ERROR', message, 500);
    }
  }
}
