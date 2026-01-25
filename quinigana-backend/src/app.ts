import './types/express-augment';
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import pinoHttp from 'pino-http';
import { corsOptions } from './config/cors';
import { generalLimiter } from './config/rate-limiter';
import { configurePassport } from './config/passport';
import { errorMiddleware } from './middlewares/error.middleware';
import logger from './config/logger';
import routes from './routes';

const app = express();

// CORS must be first to handle preflight OPTIONS requests
app.use(cors(corsOptions));

// Request logging
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

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
