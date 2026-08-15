import { Request, Response, NextFunction } from 'express';
import { GroupModel } from '../models/group.model';
import { sendError } from '../utils/response.util';
import { parseId } from '../utils/parse-id.util';
import logger from '../config/logger';

export function groupMemberMiddleware(req: Request, res: Response, next: NextFunction): void {
  let groupId: number;
  try {
    // groupId is the explicit name and must win: nested routes like
    // /:groupId/proposals/:id/comments also define :id, which is the proposal.
    groupId = parseId(req.params.groupId || req.params.id);
  } catch {
    sendError(res, 'INVALID_GROUP_ID', 'Invalid group ID', 400);
    return;
  }
  const userId = req.authUser!.userId;

  GroupModel.isMember(groupId, userId).then(isMember => {
    if (!isMember) {
      sendError(res, 'NOT_GROUP_MEMBER', 'You are not a member of this group', 403);
      return;
    }
    next();
  }).catch((error) => {
    logger.error({ error }, 'Error checking group membership');
    sendError(res, 'INTERNAL_ERROR', 'Failed to verify group membership', 500);
  });
}

export function groupAdminMiddleware(req: Request, res: Response, next: NextFunction): void {
  let groupId: number;
  try {
    // groupId is the explicit name and must win: nested routes like
    // /:groupId/proposals/:id/comments also define :id, which is the proposal.
    groupId = parseId(req.params.groupId || req.params.id);
  } catch {
    sendError(res, 'INVALID_GROUP_ID', 'Invalid group ID', 400);
    return;
  }
  const userId = req.authUser!.userId;

  GroupModel.isAdmin(groupId, userId).then(isAdmin => {
    if (!isAdmin) {
      sendError(res, 'NOT_GROUP_ADMIN', 'Only group admins can perform this action', 403);
      return;
    }
    next();
  }).catch(() => {
    sendError(res, 'INTERNAL_ERROR', 'Failed to verify group role', 500);
  });
}
