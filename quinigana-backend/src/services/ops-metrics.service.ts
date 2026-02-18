import { Request } from 'express';

interface RouteMetrics {
  route: string;
  method: string;
  totalRequests: number;
  status2xx: number;
  status4xx: number;
  status5xx: number;
  totalDurationMs: number;
  maxDurationMs: number;
  samplesMs: number[];
  lastSeenAt: string;
}

interface ErrorEvent {
  timestamp: string;
  requestId: string | null;
  route: string;
  method: string;
  status: number;
  durationMs: number;
}

const MAX_ROUTE_SAMPLES = 200;
const MAX_ERROR_EVENTS = 100;

export class OpsMetricsService {
  private static readonly startedAt = Date.now();
  private static readonly routeMap = new Map<string, RouteMetrics>();
  private static readonly errorEvents: ErrorEvent[] = [];
  private static totalRequests = 0;
  private static total2xx = 0;
  private static total4xx = 0;
  private static total5xx = 0;

  static resolveRoute(req: Request): string {
    const base = req.baseUrl || '';
    const routePath = (req.route?.path as string | undefined) || '';

    if (routePath) {
      return `${base}${routePath}`;
    }

    const fallbackPath = req.path || req.originalUrl || '/unknown';
    return fallbackPath.split('?')[0];
  }

  static record(req: Request, durationMs: number, statusCode: number): void {
    const route = this.resolveRoute(req);
    const method = req.method.toUpperCase();
    const key = `${method} ${route}`;

    const existing = this.routeMap.get(key) || {
      route,
      method,
      totalRequests: 0,
      status2xx: 0,
      status4xx: 0,
      status5xx: 0,
      totalDurationMs: 0,
      maxDurationMs: 0,
      samplesMs: [],
      lastSeenAt: new Date().toISOString(),
    };

    existing.totalRequests += 1;
    existing.totalDurationMs += durationMs;
    existing.maxDurationMs = Math.max(existing.maxDurationMs, durationMs);
    existing.lastSeenAt = new Date().toISOString();
    existing.samplesMs.push(durationMs);
    if (existing.samplesMs.length > MAX_ROUTE_SAMPLES) {
      existing.samplesMs.shift();
    }

    if (statusCode >= 500) {
      existing.status5xx += 1;
      this.total5xx += 1;
      this.errorEvents.unshift({
        timestamp: new Date().toISOString(),
        requestId: req.requestId || null,
        route,
        method,
        status: statusCode,
        durationMs,
      });
      if (this.errorEvents.length > MAX_ERROR_EVENTS) {
        this.errorEvents.pop();
      }
    } else if (statusCode >= 400) {
      existing.status4xx += 1;
      this.total4xx += 1;
    } else {
      existing.status2xx += 1;
      this.total2xx += 1;
    }

    this.totalRequests += 1;
    this.routeMap.set(key, existing);
  }

  static snapshot(topLimit: number = 10) {
    const routes = Array.from(this.routeMap.values()).map((r) => {
      const avgMs = r.totalRequests > 0 ? r.totalDurationMs / r.totalRequests : 0;
      const p95Ms = this.percentile(r.samplesMs, 95);
      return {
        route: r.route,
        method: r.method,
        requests: r.totalRequests,
        avgMs: Math.round(avgMs * 100) / 100,
        p95Ms: Math.round(p95Ms * 100) / 100,
        maxMs: Math.round(r.maxDurationMs * 100) / 100,
        status2xx: r.status2xx,
        status4xx: r.status4xx,
        status5xx: r.status5xx,
        lastSeenAt: r.lastSeenAt,
      };
    });

    const topSlowRoutes = [...routes]
      .sort((a, b) => b.p95Ms - a.p95Ms)
      .slice(0, topLimit);

    const topErrorRoutes = [...routes]
      .sort((a, b) => b.status5xx - a.status5xx)
      .filter((r) => r.status5xx > 0)
      .slice(0, topLimit);

    return {
      service: {
        startedAt: new Date(this.startedAt).toISOString(),
        uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      },
      totals: {
        requests: this.totalRequests,
        status2xx: this.total2xx,
        status4xx: this.total4xx,
        status5xx: this.total5xx,
      },
      topSlowRoutes,
      topErrorRoutes,
      recentErrors: this.errorEvents.slice(0, topLimit),
    };
  }

  private static percentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.floor((percentile / 100) * sorted.length));
    return sorted[index];
  }
}
