import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/environment';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token.
 */
function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Middleware that sets a CSRF token cookie using the double-submit cookie pattern.
 *
 * The token is set as a readable cookie (not httpOnly) so the frontend can read it
 * and send it back in the X-CSRF-Token header. The server validates that the header
 * matches the cookie value.
 *
 * Apply this middleware on routes that set the refresh token cookie
 * (login, register, token refresh).
 */
export function setCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const token = generateCsrfToken();

  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by frontend JavaScript
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (matches longest refresh token)
  });

  // Also add to response header so SPA can capture it
  res.setHeader(CSRF_HEADER_NAME, token);

  next();
}

/**
 * Middleware that validates the CSRF token using the double-submit cookie pattern.
 *
 * Checks that the X-CSRF-Token header matches the csrf-token cookie.
 * Apply this middleware on routes that consume the refresh token cookie
 * (refresh, logout).
 */
export function validateCsrfToken(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF validation for non-production if explicitly disabled
  if (env.nodeEnv === 'development' && process.env.CSRF_DISABLED === 'true') {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!cookieToken || !headerToken) {
    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_VALIDATION_FAILED',
        message: 'CSRF token missing. Please refresh the page and try again.',
      },
    });
    return;
  }

  // Use timing-safe comparison to prevent timing attacks
  try {
    const cookieBuffer = Buffer.from(cookieToken, 'utf8');
    const headerBuffer = Buffer.from(headerToken, 'utf8');

    if (cookieBuffer.length !== headerBuffer.length || !crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_VALIDATION_FAILED',
          message: 'CSRF token mismatch. Please refresh the page and try again.',
        },
      });
      return;
    }
  } catch {
    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_VALIDATION_FAILED',
        message: 'Invalid CSRF token. Please refresh the page and try again.',
      },
    });
    return;
  }

  next();
}
