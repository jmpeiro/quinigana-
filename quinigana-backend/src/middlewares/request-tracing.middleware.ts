import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';

/**
 * Request tracing middleware.
 *
 * - Reads an incoming `X-Request-Id` header or generates a UUID v4.
 * - Attaches the id to `req.requestId` and sets the `X-Request-Id` response header.
 * - Creates a child Pino logger with the requestId bound so every downstream
 *   log line includes it automatically.
 */
export function requestTracingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId =
    (req.headers['x-request-id'] as string | undefined) || uuidv4();

  // Attach to request object for downstream access
  req.requestId = requestId;

  // Echo the id back in every response
  res.setHeader('X-Request-Id', requestId);

  // Create a child logger with the requestId in its context
  req.log = logger.child({ requestId });

  next();
}
