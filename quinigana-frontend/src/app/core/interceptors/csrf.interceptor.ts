import { HttpInterceptorFn } from '@angular/common/http';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

function readCsrfCookie(): string | null {
  const match = document.cookie
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${CSRF_COOKIE_NAME}=`));

  return match ? decodeURIComponent(match.substring(CSRF_COOKIE_NAME.length + 1)) : null;
}

/**
 * Sends the CSRF token back to the API using the double-submit cookie pattern.
 *
 * The backend sets a readable `csrf-token` cookie on login/register/google-callback
 * and requires the matching `X-CSRF-Token` header on the routes that consume the
 * refresh token cookie (logout, refresh). Without it those calls fail with 403.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return next(req);
  }

  const token = readCsrfCookie();

  if (token) {
    req = req.clone({ setHeaders: { [CSRF_HEADER_NAME]: token } });
  }

  return next(req);
};
