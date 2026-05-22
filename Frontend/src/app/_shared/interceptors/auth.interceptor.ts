import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Endpoints the interceptor must NOT touch — they either issue tokens or
// belong to flows a signed-out visitor needs to reach. Match by path
// suffix so we tolerate version prefixes and a leading `/api`.
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/password-reset',
  '/auth/forgot-password',
  '/auth/refresh',
];

const isPublicAuthRequest = (url: string): boolean => {
  const path = stripQuery(url).toLowerCase();
  return PUBLIC_AUTH_PATHS.some((suffix) => path.endsWith(suffix));
};

const stripQuery = (url: string): string => {
  const queryAt = url.indexOf('?');
  return queryAt === -1 ? url : url.slice(0, queryAt);
};

const attachBearer = <T>(req: HttpRequest<T>, token: string): HttpRequest<T> =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

/**
 * Attaches the current JWT to outgoing requests, leaves public auth endpoints
 * alone, and recovers from a 401 by attempting a silent refresh once. A
 * second 401 — or a failed refresh — signs the user out and propagates the
 * original error so the caller can surface it.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (isPublicAuthRequest(req.url)) {
    return next(req);
  }

  const token = auth.accessToken();
  const initialRequest = token ? attachBearer(req, token) : req;

  return next(initialRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      return refreshAndRetry(req, error, auth, next);
    }),
  );
};

const refreshAndRetry = (
  original: HttpRequest<unknown>,
  firstError: HttpErrorResponse,
  auth: AuthService,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> =>
  from(auth.refreshSession().catch(() => false as const)).pipe(
    switchMap((refreshed) => {
      if (!refreshed) {
        auth.signOut();
        return throwError(() => firstError);
      }
      const rotated = auth.accessToken();
      const retried = rotated ? attachBearer(original, rotated) : original;
      return next(retried).pipe(
        catchError((retryError: unknown) => {
          if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
            auth.signOut();
          }
          return throwError(() => retryError);
        }),
      );
    }),
  );