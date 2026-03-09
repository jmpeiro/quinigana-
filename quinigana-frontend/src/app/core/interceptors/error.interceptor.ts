import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { from } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Maps HTTP status codes to user-friendly Spanish error messages.
 */
function getErrorMessage(status: number, serverMessage?: string): string {
  switch (status) {
    case 0:
      return 'No se pudo conectar con el servidor. Verifica tu conexion a internet.';
    case 400:
      return serverMessage || 'La solicitud no es valida. Revisa los datos enviados.';
    case 403:
      return 'No tienes permisos para realizar esta accion.';
    case 404:
      return 'El recurso solicitado no fue encontrado.';
    case 408:
      return 'La solicitud ha expirado. Intenta de nuevo.';
    case 409:
      return serverMessage || 'Conflicto con el estado actual del recurso.';
    case 422:
      return serverMessage || 'Los datos enviados no son validos.';
    case 429:
      return 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.';
    case 500:
      return 'Error interno del servidor. Nuestro equipo ha sido notificado.';
    case 502:
    case 503:
      return 'El servicio no esta disponible temporalmente. Intenta mas tarde.';
    default:
      return serverMessage || 'Ha ocurrido un error inesperado.';
  }
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const http = inject(HttpClient);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error) => {
      // Extract request ID from the request header (set by request-id interceptor)
      const requestId = req.headers.get('X-Request-Id') || undefined;
      const serverMessage = error?.error?.message;

      // Handle 401 - token refresh
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

      // Handle 500+ server errors
      if (error.status >= 500) {
        const userMessage = getErrorMessage(error.status, serverMessage);
        const refSuffix = requestId ? ` (Ref: ${requestId.substring(0, 8)})` : '';

        snackBar.open(userMessage + refSuffix, 'OK', {
          duration: 6000,
          panelClass: 'snackbar-error',
        });

        if (environment.debug) {
          console.error(`[HTTP Error] ${error.status} ${req.method} ${req.url}`, {
            requestId,
            error: error.error,
          });
        }

        return throwError(() => ({ ...error, requestId }));
      }

      // Handle other client errors (400, 403, 404, 422, 429, etc.) — skip 401 already handled
      if (error.status !== 401) {
        const userMessage = getErrorMessage(error.status, serverMessage);
        const refSuffix = requestId ? ` (Ref: ${requestId.substring(0, 8)})` : '';

        snackBar.open(userMessage + refSuffix, 'OK', {
          duration: 5000,
          panelClass: 'snackbar-error',
        });

        if (environment.debug) {
          console.warn(`[HTTP Error] ${error.status} ${req.method} ${req.url}`, {
            requestId,
            error: error.error,
          });
        }
      }

      return throwError(() => ({ ...error, requestId }));
    })
  );
};
