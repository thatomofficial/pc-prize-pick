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

const STORAGE_KEY = 'pcp.auth.user';
// Browser stalls feel more real than instant; matches a typical SA network.
const FAKE_LATENCY_MS = 700;
// Deliberately easy to demo — any password of 6+ chars works, except for
// this address which always returns invalid credentials so the error path is
// reachable without code changes.
const ALWAYS_FAILS_EMAIL = 'wrong@test.com';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSignal = signal<User | null>(this.loadFromStorage());

  readonly currentUser = this.userSignal.asReadonly();
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
    const user: User = {
      id: `mock-${Date.now().toString(36)}`,
      email: normalisedEmail,
      displayName: deriveDisplayNameFromEmail(normalisedEmail),
      cellPhone: '',
    };
    this.userSignal.set(user);
    this.persist(user);
    return user;
  }

  async signUp(
    email: string,
    password: string,
    displayName: string,
    cellPhone: string,
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
    const user: User = {
      id: `mock-${Date.now().toString(36)}`,
      email: normalisedEmail,
      displayName: displayName.trim() || deriveDisplayNameFromEmail(normalisedEmail),
      cellPhone: normalisedPhone,
    };
    this.userSignal.set(user);
    this.persist(user);
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

  signOut(): void {
    this.userSignal.set(null);
    this.clearStorage();
  }

  private loadFromStorage(): User | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private persist(user: User): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Quota exceeded or storage unavailable — silently ignore for mock.
    }
  }

  private clearStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
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
