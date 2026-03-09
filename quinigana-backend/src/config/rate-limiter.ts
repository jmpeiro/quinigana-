import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Request, Response } from 'express';
import { redisClient } from './redis.config';
import { env } from './environment';
import logger from './logger';

/* ------------------------------------------------------------------ */
/*  Redis-backed rate-limit store                                      */
/* ------------------------------------------------------------------ */

/**
 * Create a RedisStore instance for express-rate-limit.
 * Falls back to the default in-memory store if Redis is unavailable.
 */
/**
 * Whether Redis is usable — set to true once the client emits 'ready',
 * false if it disconnects. Checked lazily by the rate-limit store so
 * requests never hang when Redis is down.
 */
let redisReady = false;
redisClient.on('ready', () => { redisReady = true; });
redisClient.on('close', () => { redisReady = false; });
redisClient.on('error', () => { redisReady = false; });

function createRedisStore(prefix: string): RedisStore | undefined {
  if (!redisReady) {
    logger.warn(`Redis not ready — rate limiter "${prefix}" using in-memory store`);
    return undefined;
  }
  try {
    return new RedisStore({
      sendCommand: (...args: string[]) =>
        redisClient.call(args[0], ...args.slice(1)) as any,
      prefix: `rl:${prefix}:`,
    });
  } catch {
    logger.warn(`Redis unavailable — rate limiter "${prefix}" using in-memory store`);
    return undefined;
  }
}

/* ------------------------------------------------------------------ */
/*  Progressive lockout (Redis-backed)                                 */
/* ------------------------------------------------------------------ */

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const LOCKOUT_TTL_SECONDS = 30 * 60; // Redis key TTL

function lockoutKey(key: string): string {
  return `lockout:${key}`;
}

/** Race a Redis operation against a timeout so requests never hang when Redis is down. */
function withTimeout<T>(promise: Promise<T>, ms = 2000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Redis operation timed out')), ms)),
  ]);
}

/**
 * Track a failed login attempt for progressive lockout.
 * Call this from the auth controller on login failure.
 */
export async function recordFailedAttempt(key: string): Promise<void> {
  const redisKey = lockoutKey(key);

  try {
    // Check if currently locked
    const raw = await withTimeout(redisClient.get(redisKey));
    if (raw) {
      const entry = JSON.parse(raw);
      if (entry.lockedUntil && entry.lockedUntil > Date.now()) {
        return; // Already locked, don't increment
      }
    }

    const entry = raw ? JSON.parse(raw) : { count: 0, lockedUntil: null };
    entry.count += 1;

    if (entry.count >= LOCKOUT_THRESHOLD) {
      entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      logger.warn({ key, lockoutMinutes: 30 }, 'Account locked due to too many failed login attempts');
    }

    await withTimeout(redisClient.set(redisKey, JSON.stringify(entry), 'EX', LOCKOUT_TTL_SECONDS));
  } catch (err) {
    logger.error({ err, key }, 'Failed to record login attempt in Redis');
  }
}

/**
 * Reset failed attempts after a successful login.
 */
export async function resetFailedAttempts(key: string): Promise<void> {
  try {
    await withTimeout(redisClient.del(lockoutKey(key)));
  } catch (err) {
    logger.error({ err, key }, 'Failed to reset login attempts in Redis');
  }
}

/**
 * Check if a key is currently locked out.
 */
export async function isLockedOut(key: string): Promise<{ locked: boolean; remainingMs: number }> {
  try {
    const raw = await withTimeout(redisClient.get(lockoutKey(key)));
    if (!raw) return { locked: false, remainingMs: 0 };

    const entry = JSON.parse(raw);
    if (!entry.lockedUntil) return { locked: false, remainingMs: 0 };

    const now = Date.now();
    if (entry.lockedUntil > now) {
      return { locked: true, remainingMs: entry.lockedUntil - now };
    }

    // Lockout expired, clean up
    await withTimeout(redisClient.del(lockoutKey(key)));
    return { locked: false, remainingMs: 0 };
  } catch (err) {
    logger.error({ err, key }, 'Failed to check lockout status in Redis');
    return { locked: false, remainingMs: 0 }; // Fail open
  }
}

/* ------------------------------------------------------------------ */
/*  Rate limiters                                                      */
/* ------------------------------------------------------------------ */

function getClientIp(req: Request): string {
  const cfIp = req.header('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const xff = req.header('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  return req.ip || 'unknown';
}

export const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  skip: (req) =>
    req.method === 'OPTIONS' ||
    req.path === '/health' ||
    req.path.startsWith('/api/auth/login') ||
    req.path.startsWith('/api/auth/register') ||
    req.path.startsWith('/api/auth/password/forgot'),
  keyGenerator: (req) => getClientIp(req),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('general'),
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
  store: createRedisStore('invite'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Math.min(env.rateLimit.max, 100),
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
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email || getClientIp(req);
  },
  store: createRedisStore('auth'),
});

/**
 * Middleware to check progressive lockout before auth routes.
 * Must be applied before the auth controller processes the request.
 */
export function lockoutMiddleware(req: Request, res: Response, next: Function): void {
  const key = req.body?.email || req.ip || 'unknown';

  isLockedOut(key).then(({ locked, remainingMs }) => {
    if (locked) {
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      res.status(429).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Account temporarily locked due to too many failed attempts. Try again in ${remainingMinutes} minutes.`,
        },
      });
      return;
    }
    next();
  }).catch((err) => {
    logger.error({ err }, 'Lockout middleware error');
    next(); // Fail open
  });
}
