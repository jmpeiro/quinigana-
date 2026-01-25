import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { sendError } from '../utils/response.util';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHORIZED', 'Access token is required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.authUser = decoded;
    next();
  } catch {
    sendError(res, 'INVALID_TOKEN', 'Invalid or expired access token', 401);
  }
}
