import type { AppUser, PasswordCriteria, UserAuthError, UserAuthGateway } from '@/application';
import { resolveUserProfile, type RegistrationInput } from '@/core/accounts';
import {
  authHeaders,
  clearUserSession,
  DEFAULT_PASSWORD_CRITERIA,
  fetchPasswordCriteria,
  readUserSession,
  saveUserSession,
} from './userSession';

/**
 * Site authentication against our server (/api/auth/*): the server verifies the password
 * (argon2 hash in auth/{uid}) and signs the session token; the device only stores that
 * token and asks the server who it belongs to. No account logic on the client.
 */

/** Server failure carrying the domain code the interface translates. */
class HttpAuthError extends Error {
  constructor(
    public code: string,
    public status: number
  ) {
    super(code);
  }
}

async function postJson(url: string, body: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new HttpAuthError('network', 0);
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new HttpAuthError(typeof data.error === 'string' ? data.error : 'unknown', res.status);
  return { status: res.status, data };
}

const guestUser = (uid: string): AppUser => ({ uid, email: null, emailVerified: false, isAnonymous: true });

/** The signed-in account of a server profile (guests never have one). */
function appUserOf(raw: unknown): AppUser | null {
  const profile = resolveUserProfile(raw);
  if (!profile || profile.isAnonymous) return null;
  return { uid: profile.uid, email: profile.email ?? null, emailVerified: true, isAnonymous: false };
}

let listeners = new Set<(user: AppUser | null) => void>();
let currentUser: AppUser | null = null;
let criteria: PasswordCriteria = DEFAULT_PASSWORD_CRITERIA;
let hydrated = false;

function emit(): void {
  for (const listener of listeners) listener(currentUser);
}

function setSession(
  user: AppUser | null,
  session: {
    token: string;
    uid: string;
    kind: 'guest' | 'client' | 'employee';
    expiresAt: number;
  } | null
): void {
  if (session) saveUserSession(session);
  else clearUserSession();
  currentUser = user;
  emit();
}

/** Reads the stored token back and asks the server who it belongs to (runs once per page). */
async function hydrate(): Promise<void> {
  hydrated = true;
  void fetchPasswordCriteria().then((c) => (criteria = c));
  const session = readUserSession();
  if (!session) {
    currentUser = null;
    emit();
    return;
  }
  if (session.kind === 'guest') {
    currentUser = guestUser(session.uid);
    emit();
    return;
  }
  try {
    const res = await fetch('/api/auth/me', { headers: authHeaders() });
    const data = (await res.json().catch(() => ({}))) as { user?: unknown };
    const user = res.ok ? appUserOf(data.user) : null;
    if (!user) clearUserSession(); // expired or revoked token: back to the signed-out state
    currentUser = user;
  } catch {
    // Offline: keep the stored session; the user stays signed in on this device
  }
  emit();
}

/** Site sessions served by our server (port UserAuthGateway). */
export const userAuthHttpGateway: UserAuthGateway = {
  get minPasswordLength(): number {
    return criteria.minLength;
  },
  async passwordCriteria(): Promise<PasswordCriteria> {
    if (!hydrated) await hydrate();
    return criteria;
  },
  subscribe(listener) {
    listeners.add(listener);
    if (!hydrated) void hydrate();
    else listener(currentUser);
    return () => listeners.delete(listener);
  },
  loginAsGuest: async () => {
    const { data } = await postJson('/api/auth/guest', {});
    setSession(guestUser(String(data.uid ?? '')), {
      token: String(data.token),
      uid: String(data.uid ?? ''),
      kind: 'guest',
      expiresAt: typeof data.expires_at === 'number' ? data.expires_at : Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
  },
  loginWithEmail: async (email, password) => {
    const { data } = await postJson('/api/auth/login', { email, password });
    setSession(appUserOf(data.user), {
      token: String(data.token),
      uid: String(data.uid),
      kind: data.kind === 'employee' ? 'employee' : 'client',
      expiresAt: typeof data.expires_at === 'number' ? data.expires_at : Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
  },
  register: async (input: RegistrationInput) => {
    const { data } = await postJson('/api/auth/register', input);
    setSession(appUserOf(data.user), {
      token: String(data.token),
      uid: String(data.uid),
      kind: 'client',
      expiresAt: typeof data.expires_at === 'number' ? data.expires_at : Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
  },
  logout: async () => {
    setSession(null, null);
  },
  errorCode(error: unknown): UserAuthError {
    const code = (error as HttpAuthError)?.code ?? '';
    switch (code) {
      case 'invalid-credentials':
        return 'invalid-credentials';
      case 'email-in-use':
        return 'email-in-use';
      case 'weak-password':
        return 'weak-password';
      case 'invalid-email':
        return 'invalid-email';
      case 'locked':
        return 'locked';
      case 'network':
        return 'network';
      case 'auth_unconfigured':
      case 'storage_unavailable':
        return 'disabled';
      default:
        // Too many requests and anything unexpected come from the HTTP status
        return (error as HttpAuthError)?.status === 429 ? 'too-many-attempts' : 'unknown';
    }
  },
  // The super admin signs in through the backoffice session, never through this gateway
  isSuperAdminAccount: (user) => user.uid === 'super-admin',
  changePassword: async (currentPassword, newPassword) => {
    // The server needs the session: only the signed-in account changes its own password
    let res: Response;
    try {
      res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ current: currentPassword, next: newPassword }),
      });
    } catch {
      throw new HttpAuthError('network', 0);
    }
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new HttpAuthError(typeof data.error === 'string' ? data.error : 'unknown', res.status);
  },
};

/** Clears the in-memory session state (tests only: the page never resets it). */
export function _resetUserAuthGatewayForTests(): void {
  listeners = new Set();
  currentUser = null;
  criteria = DEFAULT_PASSWORD_CRITERIA;
  hydrated = false;
}
