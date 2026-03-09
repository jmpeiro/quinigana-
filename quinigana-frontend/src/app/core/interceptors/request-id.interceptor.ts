import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Generates a UUID v4 string for request tracing.
 */
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * HTTP interceptor that attaches an X-Request-Id header to every outgoing request.
 * Logs the request ID in debug mode for easier troubleshooting.
 */
export const requestIdInterceptor: HttpInterceptorFn = (req, next) => {
  const requestId = generateUuid();

  const clonedReq = req.clone({
    setHeaders: { 'X-Request-Id': requestId },
  });

  if (environment.debug) {
    console.debug(
      `[RequestId] ${req.method} ${req.url} -> ${requestId}`
    );
  }

  return next(clonedReq);
};
