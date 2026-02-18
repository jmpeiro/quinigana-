import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import logger from '../config/logger';

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  if (statusCode >= 500) {
    logger.error({ err, code, requestId: req.requestId }, 'Unhandled error');
  }

  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message: statusCode < 500 || process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred',
      details: req.requestId ? [{ requestId: req.requestId }] : undefined,
    },
  };

  res.status(statusCode).json(response);
}
