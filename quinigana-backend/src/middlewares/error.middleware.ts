import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import logger from '../config/logger';

export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  if (statusCode >= 500) {
    logger.error({ err, code }, 'Unhandled error');
  }

  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message: statusCode < 500 || process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred',
    },
  };

  res.status(statusCode).json(response);
}
