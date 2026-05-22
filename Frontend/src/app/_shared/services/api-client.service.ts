import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiError, ApiErrorCode } from '../models/api-error.model';

export interface ApiRequestOptions {
  /** Query-string parameters. Values stringified by HttpClient. */
  params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
  /** Extra request headers. `x-request-id` is always injected automatically. */
  headers?: Record<string, string>;
}

const CORRELATION_HEADER = 'x-request-id';

/**
 * Thin centralised wrapper around Angular's `HttpClient`. Every call goes
 * through here so we can:
 *
 *   1. Compose paths against `environment.apiEndpoint` without repeating
 *      the base URL at every callsite.
 *   2. Stamp a fresh correlation id (`x-request-id`) per request so server
 *      logs and browser errors line up. Mirrors the pattern in Work/Backend.
 *   3. Normalise errors into a single `ApiError` shape (see BACKLOG F1.3),
 *      so feature services don't each invent their own error mapping.
 *
 * Endpoint-specific services (CompetitionsApiService, PcBuildsApiService,
 * …) should compose this rather than reaching for `HttpClient` directly.
 */
@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    const correlationId = this.newCorrelationId();
    return this.http
      .get<T>(this.buildUrl(path), this.buildOptions(options, correlationId))
      .pipe(catchError((error: unknown) => this.toApiError(error, correlationId)));
  }

  post<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: ApiRequestOptions,
  ): Observable<TResponse> {
    const correlationId = this.newCorrelationId();
    return this.http
      .post<TResponse>(this.buildUrl(path), body, this.buildOptions(options, correlationId))
      .pipe(catchError((error: unknown) => this.toApiError(error, correlationId)));
  }

  put<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: ApiRequestOptions,
  ): Observable<TResponse> {
    const correlationId = this.newCorrelationId();
    return this.http
      .put<TResponse>(this.buildUrl(path), body, this.buildOptions(options, correlationId))
      .pipe(catchError((error: unknown) => this.toApiError(error, correlationId)));
  }

  delete<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    const correlationId = this.newCorrelationId();
    return this.http
      .delete<T>(this.buildUrl(path), this.buildOptions(options, correlationId))
      .pipe(catchError((error: unknown) => this.toApiError(error, correlationId)));
  }

  /**
   * Joins the environment base URL with the request path. Leading slashes
   * on the path and trailing slashes on the base URL are both tolerated.
   */
  private buildUrl(path: string): string {
    const base = environment.apiEndpoint.replace(/\/+$/, '');
    if (/^https?:\/\//i.test(path)) {
      // Absolute URL — caller knows what they're doing.
      return path;
    }
    const suffix = path.startsWith('/') ? path : `/${path}`;
    return `${base}${suffix}`;
  }

  private buildOptions(
    options: ApiRequestOptions | undefined,
    correlationId: string,
  ): {
    headers: HttpHeaders;
    params?: HttpParams;
  } {
    let headers = new HttpHeaders({
      [CORRELATION_HEADER]: correlationId,
    });
    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers = headers.set(key, value);
      }
    }
    let params: HttpParams | undefined;
    if (options?.params) {
      params = new HttpParams();
      for (const [key, value] of Object.entries(options.params)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            params = params.append(key, String(item));
          }
        } else {
          params = params.set(key, String(value));
        }
      }
    }
    return params ? { headers, params } : { headers };
  }

  /**
   * Per-request id. Browsers expose `crypto.randomUUID` on secure contexts
   * (and on localhost); the timestamp fallback is for the odd SSR / unit
   * test runner that doesn't.
   */
  private newCorrelationId(): string {
    const cryptoApi = globalThis.crypto;
    if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
      return cryptoApi.randomUUID();
    }
    return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * Funnel every transport failure through one shape so component code can
   * branch on `code` instead of sniffing `HttpErrorResponse` internals.
   *
   * `correlationId` is the id we *sent* with the request. We prefer the id
   * the server *echoed* (if any — `HttpErrorResponse.headers` are response
   * headers), then fall back to the request-side id so the field is
   * usable even when the backend doesn't bounce it back.
   */
  private toApiError(error: unknown, requestCorrelationId: string): Observable<never> {
    if (!(error instanceof HttpErrorResponse)) {
      return throwError(() => ({
        status: 0,
        code: ApiErrorCode.Unknown,
        message: 'Unexpected error.',
        correlationId: requestCorrelationId,
        rawMessage: error instanceof Error ? error.message : String(error),
      } satisfies ApiError));
    }

    const correlationId =
      error.headers?.get(CORRELATION_HEADER) ?? requestCorrelationId;

    // Network failures surface as status === 0 with the original error in
    // `error.error` (typically a ProgressEvent). Distinguish them so the UI
    // can retry vs. fall through to the generic message.
    if (error.status === 0) {
      return throwError(() => ({
        status: 0,
        code: ApiErrorCode.Network,
        message: 'Network is unavailable. Check your connection and try again.',
        correlationId,
        rawMessage: error.message,
      } satisfies ApiError));
    }

    const body = error.error as
      | { code?: string; message?: string; fields?: Record<string, string[]> }
      | string
      | null
      | undefined;

    const code =
      (typeof body === 'object' && body?.code) ||
      (error.status >= 500 ? ApiErrorCode.Server : ApiErrorCode.Unknown);
    const message =
      (typeof body === 'object' && body?.message) ||
      (typeof body === 'string' && body) ||
      error.statusText ||
      'Request failed.';
    const fields = typeof body === 'object' ? body?.fields : undefined;

    return throwError(() => ({
      status: error.status,
      code,
      message,
      fields,
      correlationId,
      rawMessage: error.message,
    } satisfies ApiError));
  }
}