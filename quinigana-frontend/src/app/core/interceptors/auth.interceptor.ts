import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getAccessToken();

  // Clone request with credentials enabled to send cookies
  if (token && !req.url.includes('/auth/refresh')) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
  } else {
    // Even without token, send credentials for cookie-based auth
    req = req.clone({
      withCredentials: true,
    });
  }

  return next(req);
};
