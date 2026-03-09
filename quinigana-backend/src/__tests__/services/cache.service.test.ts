jest.mock('../../config/environment', () => ({
  env: {
    port: 3000,
    nodeEnv: 'test',
    frontendUrl: 'http://localhost:4200',
    db: { host: 'localhost', port: 3306, user: 'root', password: '', name: 'test' },
    jwt: { accessSecret: 'test-secret-min-32-chars-long!!!', refreshSecret: 'test-refresh-min-32-chars!!!!!!!', accessExpiry: '15m', refreshExpiry: '7d' },
    email: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', from: 'test@test.com' },
    google: { clientId: '', clientSecret: '', callbackUrl: '' },
    rateLimit: { windowMs: 900000, max: 100 },
    footballData: { apiKey: 'test-api-key' },
    webPush: { publicKey: '', privateKey: '', subject: 'mailto:test@test.com' },
    socket: { scrapeIntervalMs: 30000 },
    redis: { host: 'localhost', port: 6379, password: '' },
    scraper: { proxyUrl: '', minDelayMs: 300, maxDelayMs: 800, cacheTtlMs: 25000, timeoutMs: 15000, maxRetries: 2 },
  },
}));
jest.mock('../../config/cache', () => ({
  cacheConfig: {
    defaultTTL: 300,
    checkPeriod: 60,
    maxKeys: 0,
    useClones: true,
  },
  CacheKey: {
    STANDINGS: 'standings',
    RANKINGS: 'rankings',
    DASHBOARD: 'dashboard',
    JORNADA_LIST: 'jornada_list',
    LEAGUE_STANDINGS: 'league_standings',
  },
}));
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));

jest.mock('../../services/redis.service', () => ({
  RedisService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    deleteByPattern: jest.fn(),
  },
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { CacheService } from '../../services/cache.service';
import { RedisService } from '../../services/redis.service';
import { CacheKey } from '../../config/cache';

const mockRedisService = RedisService as jest.Mocked<typeof RedisService>;

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    CacheService.flush();
  });

  describe('get/set - basic local cache operations', () => {
    it('should store and retrieve a value', () => {
      CacheService.set('test_key', { name: 'test' });
      const result = CacheService.get<{ name: string }>('test_key');
      expect(result).toEqual({ name: 'test' });
    });

    it('should return undefined for missing key', () => {
      const result = CacheService.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should support custom TTL', () => {
      CacheService.set('ttl_key', 'value', 60);
      const result = CacheService.get('ttl_key');
      expect(result).toBe('value');
    });
  });

  describe('Redis-backed keys', () => {
    it('should write to Redis when key starts with jornada_list', () => {
      (mockRedisService.set as jest.Mock).mockResolvedValue(undefined);

      CacheService.set('jornada_list:all', [1, 2, 3]);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'cache:jornada_list:all',
        [1, 2, 3],
        300
      );
    });

    it('should write to Redis when key starts with rankings', () => {
      (mockRedisService.set as jest.Mock).mockResolvedValue(undefined);

      CacheService.set('rankings:global:1:10', { items: [] });

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'cache:rankings:global:1:10',
        { items: [] },
        300
      );
    });

    it('should fall back to Redis on getAsync when local cache misses', async () => {
      (mockRedisService.get as jest.Mock).mockResolvedValue({ cached: true });

      const result = await CacheService.getAsync<{ cached: boolean }>('rankings:global:1:10');

      expect(mockRedisService.get).toHaveBeenCalledWith('cache:rankings:global:1:10');
      expect(result).toEqual({ cached: true });
    });

    it('should return local cache first on getAsync', async () => {
      CacheService.set('rankings:test', 'local-value');
      (mockRedisService.get as jest.Mock).mockResolvedValue('redis-value');

      const result = await CacheService.getAsync('rankings:test');

      expect(result).toBe('local-value');
      expect(mockRedisService.get).not.toHaveBeenCalled();
    });

    it('should re-populate local cache from Redis fallback', async () => {
      (mockRedisService.get as jest.Mock).mockResolvedValue('from-redis');

      await CacheService.getAsync('jornada_list:all');

      const local = CacheService.get('jornada_list:all');
      expect(local).toBe('from-redis');
    });
  });

  describe('Non-backed keys', () => {
    it('should not touch Redis for non-backed keys on set', () => {
      CacheService.set('dashboard:1', { data: 'test' });

      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('should not fall back to Redis on getAsync for non-backed keys', async () => {
      const result = await CacheService.getAsync('dashboard:1');

      expect(mockRedisService.get).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('del', () => {
    it('should remove from local cache', () => {
      CacheService.set('key1', 'value1');
      CacheService.del('key1');
      expect(CacheService.get('key1')).toBeUndefined();
    });

    it('should remove from Redis for backed keys', () => {
      (mockRedisService.del as jest.Mock).mockResolvedValue(1);

      CacheService.set('rankings:test', 'value');
      CacheService.del('rankings:test');

      expect(mockRedisService.del).toHaveBeenCalledWith('cache:rankings:test');
    });

    it('should handle array of keys', () => {
      CacheService.set('a', 1);
      CacheService.set('b', 2);
      CacheService.del(['a', 'b']);
      expect(CacheService.get('a')).toBeUndefined();
      expect(CacheService.get('b')).toBeUndefined();
    });

    it('should not call Redis del for non-backed keys', () => {
      CacheService.set('standings:1', 'val');
      CacheService.del('standings:1');

      expect(mockRedisService.del).not.toHaveBeenCalled();
    });
  });

  describe('buildKey', () => {
    it('should join base and parts with colons', () => {
      const key = CacheService.buildKey(CacheKey.DASHBOARD, 1);
      expect(key).toBe('dashboard:1');
    });

    it('should handle multiple parts', () => {
      const key = CacheService.buildKey(CacheKey.RANKINGS, 'global', 1, 10);
      expect(key).toBe('rankings:global:1:10');
    });

    it('should handle string base', () => {
      const key = CacheService.buildKey('custom', 'a', 'b');
      expect(key).toBe('custom:a:b');
    });
  });

  describe('invalidateByPrefix', () => {
    it('should remove all matching keys from local cache', () => {
      CacheService.set('prefix:1', 'a');
      CacheService.set('prefix:2', 'b');
      CacheService.set('other:1', 'c');

      CacheService.invalidateByPrefix('prefix');

      expect(CacheService.get('prefix:1')).toBeUndefined();
      expect(CacheService.get('prefix:2')).toBeUndefined();
      expect(CacheService.get('other:1')).toBe('c');
    });

    it('should also delete from Redis for backed prefixes', () => {
      (mockRedisService.deleteByPattern as jest.Mock).mockResolvedValue(2);

      CacheService.set('rankings:a', 1);
      CacheService.set('rankings:b', 2);

      CacheService.invalidateByPrefix('rankings');

      expect(mockRedisService.deleteByPattern).toHaveBeenCalledWith('cache:rankings*');
    });

    it('should not call Redis deleteByPattern for non-backed prefixes', () => {
      CacheService.set('standings:1', 'val');
      CacheService.invalidateByPrefix('standings');

      expect(mockRedisService.deleteByPattern).not.toHaveBeenCalled();
    });
  });

  describe('invalidateScoresAndStandings', () => {
    it('should invalidate all relevant prefixes', () => {
      CacheService.set('standings:1', 'a');
      CacheService.set('rankings:1', 'b');
      CacheService.set('dashboard:1', 'c');
      CacheService.set('jornada_list:1', 'd');
      CacheService.set('league_standings:1', 'e');

      CacheService.invalidateScoresAndStandings();

      expect(CacheService.get('standings:1')).toBeUndefined();
      expect(CacheService.get('rankings:1')).toBeUndefined();
      expect(CacheService.get('dashboard:1')).toBeUndefined();
      expect(CacheService.get('jornada_list:1')).toBeUndefined();
      expect(CacheService.get('league_standings:1')).toBeUndefined();
    });
  });

  describe('flush', () => {
    it('should clear all cached entries', () => {
      CacheService.set('a', 1);
      CacheService.set('b', 2);

      CacheService.flush();

      expect(CacheService.get('a')).toBeUndefined();
      expect(CacheService.get('b')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      CacheService.set('exists', 'value');
      expect(CacheService.has('exists')).toBe(true);
    });

    it('should return false for non-existing key', () => {
      expect(CacheService.has('nope')).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics object', () => {
      const stats = CacheService.getStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('keys');
    });
  });
});
