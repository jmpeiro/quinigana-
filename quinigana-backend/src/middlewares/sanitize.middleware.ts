import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

/**
 * Recursively sanitize all string values in an object to prevent XSS attacks.
 * Removes HTML tags and sanitizes potential script injections.
 */
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    // Apply XSS sanitization
    let sanitized = xss(value);
    // Remove MongoDB operator injection (keys starting with $ or containing .)
    // This prevents NoSQL injection patterns
    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value);
  }

  return value;
}

/**
 * Sanitize an object by processing all its keys and values.
 * Also strips keys that start with '$' to prevent NoSQL injection.
 */
function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const key of Object.keys(obj)) {
    // Strip keys starting with '$' (MongoDB operator injection)
    if (key.startsWith('$')) {
      continue;
    }
    // Strip keys containing '..' (path traversal)
    if (key.includes('..')) {
      continue;
    }
    sanitized[key] = sanitizeValue(obj[key]);
  }

  return sanitized;
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 * to prevent XSS and injection attacks.
 *
 * Apply globally in app.ts after body parsing middleware.
 */
export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query as Record<string, any>) as any;
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params) as any;
  }

  next();
}
