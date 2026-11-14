/**
 * Session of the site visitor on the device (guests, clients, employees).
 *
 * The browser never decides who is signed in: it only stores the signed token returned by
 * the server and sends it to /api/auth/me, which answers with the account it belongs to.
 * localStorage keeps the visitor signed in across app restarts (the PWA use case); the
 * expiry mirrors the token lifetime so a stale session is dropped without a round trip.
 */

import type { PasswordCriteria } from '@/application';

export type UserSessionKind = 'guest' | 'client' | 'employee';

interface StoredUserSession {
  token: string;
  /** uid of the session owner (guests keep their `guest:<random>` sub) */
  uid: string;
  kind: UserSessionKind;
  /** ms since epoch; a past value means the session is dropped */
  expiresAt: number;
}

const KEY = 'user_session';

export function readUserSession(): StoredUserSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredUserSession>;
    if (
      typeof parsed.token !== 'string' ||
      typeof parsed.uid !== 'string' ||
      (parsed.kind !== 'guest' && parsed.kind !== 'client' && parsed.kind !== 'employee') ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null;
    }
    if (parsed.expiresAt <= Date.now()) {
      clearUserSession();
      return null;
    }
    return parsed as StoredUserSession;
  } catch {
    return null;
  }
}

export function saveUserSession(session: {
  token: string;
  uid: string;
  kind: UserSessionKind;
  expiresAt: number;
}): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* private mode: the session lives for the tab only */
  }
}

export function clearUserSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clean */
  }
}

/** Sends the stored session to an endpoint; null when the visitor has none. */
export function authHeaders(): Record<string, string> {
  const session = readUserSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

/** Client-safe password criteria served by /api/auth/password-criteria. */
export const DEFAULT_PASSWORD_CRITERIA: PasswordCriteria = {
  minLength: 8,
  digit: false,
  uppercase: false,
  special: false,
};

export async function fetchPasswordCriteria(): Promise<PasswordCriteria> {
  try {
    const res = await fetch('/api/auth/password-criteria');
    if (!res.ok) return DEFAULT_PASSWORD_CRITERIA;
    const data = (await res.json()) as { criteria?: Record<string, unknown> };
    const c = data.criteria ?? {};
    return {
      minLength:
        typeof c.min_length === 'number' && c.min_length > 0 ? c.min_length : DEFAULT_PASSWORD_CRITERIA.minLength,
      digit: c.require_digit === true,
      uppercase: c.require_uppercase === true,
      special: c.require_special === true,
    };
  } catch {
    return DEFAULT_PASSWORD_CRITERIA;
  }
}
