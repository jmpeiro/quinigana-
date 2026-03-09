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
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));

const mockScanStream = jest.fn();

jest.mock('../../config/redis.config', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    exists: jest.fn(),
    ping: jest.fn(),
    quit: jest.fn(),
    scanStream: mockScanStream,
    pipeline: jest.fn(),
  },
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { RedisService } from '../../services/redis.service';
import { redisClient } from '../../config/redis.config';

const mockRedis = redisClient as jest.Mocked<typeof redisClient>;

describe('RedisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return parsed JSON when value is valid JSON', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue('{"name":"test","value":42}');

      const result = await RedisService.get<{ name: string; value: number }>('key1');
      expect(result).toEqual({ name: 'test', value: 42 });
      expect(mockRedis.get).toHaveBeenCalledWith('key1');
    });

    it('should return raw string when value is not valid JSON', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue('plain-string');

      const result = await RedisService.get<string>('key2');
      expect(result).toBe('plain-string');
    });

    it('should return null for missing key', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue(null);

      const result = await RedisService.get('missing');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with TTL when ttlSeconds is provided', async () => {
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');

      await RedisService.set('key1', { foo: 'bar' }, 60);

      expect(mockRedis.set).toHaveBeenCalledWith('key1', '{"foo":"bar"}', 'EX', 60);
    });

    it('should set value without TTL when ttlSeconds is not provided', async () => {
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');

      await RedisService.set('key1', { foo: 'bar' });

      expect(mockRedis.set).toHaveBeenCalledWith('key1', '{"foo":"bar"}');
    });

    it('should not JSON-stringify a plain string value', async () => {
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');

      await RedisService.set('key1', 'plain-value');

      expect(mockRedis.set).toHaveBeenCalledWith('key1', 'plain-value');
    });

    it('should stringify objects', async () => {
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');

      await RedisService.set('key1', [1, 2, 3], 120);

      expect(mockRedis.set).toHaveBeenCalledWith('key1', '[1,2,3]', 'EX', 120);
    });
  });

  describe('del', () => {
    it('should return 0 when called with no keys', async () => {
      const result = await RedisService.del();
      expect(result).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should delete keys and return count', async () => {
      (mockRedis.del as jest.Mock).mockResolvedValue(2);

      const result = await RedisService.del('key1', 'key2');
      expect(result).toBe(2);
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2');
    });
  });

  describe('incr', () => {
    it('should increment key and return new value', async () => {
      (mockRedis.incr as jest.Mock).mockResolvedValue(5);

      const result = await RedisService.incr('counter');
      expect(result).toBe(5);
      expect(mockRedis.incr).toHaveBeenCalledWith('counter');
    });
  });

  describe('expire', () => {
    it('should return true when expire succeeds', async () => {
      (mockRedis.expire as jest.Mock).mockResolvedValue(1);

      const result = await RedisService.expire('key1', 300);
      expect(result).toBe(true);
      expect(mockRedis.expire).toHaveBeenCalledWith('key1', 300);
    });

    it('should return false when key does not exist', async () => {
      (mockRedis.expire as jest.Mock).mockResolvedValue(0);

      const result = await RedisService.expire('missing', 300);
      expect(result).toBe(false);
    });
  });

  describe('ttl', () => {
    it('should return TTL value', async () => {
      (mockRedis.ttl as jest.Mock).mockResolvedValue(120);

      const result = await RedisService.ttl('key1');
      expect(result).toBe(120);
    });

    it('should return -2 for missing key', async () => {
      (mockRedis.ttl as jest.Mock).mockResolvedValue(-2);

      const result = await RedisService.ttl('missing');
      expect(result).toBe(-2);
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      (mockRedis.exists as jest.Mock).mockResolvedValue(1);

      const result = await RedisService.exists('key1');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      (mockRedis.exists as jest.Mock).mockResolvedValue(0);

      const result = await RedisService.exists('missing');
      expect(result).toBe(false);
    });
  });

  describe('deleteByPattern', () => {
    it('should scan and pipeline delete matching keys', async () => {
      const mockPipelineExec = jest.fn().mockResolvedValue([['OK'], ['OK'], ['OK']]);
      const mockPipelineDel = jest.fn().mockReturnThis();
      (mockRedis.pipeline as jest.Mock).mockReturnValue({
        del: mockPipelineDel,
        exec: mockPipelineExec,
      });

      // Simulate a scan stream using EventEmitter
      const { EventEmitter } = require('events');
      const stream = new EventEmitter();
      mockScanStream.mockReturnValue(stream);

      const deletePromise = RedisService.deleteByPattern('cache:*');

      // Emit data events and then end (flush microtasks so async handler completes)
      stream.emit('data', ['cache:key1', 'cache:key2', 'cache:key3']);
      await new Promise((r) => setImmediate(r));
      stream.emit('end');

      const result = await deletePromise;
      expect(result).toBe(3);
      expect(mockScanStream).toHaveBeenCalledWith({ match: 'cache:*', count: 100 });
    });

    it('should handle empty scan results', async () => {
      const { EventEmitter } = require('events');
      const stream = new EventEmitter();
      mockScanStream.mockReturnValue(stream);

      const deletePromise = RedisService.deleteByPattern('nonexistent:*');

      stream.emit('data', []);
      stream.emit('end');

      const result = await deletePromise;
      expect(result).toBe(0);
    });

    it('should reject on stream error', async () => {
      const { EventEmitter } = require('events');
      const stream = new EventEmitter();
      mockScanStream.mockReturnValue(stream);

      const deletePromise = RedisService.deleteByPattern('err:*');

      stream.emit('error', new Error('scan failed'));

      await expect(deletePromise).rejects.toThrow('scan failed');
    });
  });

  describe('isHealthy', () => {
    it('should return true when ping returns PONG', async () => {
      (mockRedis.ping as jest.Mock).mockResolvedValue('PONG');

      const result = await RedisService.isHealthy();
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      (mockRedis.ping as jest.Mock).mockRejectedValue(new Error('connection refused'));

      const result = await RedisService.isHealthy();
      expect(result).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should call quit on the redis client', async () => {
      (mockRedis.quit as jest.Mock).mockResolvedValue('OK');

      await RedisService.disconnect();
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});
