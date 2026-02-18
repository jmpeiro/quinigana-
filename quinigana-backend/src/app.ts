import './types/express-augment';
import express from 'express';
import path from 'path';
import { randomUUID } from 'crypto';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import pinoHttp from 'pino-http';
import { corsOptions } from './config/cors';
import { env } from './config/environment';
import { generalLimiter } from './config/rate-limiter';
import { configurePassport } from './config/passport';
import { errorMiddleware } from './middlewares/error.middleware';
import { opsMetricsMiddleware } from './middlewares/ops-metrics.middleware';
import logger from './config/logger';
import routes from './routes';

const app = express();
app.set('trust proxy', env.trustProxy);

// CORS must be first to handle preflight OPTIONS requests
app.use(cors(corsOptions));

// Correlation id for tracing requests across logs and clients
app.use((req, res, next) => {
  const incomingId = req.header('x-request-id');
  const requestId = incomingId || randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});

// Request logging
app.use(pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === '/health' },
  customProps: (req) => ({ requestId: req.requestId }),
}));

// Security middleware
app.use(helmet());
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Passport
configurePassport();
app.use(passport.initialize());
app.use(opsMetricsMiddleware);

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorMiddleware);

export default app;
