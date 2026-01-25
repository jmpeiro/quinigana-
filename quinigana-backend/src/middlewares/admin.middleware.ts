import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/user.model';
import { sendError } from '../utils/response.util';

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const userId = req.authUser!.userId;

  UserModel.findById(userId).then(user => {
    if (!user || !(user as unknown as { is_admin: boolean }).is_admin) {
      sendError(res, 'FORBIDDEN', 'Admin access required', 403);
      return;
    }
    next();
  }).catch(() => {
    sendError(res, 'INTERNAL_ERROR', 'Failed to verify admin status', 500);
  });
}
