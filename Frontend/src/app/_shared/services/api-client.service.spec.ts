import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiError, ApiErrorCode } from '../models/api-error.model';
import { ApiClientService } from './api-client.service';
import { environment } from '../../../environments/environment';

describe('ApiClientService', () => {
  let service: ApiClientService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiClientService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('joins the base URL with a path that has no leading slash', () => {
    service.get('competitions').subscribe();
    const req = http.expectOne(`${environment.apiEndpoint}/competitions`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('joins the base URL with a path that already starts with a slash', () => {
    service.get('/competitions/featured').subscribe();
    const req = http.expectOne(`${environment.apiEndpoint}/competitions/featured`);
    req.flush({});
  });

  it('leaves absolute URLs untouched', () => {
    service.get('https://api.example.com/x').subscribe();
    const req = http.expectOne('https://api.example.com/x');
    req.flush({});
  });

  it('injects a fresh x-request-id on every call', () => {
    service.get('a').subscribe();
    service.get('b').subscribe();
    const requests = http.match(() => true);
    expect(requests.length).toBe(2);
    const idA = requests[0].request.headers.get('x-request-id');
    const idB = requests[1].request.headers.get('x-request-id');
    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();
    expect(idA).not.toBe(idB);
    requests.forEach((req) => req.flush({}));
  });

  it('merges caller-supplied headers without dropping the correlation id', () => {
    service.get('x', { headers: { 'x-custom': 'yes' } }).subscribe();
    const req = http.expectOne(`${environment.apiEndpoint}/x`);
    expect(req.request.headers.get('x-custom')).toBe('yes');
    expect(req.request.headers.get('x-request-id')).toBeTruthy();
    req.flush({});
  });

  it('serialises query params, supporting arrays', () => {
    service
      .get('search', { params: { q: 'rtx', limit: 5, tag: ['gpu', 'desktop'] } })
      .subscribe();
    const req = http.expectOne((r) => r.url === `${environment.apiEndpoint}/search`);
    expect(req.request.params.get('q')).toBe('rtx');
    expect(req.request.params.get('limit')).toBe('5');
    expect(req.request.params.getAll('tag')).toEqual(['gpu', 'desktop']);
    req.flush({});
  });

  it('issues post / put / delete with the right method', () => {
    service.post('x', { a: 1 }).subscribe();
    service.put('y', { b: 2 }).subscribe();
    service.delete('z').subscribe();
    const reqs = http.match(() => true);
    expect(reqs.map((r) => r.request.method)).toEqual(['POST', 'PUT', 'DELETE']);
    reqs.forEach((r) => r.flush({}));
  });

  it('maps backend error shape { code, message, fields } to ApiError', async () => {
    const promise = new Promise<ApiError>((resolve, reject) => {
      service.get('boom').subscribe({
        next: () => reject(new Error('expected failure')),
        error: (err: ApiError) => resolve(err),
      });
    });
    const req = http.expectOne(`${environment.apiEndpoint}/boom`);
    req.flush(
      { code: 'validation', message: 'Bad input', fields: { email: ['required'] } },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    const err = await promise;
    expect(err.status).toBe(422);
    expect(err.code).toBe('validation');
    expect(err.message).toBe('Bad input');
    expect(err.fields).toEqual({ email: ['required'] });
  });

  it('falls back to server code on 5xx without a body', async () => {
    const promise = new Promise<ApiError>((resolve) => {
      service.get('crash').subscribe({ error: (err: ApiError) => resolve(err) });
    });
    const req = http.expectOne(`${environment.apiEndpoint}/crash`);
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    const err = await promise;
    expect(err.status).toBe(500);
    expect(err.code).toBe(ApiErrorCode.Server);
  });

  it('reports a network failure as code "network"', async () => {
    const promise = new Promise<ApiError>((resolve) => {
      service.get('offline').subscribe({ error: (err: ApiError) => resolve(err) });
    });
    const req = http.expectOne(`${environment.apiEndpoint}/offline`);
    req.error(new ProgressEvent('error') as unknown as ErrorEvent, {
      status: 0,
      statusText: 'Unknown Error',
    });
    const err = await promise;
    expect(err.status).toBe(0);
    expect(err.code).toBe(ApiErrorCode.Network);
  });

  it('wraps non-HttpErrorResponse throwables in ApiError', async () => {
    // Hit the catch-all branch by feeding the private mapper a stray Error.
    const mapper = (service as unknown as {
      toApiError(e: unknown): { subscribe: (cb: { error(e: ApiError): void }) => void };
    }).toApiError(new Error('boom'));
    const err = await new Promise<ApiError>((resolve) =>
      mapper.subscribe({ error: (e) => resolve(e) }),
    );
    expect(err.status).toBe(0);
    expect(err.code).toBe(ApiErrorCode.Unknown);
    expect(err.rawMessage).toBe('boom');
  });
});