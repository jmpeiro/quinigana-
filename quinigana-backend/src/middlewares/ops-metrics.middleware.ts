import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { OpsMetricsService } from '../services/ops-metrics.service';

const SLOW_REQUEST_MS = 1500;

export function opsMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const started = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    OpsMetricsService.record(req, durationMs, res.statusCode);

    const route = OpsMetricsService.resolveRoute(req);
    const payload = {
      requestId: req.requestId,
      method: req.method,
      route,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    };

    if (durationMs >= SLOW_REQUEST_MS || res.statusCode >= 500) {
      logger.warn(payload, 'request completed (slow/error)');
    } else {
      logger.info(payload, 'request completed');
    }
  });

  next();
}
