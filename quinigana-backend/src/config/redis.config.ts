import Redis, { RedisOptions } from 'ioredis';
import logger from './logger';

const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'quinigana:',
  maxRetriesPerRequest: null, // Required for BullMQ / rate-limit-redis compatibility
  enableReadyCheck: true,
  retryStrategy(times: number): number {
    if (times > 20) {
      logger.error('Redis: max reconnection attempts reached, backing off to 30s interval');
    }
    // Exponential backoff: min 50ms, max 2000ms, then 30s after 20 attempts
    const delay = times > 20 ? 30000 : Math.min(times * 50, 2000);
    if (times <= 20) {
      logger.warn({ attempt: times, delayMs: delay }, 'Redis: reconnecting...');
    }
    return delay;
  },
  reconnectOnError(err: Error): boolean | 1 | 2 {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    if (targetErrors.some((e) => err.message.includes(e))) {
      return 2; // Reconnect and re-send the failed command
    }
    return false;
  },
};

/**
 * Primary Redis client (singleton).
 * Import this wherever you need direct Redis access.
 */
// Redis is optional: the app degrades to in-memory caching without it. Setting
// REDIS_ENABLED=false stops ioredis from retrying forever and filling the log
// with connection errors on deployments that have no Redis installed.
const redisEnabled = (process.env.REDIS_ENABLED || 'true').toLowerCase() !== 'false';

if (!redisEnabled) {
  redisOptions.lazyConnect = true;
  redisOptions.retryStrategy = () => null;
  redisOptions.reconnectOnError = () => false;
  logger.info('Redis: disabled by REDIS_ENABLED=false, using in-memory cache');
}

export const redisClient = new Redis(redisOptions);

/**
 * Create a duplicate connection (needed for pub/sub adapters).
 */
export function createRedisClient(): Redis {
  return new Redis(redisOptions);
}

// Connection event logging
redisClient.on('connect', () => {
  logger.info('Redis: connected');
});

redisClient.on('ready', () => {
  logger.info('Redis: ready to accept commands');
});

redisClient.on('error', (err) => {
  logger.error({ err: err.message }, 'Redis: connection error');
});

redisClient.on('close', () => {
  logger.warn('Redis: connection closed');
});

export default redisClient;
