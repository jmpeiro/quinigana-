import './types/express-augment';
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { corsOptions } from './config/cors';
import { generalLimiter } from './config/rate-limiter';
import { configurePassport } from './config/passport';
import { errorMiddleware } from './middlewares/error.middleware';
import { requestTracingMiddleware } from './middlewares/request-tracing.middleware';
import { sanitizeMiddleware } from './middlewares/sanitize.middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import { sendError } from './utils/response.util';
import { swaggerSpec } from './config/swagger.config';
import logger from './config/logger';
import v1Routes from './routes/v1';

const app = express();

// CORS must be first to handle preflight OPTIONS requests
app.use(cors(corsOptions));

// Request tracing — must be before logging so requestId appears in every log line
app.use(requestTracingMiddleware);

// Request logging
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

// Security middleware
app.use(helmet());
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Input sanitization (XSS & injection prevention) - must be after body parsing
app.use(sanitizeMiddleware);

// Passport
configurePassport();
app.use(passport.initialize());

// Swagger UI — served before auth so docs are publicly accessible
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'QuiniGana API Docs',
}));

// Protected uploads - authenticated access only
app.get('/api/v1/uploads/:filename', authMiddleware, (req, res) => {
  const filename = req.params.filename as string;

  // Prevent path traversal attacks
  const sanitizedFilename = path.basename(filename);
  if (sanitizedFilename !== filename || filename.includes('..')) {
    sendError(res, 'INVALID_FILENAME', 'Invalid filename', 400);
    return;
  }

  const filePath = path.join(__dirname, '../uploads', sanitizedFilename);
  res.sendFile(filePath, (err) => {
    if (err) {
      sendError(res, 'FILE_NOT_FOUND', 'File not found', 404);
    }
  });
});

// API routes — versioned under /api/v1
app.use('/api/v1', v1Routes);

// Backward-compatible alias: /api/* → same handlers as /api/v1/*
app.use('/api', v1Routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorMiddleware);

export default app;
