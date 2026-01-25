import rateLimit from 'express-rate-limit';
import { env } from './environment';

export const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: 1000, // High limit for development
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: {
      code: 'INVITE_RATE_LIMIT',
      message: 'Too many invite links generated, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Increased for development
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email || req.ip || 'unknown';
  },
});
