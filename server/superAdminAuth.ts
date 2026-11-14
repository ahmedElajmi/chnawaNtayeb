import crypto from 'crypto';

/**
 * super-admin (admin) authentication for the /admin backoffice.
 *
 * - The password only lives in the server environment (ADMIN_PASSWORD).
 * - A successful login returns a session token signed with HMAC-SHA256
 *   (ADMIN_SESSION_SECRET). Anyone can read the token, but nobody can forge
 *   or modify it without the secret, and it expires after SESSION_TTL_MS.
 */

export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const KNOWN_LEAKED_PASSWORDS = new Set(['patron2026!', 'admin', 'password', 'changeme']);
const MIN_PASSWORD_LENGTH = 12;
const MIN_SECRET_LENGTH = 32;

export type SuperAdminConfig =
  { ok: true; username: string; password: string; secret: string } | { ok: false; reason: string };

export function getSuperAdminConfig(env: NodeJS.ProcessEnv = process.env): SuperAdminConfig {
  const username = (env.ADMIN_USERNAME || 'admin').trim();
  const password = env.ADMIN_PASSWORD || '';
  const secret = env.ADMIN_SESSION_SECRET || '';

  if (!password) return { ok: false, reason: 'ADMIN_PASSWORD manquant' };
  if (KNOWN_LEAKED_PASSWORDS.has(password)) {
    return { ok: false, reason: 'ADMIN_PASSWORD utilise une valeur publique/connue : choisissez-en un nouveau' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, reason: `ADMIN_PASSWORD doit faire au moins ${MIN_PASSWORD_LENGTH} caractères` };
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    return { ok: false, reason: `ADMIN_SESSION_SECRET doit faire au moins ${MIN_SECRET_LENGTH} caractères` };
  }
  return { ok: true, username, password, secret };
}

/** Constant-time comparison, also safe when lengths differ (compares SHA-256 digests). */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hb = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

export interface SessionPayload {
  sub: string; // username
  role: 'admin';
  iat: number; // issued at (ms)
  exp: number; // expires at (ms)
}

function sign(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

export function createSessionToken(
  username: string,
  secret: string,
  now = Date.now()
): { token: string; payload: SessionPayload } {
  const payload: SessionPayload = { sub: username, role: 'admin', iat: now, exp: now + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return { token: `${body}.${sign(body, secret)}`, payload };
}

export function verifySessionToken(token: unknown, secret: string, now = Date.now()): SessionPayload | null {
  if (typeof token !== 'string' || token.length > 1024) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, signature] = parts;

  const expected = sign(body, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (payload.role !== 'admin' || typeof payload.exp !== 'number' || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
}
