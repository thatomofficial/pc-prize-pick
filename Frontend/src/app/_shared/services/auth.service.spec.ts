import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

const USER_KEY = 'pcp.auth.user';
const ACCESS_KEY = 'pcp.auth.accessToken';
const REFRESH_KEY = 'pcp.auth.refreshToken';

const validStoredUser = {
  id: 'mock-1',
  email: 'ada@example.com',
  displayName: 'Ada',
  cellPhone: '+27821234567',
  acceptedTermsAt: '2026-01-01T00:00:00.000Z',
  acceptedPrivacyAt: '2026-01-01T00:00:00.000Z',
};

/**
 * The Angular unit-test runner doesn't seed `globalThis.localStorage` with a
 * real WHATWG Storage — it's `undefined` at module-load time. Install a
 * minimal in-memory shim before each spec so the AuthService constructor
 * can read/write the way it would in a browser.
 */
const installLocalStorageShim = (): void => {
  const data = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    getItem: (key: string) => (data.has(key) ? data.get(key)! : null),
    setItem: (key: string, value: string) => {
      data.set(key, String(value));
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
};

const clearAuthStorage = (): void => {
  for (const key of [USER_KEY, ACCESS_KEY, REFRESH_KEY]) {
    localStorage.removeItem(key);
  }
};

describe('AuthService session restore', () => {
  beforeEach(() => {
    installLocalStorageShim();
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    clearAuthStorage();
  });

  it('restores a fully-formed stored user', () => {
    localStorage.setItem(USER_KEY, JSON.stringify(validStoredUser));
    localStorage.setItem(ACCESS_KEY, 'stored-access');
    localStorage.setItem(REFRESH_KEY, 'stored-refresh');

    TestBed.configureTestingModule({});
    const auth = TestBed.inject(AuthService);

    expect(auth.currentUser()).toEqual(validStoredUser);
    expect(auth.accessToken()).toBe('stored-access');
    expect(auth.isAuthed()).toBe(true);
  });

  it('restores a legacy entry with null consent timestamps (legacy account)', () => {
    const legacyButValid = {
      ...validStoredUser,
      acceptedTermsAt: null,
      acceptedPrivacyAt: null,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(legacyButValid));
    localStorage.setItem(ACCESS_KEY, 'live-access');

    TestBed.configureTestingModule({});
    const auth = TestBed.inject(AuthService);

    expect(auth.currentUser()).toEqual(legacyButValid);
    expect(auth.isAuthed()).toBe(true);
    expect(auth.accessToken()).toBe('live-access');
  });

  it('purges legacy entries missing required fields (no cellPhone)', () => {
    const legacy = {
      id: 'mock-legacy',
      email: 'old@example.com',
      displayName: 'Old',
      // cellPhone, acceptedTermsAt, acceptedPrivacyAt are missing — this
      // is exactly the shape a build prior to this PR would have written.
    };
    localStorage.setItem(USER_KEY, JSON.stringify(legacy));
    localStorage.setItem(ACCESS_KEY, 'stale-access');
    localStorage.setItem(REFRESH_KEY, 'stale-refresh');

    TestBed.configureTestingModule({});
    const auth = TestBed.inject(AuthService);

    expect(auth.currentUser()).toBeNull();
    expect(auth.isAuthed()).toBe(false);
    expect(auth.accessToken()).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
  });

  it('purges entries where required fields are the wrong type', () => {
    const malformed = {
      id: 'mock-1',
      email: 'ada@example.com',
      displayName: 'Ada',
      cellPhone: 12345, // wrong type — older build serialised a number
      acceptedTermsAt: '2026-01-01T00:00:00.000Z',
      acceptedPrivacyAt: '2026-01-01T00:00:00.000Z',
    };
    localStorage.setItem(USER_KEY, JSON.stringify(malformed));

    TestBed.configureTestingModule({});
    const auth = TestBed.inject(AuthService);

    expect(auth.currentUser()).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it('purges entries that are not even JSON', () => {
    localStorage.setItem(USER_KEY, '{not valid json');
    localStorage.setItem(ACCESS_KEY, 'stranded-access');

    TestBed.configureTestingModule({});
    const auth = TestBed.inject(AuthService);

    expect(auth.currentUser()).toBeNull();
    expect(auth.accessToken()).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
  });

  it('starts unauthenticated when nothing is stored', () => {
    TestBed.configureTestingModule({});
    const auth = TestBed.inject(AuthService);

    expect(auth.currentUser()).toBeNull();
    expect(auth.isAuthed()).toBe(false);
    expect(auth.accessToken()).toBeNull();
  });
});
