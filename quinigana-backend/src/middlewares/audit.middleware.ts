import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';

/**
 * Audit logging middleware for admin actions.
 * Captures the action, entity, and details of all admin route requests
 * and persists them to the admin_audit_log table (migration 019).
 * Includes request_id for tracing (migration 022).
 */
export function auditMiddleware(action: string, entity: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original json method to intercept response
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Only log if the request was successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.authUser?.userId;
        const entityId = parseInt(req.params.id as string) || null;
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const requestId = (req as any).requestId || null;

        const details = {
          method: req.method,
          path: req.originalUrl,
          body: sanitizeBody(req.body),
          query: req.query,
          requestId,
        };

        // Fire-and-forget audit log insert (includes request_id column from migration 022)
        if (userId) {
          pool.execute(
            `INSERT INTO admin_audit_log (admin_id, action, entity, entity_id, details, ip_address, request_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, action, entity, entityId, JSON.stringify(details), ip, requestId]
          ).catch((err) => {
            console.error('[Audit] Failed to write audit log:', err);
          });
        }
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Generic audit middleware that infers action and entity from the route.
 * Suitable for use as a catch-all on admin routes.
 * Captures all admin actions with request tracing (migration 019 + 022).
 */
export function auditAllAdminActions(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const userId = req.authUser?.userId;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const requestId = (req as any).requestId || null;

      // Infer action from HTTP method
      const methodMap: Record<string, string> = {
        GET: 'view',
        POST: 'create',
        PUT: 'update',
        PATCH: 'update',
        DELETE: 'delete',
      };
      const action = methodMap[req.method] || req.method.toLowerCase();

      // Infer entity from the URL path (skip numeric segments to get the resource name)
      const pathParts = req.originalUrl.split('/').filter(Boolean);
      const entity = pathParts.filter(p => !/^\d+$/.test(p)).pop() || 'unknown';

      const entityId = parseInt(req.params.id as string) || null;

      const details = {
        method: req.method,
        path: req.originalUrl,
        body: sanitizeBody(req.body),
        requestId,
      };

      if (userId) {
        pool.execute(
          `INSERT INTO admin_audit_log (admin_id, action, entity, entity_id, details, ip_address, request_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, action, entity, entityId, JSON.stringify(details), ip, requestId]
        ).catch((err) => {
          console.error('[Audit] Failed to write audit log:', err);
        });
      }
    }

    return originalJson(body);
  };

  next();
}

/**
 * Remove sensitive fields from the request body before logging.
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'refresh_token', 'accessToken', 'refreshToken'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}
