import type { BackofficeLoginError, BackofficeLoginResult } from '@/application';

/**
 * super-admin (admin) session on the client.
 *
 * The browser never decides who is admin: it only stores the signed token returned by
 * the server and asks the server to verify it. A token that was invented or edited by
 * hand is rejected by /admin/api/verify. With this session, every write goes through the
 * data endpoints — no cloud identity is involved anywhere.
 */

const TOKEN_KEY = 'super_admin_session_token';

export function getBackofficeToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setBackofficeToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearBackofficeToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem('patron_username'); // legacy key
  } catch {}
}

/** Server answer → domain code (the server's own message is never shown: the interface translates). */
function loginErrorOf(status: number): BackofficeLoginError {
  if (status === 429) return 'too-many-attempts';
  if (status === 400 || status === 401 || status === 403) return 'invalid';
  return 'unavailable';
}

export async function loginBackoffice(username: string, password: string): Promise<BackofficeLoginResult> {
  let res: Response;
  try {
    res = await fetch('/admin/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    // No offline fallback on purpose: only the server can grant admin access
    return { ok: false, error: 'unreachable' };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success || typeof data.token !== 'string') {
    return { ok: false, error: loginErrorOf(res.status) };
  }

  setBackofficeToken(data.token);
  // The session itself is the write authority now: the server checks it on every request
  return { ok: true, cloud: 'connected' };
}

/** Asks the server whether the stored token is still valid. Clears it when it is not. */
export async function verifyBackofficeSession(): Promise<boolean> {
  const token = getBackofficeToken();
  if (!token) return false;
  try {
    const res = await fetch('/admin/api/verify', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) return true;
    if (res.status === 401) clearBackofficeToken();
    return false;
  } catch {
    return false; // offline: keep the token, but do not open the backoffice
  }
}

export async function logoutBackoffice(): Promise<void> {
  clearBackofficeToken();
}
