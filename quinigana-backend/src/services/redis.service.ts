import { redisClient } from '../config/redis.config';
import logger from '../config/logger';

/**
 * Redis service singleton — thin wrapper around ioredis with
 * typed helpers and a health-check method.
 */
class RedisServiceImpl {
  /* ------------------------------------------------------------------ */
  /*  Core operations                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Get a value by key. Returns null if the key does not exist.
   * Automatically JSON-parses stored values.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = await redisClient.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  /**
   * Set a key/value pair. Values are JSON-stringified.
   * @param ttlSeconds  Optional TTL in seconds. Omit for no expiry.
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redisClient.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await redisClient.set(key, serialized);
    }
  }

  /**
   * Delete one or more keys.
   * @returns The number of keys removed.
   */
  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return redisClient.del(...keys);
  }

  /**
   * Increment a numeric key by 1 (creates the key with value 1 if it doesn't exist).
   */
  async incr(key: string): Promise<number> {
    return redisClient.incr(key);
  }

  /**
   * Set a TTL (in seconds) on an existing key.
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await redisClient.expire(key, seconds);
    return result === 1;
  }

  /* ------------------------------------------------------------------ */
  /*  Utility helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Get remaining TTL in seconds. Returns -1 if no expiry, -2 if key missing.
   */
  async ttl(key: string): Promise<number> {
    return redisClient.ttl(key);
  }

  /**
   * Check if a key exists.
   */
  async exists(key: string): Promise<boolean> {
    const count = await redisClient.exists(key);
    return count === 1;
  }

  /**
   * Delete all keys matching a pattern (uses SCAN to avoid blocking).
   */
  async deleteByPattern(pattern: string): Promise<number> {
    let deleted = 0;
    const stream = redisClient.scanStream({ match: pattern, count: 100 });

    return new Promise((resolve, reject) => {
      stream.on('data', async (keys: string[]) => {
        if (keys.length > 0) {
          // Strip the key prefix because ioredis prepends it automatically
          const pipeline = redisClient.pipeline();
          for (const key of keys) {
            pipeline.del(key);
          }
          const results = await pipeline.exec();
          deleted += results?.length || 0;
        }
      });
      stream.on('end', () => resolve(deleted));
      stream.on('error', (err) => reject(err));
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Health check                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Returns true if Redis responds to PING within a reasonable time.
   */
  async isHealthy(): Promise<boolean> {
    try {
      const pong = await Promise.race([
        redisClient.ping(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis health check timed out')), 3000)
        ),
      ]);
      return pong === 'PONG';
    } catch (err) {
      logger.error({ err }, 'Redis health check failed');
      return false;
    }
  }

  /**
   * Graceful shutdown.
   */
  async disconnect(): Promise<void> {
    await redisClient.quit();
    logger.info('Redis: disconnected gracefully');
  }
}

/** Singleton instance */
export const RedisService = new RedisServiceImpl();
