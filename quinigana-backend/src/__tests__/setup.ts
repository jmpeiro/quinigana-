/**
 * Shared test setup – common environment mock.
 *
 * Import order matters: jest.mock calls are hoisted, so we centralize
 * the full env mock here and each test file can import or re-declare.
 */

export const TEST_ENV = {
  port: 3000,
  nodeEnv: 'test',
  frontendUrl: 'http://localhost:4200',
  db: { host: 'localhost', port: 3306, user: 'root', password: '', name: 'test' },
  jwt: {
    accessSecret: 'test-secret-min-32-chars-long!!!',
    refreshSecret: 'test-refresh-min-32-chars!!!!!!!',
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },
  email: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', from: 'test@test.com' },
  google: { clientId: '', clientSecret: '', callbackUrl: '' },
  rateLimit: { windowMs: 900000, max: 100 },
  footballData: { apiKey: 'test-api-key' },
  webPush: { publicKey: '', privateKey: '', subject: 'mailto:test@test.com' },
  socket: { scrapeIntervalMs: 30000 },
  redis: { host: 'localhost', port: 6379, password: '' },
  scraper: { proxyUrl: '', minDelayMs: 300, maxDelayMs: 800, cacheTtlMs: 25000, timeoutMs: 15000, maxRetries: 2 },
};

/** Full mock User object for tests */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 1,
    email: 'test@test.com',
    password_hash: '$2a$12$hashedpassword',
    first_name: 'Test',
    last_name: 'User',
    avatar_url: null,
    google_id: null,
    auth_provider: 'local' as const,
    email_verified: false,
    is_active: true,
    is_admin: false,
    deleted_at: null,
    deletion_requested_at: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    ...overrides,
  };
}

/** Full mock Challenge object */
export function createMockChallenge(overrides: Partial<any> = {}) {
  return {
    id: 1,
    challenger_id: 1,
    challenged_id: 2,
    jornada_id: 10,
    status: 'pending' as const,
    wager_points: 10,
    winner_id: null,
    challenger_score: null,
    challenged_score: null,
    message: 'Let\'s go!',
    created_at: new Date('2024-01-01'),
    responded_at: null,
    completed_at: null,
    expired_at: null,
    ...overrides,
  };
}
