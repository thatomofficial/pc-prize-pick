import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { signal } from '@angular/core';

import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

const API_URL = 'https://api.example.test/api/competitions';
const LOGIN_URL = 'https://api.example.test/api/auth/login';
const REGISTER_URL = 'https://api.example.test/api/auth/register';
const RESET_URL = 'https://api.example.test/api/auth/password-reset';

class FakeAuthService {
  private readonly tokenSignal = signal<string | null>(null);
  readonly accessToken = this.tokenSignal.asReadonly();

  refreshSession = vi.fn(async () => false);
  signOut = vi.fn(() => {
    this.tokenSignal.set(null);
  });

  setToken(value: string | null): void {
    this.tokenSignal.set(value);
  }
}

describe('authInterceptor', () => {
  let auth: FakeAuthService;
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    auth = new FakeAuthService();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('attaches Authorization: Bearer when a token is present', () => {
    auth.setToken('jwt-abc');
    http.get(API_URL).subscribe();
    const req = httpMock.expectOne(API_URL);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-abc');
    req.flush({});
  });

  it('omits Authorization when no token is set', () => {
    http.get(API_URL).subscribe();
    const req = httpMock.expectOne(API_URL);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('skips public auth endpoints even when a token is present', () => {
    auth.setToken('jwt-abc');
    http.post(LOGIN_URL, {}).subscribe();
    http.post(REGISTER_URL, {}).subscribe();
    http.post(RESET_URL, {}).subscribe();
    for (const url of [LOGIN_URL, REGISTER_URL, RESET_URL]) {
      const req = httpMock.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    }
  });

  it('attempts a silent refresh on 401 and retries the request with the new token', async () => {
    auth.setToken('stale-token');
    auth.refreshSession.mockImplementation(async () => {
      auth.setToken('fresh-token');
      return true;
    });

    const result = new Promise<unknown>((resolve, reject) => {
      http.get(API_URL).subscribe({ next: resolve, error: reject });
    });

    const firstAttempt = httpMock.expectOne(API_URL);
    expect(firstAttempt.request.headers.get('Authorization')).toBe('Bearer stale-token');
    firstAttempt.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    await Promise.resolve();
    await Promise.resolve();

    const retried = httpMock.expectOne(API_URL);
    expect(retried.request.headers.get('Authorization')).toBe('Bearer fresh-token');
    retried.flush({ ok: true });

    await expect(result).resolves.toEqual({ ok: true });
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('signs out and propagates when refresh fails', async () => {
    auth.setToken('stale-token');
    auth.refreshSession.mockResolvedValue(false);

    const result = new Promise<unknown>((resolve, reject) => {
      http.get(API_URL).subscribe({ next: resolve, error: reject });
    });

    const firstAttempt = httpMock.expectOne(API_URL);
    firstAttempt.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    await expect(result).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    httpMock.expectNone(API_URL);
  });

  it('signs out and propagates the second 401 after a successful refresh', async () => {
    auth.setToken('stale-token');
    auth.refreshSession.mockImplementation(async () => {
      auth.setToken('fresh-token');
      return true;
    });

    const result = new Promise<unknown>((resolve, reject) => {
      http.get(API_URL).subscribe({ next: resolve, error: reject });
    });

    const firstAttempt = httpMock.expectOne(API_URL);
    firstAttempt.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    await Promise.resolve();
    await Promise.resolve();

    const retried = httpMock.expectOne(API_URL);
    retried.flush('still nope', { status: 401, statusText: 'Unauthorized' });

    await expect(result).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('does not attempt refresh on non-401 errors', async () => {
    auth.setToken('jwt-abc');

    const result = new Promise<unknown>((resolve, reject) => {
      http.get(API_URL).subscribe({ next: resolve, error: reject });
    });

    const req = httpMock.expectOne(API_URL);
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    await expect(result).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(auth.refreshSession).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});
