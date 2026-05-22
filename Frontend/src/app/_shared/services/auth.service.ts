import { Injectable, computed, signal } from '@angular/core';
import { User, deriveInitials, isValidSaMobile, normaliseCellPhone } from '../models/user.model';

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password.');
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('That email is already registered. Try signing in instead.');
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class InvalidCellPhoneError extends Error {
  constructor() {
    super('Enter a valid SA mobile number (0XX… or +27XX…).');
    this.name = 'InvalidCellPhoneError';
  }
}

export class ConsentRequiredError extends Error {
  constructor() {
    super('You must accept the Terms of Use and Privacy Policy to register.');
    this.name = 'ConsentRequiredError';
  }
}

const USER_STORAGE_KEY = 'pcp.auth.user';
const ACCESS_TOKEN_STORAGE_KEY = 'pcp.auth.accessToken';
const REFRESH_TOKEN_STORAGE_KEY = 'pcp.auth.refreshToken';
// Browser stalls feel more real than instant; matches a typical SA network.
const FAKE_LATENCY_MS = 700;
// Deliberately easy to demo — any password of 6+ chars works, except for
// this address which always returns invalid credentials so the error path is
// reachable without code changes.
const ALWAYS_FAILS_EMAIL = 'wrong@test.com';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSignal = signal<User | null>(this.loadUserFromStorage());
  private readonly accessTokenSignal = signal<string | null>(this.loadStored(ACCESS_TOKEN_STORAGE_KEY));
  private refreshTokenValue: string | null = this.loadStored(REFRESH_TOKEN_STORAGE_KEY);

  readonly currentUser = this.userSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly isAuthed = computed(() => this.userSignal() !== null);
  readonly initials = computed(() => {
    const user = this.userSignal();
    return user ? deriveInitials(user.displayName) : '';
  });

  async signIn(email: string, password: string): Promise<User> {
    await wait(FAKE_LATENCY_MS);
    const normalisedEmail = email.trim().toLowerCase();
    if (normalisedEmail === ALWAYS_FAILS_EMAIL) {
      throw new InvalidCredentialsError();
    }
    if (password.length < 6) {
      throw new InvalidCredentialsError();
    }
    const now = new Date().toISOString();
    const user: User = {
      id: `mock-${Date.now().toString(36)}`,
      email: normalisedEmail,
      displayName: deriveDisplayNameFromEmail(normalisedEmail),
      cellPhone: '',
      // Mock sign-in doesn't re-collect consent — assume the existing
      // account already has it on file. Stamp `now` so the shape is
      // non-null for downstream consumers.
      acceptedTermsAt: now,
      acceptedPrivacyAt: now,
    };
    this.applySession(user);
    return user;
  }

  async signUp(
    email: string,
    password: string,
    displayName: string,
    cellPhone: string,
    acceptedTermsOfUse: boolean,
    acceptedPrivacyPolicy: boolean,
  ): Promise<User> {
    await wait(FAKE_LATENCY_MS);
    const normalisedEmail = email.trim().toLowerCase();
    if (normalisedEmail === ALWAYS_FAILS_EMAIL) {
      throw new EmailAlreadyRegisteredError();
    }
    const normalisedPhone = normaliseCellPhone(cellPhone);
    if (!isValidSaMobile(normalisedPhone)) {
      throw new InvalidCellPhoneError();
    }
    if (!acceptedTermsOfUse || !acceptedPrivacyPolicy) {
      throw new ConsentRequiredError();
    }
    const now = new Date().toISOString();
    const user: User = {
      id: `mock-${Date.now().toString(36)}`,
      email: normalisedEmail,
      displayName: displayName.trim() || deriveDisplayNameFromEmail(normalisedEmail),
      cellPhone: normalisedPhone,
      acceptedTermsAt: now,
      acceptedPrivacyAt: now,
    };
    this.applySession(user);
    return user;
  }

  /**
   * Mock password reset request. Always succeeds (security pattern: never
   * leak whether an account exists). Real impl would queue an email.
   */
  async requestPasswordReset(email: string): Promise<void> {
    await wait(FAKE_LATENCY_MS);
    // eslint-disable-next-line no-console
    console.log('[mock-auth] password reset requested for', email);
  }

  /**
   * Exchange the refresh token for a fresh access token. Returns `true` when
   * a new access token is now in `accessToken()`. The HTTP `authInterceptor`
   * calls this once on a 401 before giving up and signing the user out.
   *
   * Mock implementation: succeeds whenever a refresh token is present.
   * Real impl (F2.3) will POST to `/auth/refresh` and time the rotation.
   */
  async refreshSession(): Promise<boolean> {
    await wait(FAKE_LATENCY_MS);
    const user = this.userSignal();
    if (!user || !this.refreshTokenValue) return false;
    const refreshed = generateMockJwt(user.id);
    this.accessTokenSignal.set(refreshed);
    this.persist(ACCESS_TOKEN_STORAGE_KEY, refreshed);
    return true;
  }

  signOut(): void {
    this.userSignal.set(null);
    this.accessTokenSignal.set(null);
    this.refreshTokenValue = null;
    this.clearStorage(USER_STORAGE_KEY);
    this.clearStorage(ACCESS_TOKEN_STORAGE_KEY);
    this.clearStorage(REFRESH_TOKEN_STORAGE_KEY);
  }

  private applySession(user: User): void {
    const access = generateMockJwt(user.id);
    const refresh = generateMockRefresh(user.id);
    this.userSignal.set(user);
    this.accessTokenSignal.set(access);
    this.refreshTokenValue = refresh;
    this.persist(USER_STORAGE_KEY, JSON.stringify(user));
    this.persist(ACCESS_TOKEN_STORAGE_KEY, access);
    this.persist(REFRESH_TOKEN_STORAGE_KEY, refresh);
  }

  /**
   * Parse the persisted user blob and validate every required field is
   * present + the right type before handing it back. Old localStorage
   * entries from prior schemas (no cellPhone, no consent timestamps) would
   * otherwise deserialise into half-populated `User` objects, making
   * `isAuthed()` true while downstream code reads `undefined`. When we
   * detect a stale shape we purge the whole session — user + both tokens —
   * so the next sign-in starts from a clean state.
   */
  private loadUserFromStorage(): User | null {
    const raw = this.loadStored(USER_STORAGE_KEY);
    if (!raw) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.clearStaleSession();
      return null;
    }
    if (!isValidStoredUser(parsed)) {
      this.clearStaleSession();
      return null;
    }
    return parsed;
  }

  private clearStaleSession(): void {
    this.clearStorage(USER_STORAGE_KEY);
    this.clearStorage(ACCESS_TOKEN_STORAGE_KEY);
    this.clearStorage(REFRESH_TOKEN_STORAGE_KEY);
  }

  private loadStored(key: string): string | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private persist(key: string, value: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Quota exceeded or storage unavailable — silently ignore for mock.
    }
  }

  private clearStorage(key: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

const deriveDisplayNameFromEmail = (email: string): string => {
  const local = email.split('@')[0] ?? email;
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter((p) => p.length > 0)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
};

/**
 * Runtime shape guard for what we pulled out of localStorage. Required
 * fields must be present and the right primitive — anything else is
 * treated as a stale blob from an older build and discarded.
 *
 * `cellPhone` is allowed to be an empty string because the existing
 * sign-in flow stamps it that way (registration is the only place that
 * collects it), but we still require it to *exist* as a string so newer
 * code can rely on `user.cellPhone` not being `undefined`.
 */
const isValidStoredUser = (value: unknown): value is User => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'string' &&
    candidate['id'].length > 0 &&
    typeof candidate['email'] === 'string' &&
    candidate['email'].length > 0 &&
    typeof candidate['displayName'] === 'string' &&
    typeof candidate['cellPhone'] === 'string' &&
    typeof candidate['acceptedTermsAt'] === 'string' &&
    candidate['acceptedTermsAt'].length > 0 &&
    typeof candidate['acceptedPrivacyAt'] === 'string' &&
    candidate['acceptedPrivacyAt'].length > 0
  );
};

// Mock JWT shaped like header.payload.signature so the interceptor and
// downstream code can treat it as a real bearer. Not signed — F2.1 will
// replace this once a real backend issues tokens.
const generateMockJwt = (subject: string): string => {
  const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({ sub: subject, iat: nowSeconds, exp: nowSeconds + 3600 }),
  );
  return `${header}.${payload}.mock`;
};

const generateMockRefresh = (subject: string): string =>
  base64UrlEncode(`${subject}:${Date.now()}:refresh`);

const base64UrlEncode = (input: string): string => {
  if (typeof btoa !== 'function') {
    // Browser-only mock; bail out with a stable placeholder rather than
    // dragging in a polyfill we don't otherwise need.
    return 'unsupported';
  }
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};