import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { from } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const http = inject(HttpClient);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
        return from(authService.refreshToken()).pipe(
          switchMap((success) => {
            if (success) {
              const token = tokenService.getAccessToken();
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` },
              });
              return next(retryReq);
            }
            return throwError(() => error);
          }),
          catchError(() => {
            authService.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
