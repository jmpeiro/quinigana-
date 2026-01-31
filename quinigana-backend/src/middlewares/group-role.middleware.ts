import { Request, Response, NextFunction } from 'express';
import { GroupModel } from '../models/group.model';
import { sendError } from '../utils/response.util';
import { parseId } from '../utils/parse-id.util';

export function groupMemberMiddleware(req: Request, res: Response, next: NextFunction): void {
  let groupId: number;
  try {
    groupId = parseId(req.params.id || req.params.groupId);
  } catch {
    sendError(res, 'INVALID_GROUP_ID', 'Invalid group ID', 400);
    return;
  }
  const userId = req.authUser!.userId;

  console.log('[GROUP MEMBER MIDDLEWARE] Checking membership:', {
    groupId,
    userId,
    paramId: req.params.id,
    paramGroupId: req.params.groupId,
    url: req.url,
    path: req.path,
  });

  GroupModel.isMember(groupId, userId).then(isMember => {
    console.log('[GROUP MEMBER MIDDLEWARE] isMember result:', isMember);
    if (!isMember) {
      console.log('[GROUP MEMBER MIDDLEWARE] Access denied - not a member');
      sendError(res, 'NOT_GROUP_MEMBER', 'You are not a member of this group', 403);
      return;
    }
    console.log('[GROUP MEMBER MIDDLEWARE] Access granted - user is member');
    next();
  }).catch((error) => {
    console.error('[GROUP MEMBER MIDDLEWARE] Error checking membership:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to verify group membership', 500);
  });
}

export function groupAdminMiddleware(req: Request, res: Response, next: NextFunction): void {
  let groupId: number;
  try {
    groupId = parseId(req.params.id || req.params.groupId);
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
