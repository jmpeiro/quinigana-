import type { Logger } from 'pino';

export {};

declare global {
  namespace Express {
    interface Request {
      /** UUID v4 request trace id (set by request-tracing middleware) */
      requestId?: string;
      authUser?: {
        userId: number;
        email: string;
        provider: string;
      };
      /** Child Pino logger with requestId bound (set by request-tracing middleware) */
      log?: Logger;
    }
  }
}
