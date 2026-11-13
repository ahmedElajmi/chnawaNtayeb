import { signInWithCustomToken, signOut } from 'firebase/auth';
import { auth } from '@/infrastructure/firebase/client';

/**
 * Patron (admin) session on the client.
 *
 * The browser never decides who is admin: it only stores the signed token
 * returned by the server and asks the server to verify it. A token that was
 * invented or edited by hand is rejected by /api/auth/patron-verify.
 */

const TOKEN_KEY = 'patron_session_token';
const PATRON_FIREBASE_UID = 'patron-admin';

import type { CloudStatus, PatronLoginError, PatronLoginResult } from '@/application';

export function getPatronToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setPatronToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearPatronToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem('patron_username'); // legacy key
  } catch {}
}

async function connectFirebase(firebaseToken: string | null | undefined): Promise<CloudStatus> {
  if (!firebaseToken) return 'local-only';
  try {
    await signInWithCustomToken(auth, firebaseToken);
    return 'connected';
  } catch (err) {
    console.warn('[patron] Connexion Firebase impossible :', err);
    return 'local-only';
  }
}

/** Server answer → domain code (the server's own message is never shown: the interface translates). */
function loginErrorOf(status: number): PatronLoginError {
  if (status === 429) return 'too-many-attempts';
  if (status === 400 || status === 401 || status === 403) return 'invalid';
  return 'unavailable';
}

export async function loginPatron(username: string, password: string): Promise<PatronLoginResult> {
  let res: Response;
  try {
    res = await fetch('/api/auth/patron-login', {
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

  setPatronToken(data.token);
  return { ok: true, cloud: await connectFirebase(data.firebaseToken) };
}

/** Asks the server whether the stored token is still valid. Clears it when it is not. */
export async function verifyPatronSession(): Promise<boolean> {
  const token = getPatronToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/auth/patron-verify', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) return true;
    if (res.status === 401) clearPatronToken();
    return false;
  } catch {
    return false; // offline: keep the token, but do not open the backoffice
  }
}

/** Makes sure the Firebase identity has the patron claim (needed after a page reload). */
export async function ensurePatronCloudSession(): Promise<CloudStatus> {
  const current = auth.currentUser;
  if (current?.uid === PATRON_FIREBASE_UID) {
    const result = await current.getIdTokenResult().catch(() => null);
    if (result?.claims.patron === true) return 'connected';
  }
  const token = getPatronToken();
  if (!token) return 'local-only';
  try {
    const res = await fetch('/api/auth/patron-firebase-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return 'local-only';
    const data = await res.json();
    return connectFirebase(data.firebaseToken);
  } catch {
    return 'local-only';
  }
}

export async function logoutPatron(): Promise<void> {
  clearPatronToken();
  if (auth.currentUser?.uid === PATRON_FIREBASE_UID) {
    await signOut(auth).catch(() => {});
  }
}
