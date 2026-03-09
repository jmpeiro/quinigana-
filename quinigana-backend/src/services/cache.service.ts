import NodeCache from 'node-cache';
import { cacheConfig, CacheKey } from '../config/cache';
import { RedisService } from './redis.service';
import logger from '../config/logger';

/**
 * Keys that should be backed by Redis for cross-instance consistency
 * and longer TTLs. The Redis TTL is set to 300s (5 minutes).
 */
const REDIS_BACKED_PREFIXES: string[] = [
  CacheKey.JORNADA_LIST,
  CacheKey.RANKINGS,
];

const REDIS_BACKUP_TTL = 300; // 5 minutes in Redis

/**
 * In-memory cache service (singleton).
 * Wraps node-cache with typed helpers and convenient invalidation.
 * Important keys are also backed to Redis for multi-instance deployments.
 */
class CacheServiceImpl {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: cacheConfig.defaultTTL,
      checkperiod: cacheConfig.checkPeriod,
      maxKeys: cacheConfig.maxKeys,
      useClones: cacheConfig.useClones,
    });
  }

  /**
   * Check if a key should be backed by Redis.
   */
  private isRedisBacked(key: string): boolean {
    return REDIS_BACKED_PREFIXES.some((prefix) => key.startsWith(prefix));
  }

  /**
   * Get a cached value by key.
   * Falls back to Redis for important keys if not found in local cache.
   * @returns The cached value or undefined if not found / expired.
   */
  async getAsync<T>(key: string): Promise<T | undefined> {
    // Try local cache first
    const local = this.cache.get<T>(key);
    if (local !== undefined) return local;

    // Fall back to Redis for backed keys
    if (this.isRedisBacked(key)) {
      try {
        const redisVal = await RedisService.get<T>(`cache:${key}`);
        if (redisVal !== null) {
          // Re-populate local cache
          this.cache.set(key, redisVal);
          return redisVal;
        }
      } catch (err) {
        logger.warn({ err, key }, 'Redis fallback get failed, returning undefined');
      }
    }

    return undefined;
  }

  /**
   * Get a cached value by key (synchronous, local cache only).
   * @returns The cached value or undefined if not found / expired.
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set a value in the cache. For Redis-backed keys, also writes to Redis.
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Optional TTL in seconds (defaults to cacheConfig.defaultTTL)
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    let result: boolean;
    try {
      result = ttl !== undefined
        ? this.cache.set(key, value, ttl)
        : this.cache.set(key, value);
    } catch (err) {
      logger.warn({ err, key }, 'Local cache set failed');
      return false;
    }

    // Async write-through to Redis for important keys
    if (this.isRedisBacked(key)) {
      RedisService.set(`cache:${key}`, value, REDIS_BACKUP_TTL).catch((err) => {
        logger.warn({ err, key }, 'Redis backup set failed');
      });
    }

    return result;
  }

  /**
   * Delete one or more keys from the cache (and Redis if backed).
   */
  del(keys: string | string[]): number {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const result = this.cache.del(keyArray);

    // Also remove from Redis
    const redisKeys = keyArray
      .filter((k) => this.isRedisBacked(k))
      .map((k) => `cache:${k}`);

    if (redisKeys.length > 0) {
      RedisService.del(...redisKeys).catch((err) => {
        logger.warn({ err }, 'Redis backup del failed');
      });
    }

    return result;
  }

  /**
   * Flush (clear) the entire cache.
   */
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * Check if a key exists in the cache.
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get cache statistics.
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Helper: Build a composite cache key.
   */
  buildKey(base: CacheKey | string, ...parts: (string | number)[]): string {
    return [base, ...parts].join(':');
  }

  /**
   * Invalidate all keys that start with a given prefix.
   */
  invalidateByPrefix(prefix: string): void {
    const keys = this.cache.keys().filter((k) => k.startsWith(prefix));
    if (keys.length > 0) {
      this.cache.del(keys);

      // Also clean Redis for backed prefixes
      if (REDIS_BACKED_PREFIXES.some((bp) => prefix.startsWith(bp))) {
        RedisService.deleteByPattern(`cache:${prefix}*`).catch((err) => {
          logger.warn({ err, prefix }, 'Redis pattern delete failed');
        });
      }
    }
  }

  /**
   * Invalidate cache entries related to scores / standings.
   * Call this when scores are updated or a jornada is closed.
   */
  invalidateScoresAndStandings(): void {
    this.invalidateByPrefix(CacheKey.STANDINGS);
    this.invalidateByPrefix(CacheKey.RANKINGS);
    this.invalidateByPrefix(CacheKey.DASHBOARD);
    this.invalidateByPrefix(CacheKey.JORNADA_LIST);
    this.invalidateByPrefix(CacheKey.LEAGUE_STANDINGS);
  }
}

/** Singleton instance */
export const CacheService = new CacheServiceImpl();
