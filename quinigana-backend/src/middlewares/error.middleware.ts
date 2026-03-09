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
  const requestId = req.requestId;

  if (statusCode >= 500) {
    // Use the child logger (with requestId) when available, fall back to root logger
    const log = req.log || logger;
    log.error({ err, code, requestId }, 'Unhandled error');
  }

  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message: statusCode < 500 || process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred',
      ...(requestId ? { requestId } : {}),
    },
  };

  res.status(statusCode).json(response);
}
