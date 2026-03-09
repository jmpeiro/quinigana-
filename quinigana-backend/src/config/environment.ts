import dotenv from 'dotenv';

dotenv.config();

function parseTrustProxy(value: string | undefined, nodeEnv: string): boolean | number | string {
  if (!value || value.trim() === '') {
    return nodeEnv === 'production' ? 1 : false;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && Number.isInteger(asNumber) && asNumber >= 0) {
    return asNumber;
  }

  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv,
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY, nodeEnv),

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'quinigana_db',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'QuiniGana <noreply@quinigana.com>',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '500', 10),
  },

  footballData: {
    apiKey: process.env.FOOTBALL_DATA_API_KEY || '',
  },

  apiFootball: {
    apiKey: process.env.API_FOOTBALL_KEY || '',
    baseHost: process.env.API_FOOTBALL_BASE_HOST || 'v3.football.api-sports.io',
    useRapidApi: (process.env.API_FOOTBALL_USE_RAPIDAPI || 'false').toLowerCase() === 'true',
    rapidApiHost: process.env.API_FOOTBALL_RAPIDAPI_HOST || 'v3.football.api-sports.io',
  },

  webPush: {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@quinigana.com',
  },

  socket: {
    scrapeIntervalMs: parseInt(process.env.SOCKET_SCRAPE_INTERVAL || '30000', 10),
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  scraper: {
    proxyUrl: process.env.SCRAPER_PROXY_URL || '', // e.g., http://user:pass@proxy.example.com:8080
    minDelayMs: parseInt(process.env.SCRAPER_MIN_DELAY_MS || '300', 10),
    maxDelayMs: parseInt(process.env.SCRAPER_MAX_DELAY_MS || '800', 10),
    cacheTtlMs: parseInt(process.env.SCRAPER_CACHE_TTL_MS || '25000', 10),
    timeoutMs: parseInt(process.env.SCRAPER_TIMEOUT_MS || '15000', 10),
    maxRetries: parseInt(process.env.SCRAPER_MAX_RETRIES || '2', 10),
  },
};
