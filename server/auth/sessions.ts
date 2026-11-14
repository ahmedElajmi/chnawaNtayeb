import crypto from 'crypto';

/**
 * User sessions of the site (guests, clients, employees): HMAC-signed tokens issued by the
 * server, sharing the backoffice session secret. The super-admin backoffice token keeps its
 * own shape (server/backofficeAuth.ts); every other identity goes through this module.
 */

export type UserSessionKind = 'guest' | 'client' | 'employee';

export interface UserSessionPayload {
  sub: string; // uid ('guest:<random>' for guests, the account uid otherwise)
  kind: UserSessionKind;
  iat: number;
  exp: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Guest sessions renew monthly; clients keep 30 days; employees 8 hours (backoffice access). */
export function sessionTtl(kind: UserSessionKind): number {
  if (kind === 'employee') return 8 * 60 * 60 * 1000;
  return 30 * DAY_MS;
}

function sign(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

export function createUserSessionToken(
  kind: UserSessionKind,
  sub: string,
  secret: string,
  now = Date.now()
): { token: string; payload: UserSessionPayload } {
  const payload: UserSessionPayload = { sub, kind, iat: now, exp: now + sessionTtl(kind) };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return { token: `${body}.${sign(body, secret)}`, payload };
}

export function verifyUserSessionToken(token: unknown, secret: string, now = Date.now()): UserSessionPayload | null {
  if (typeof token !== 'string' || token.length > 1024) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  const expected = sign(body, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as UserSessionPayload;
    if (typeof payload.sub !== 'string' || typeof payload.kind !== 'string') return null;
    if (payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Anonymous identity of a visitor without an account: a random, unguessable sub. */
export function newGuestSub(): string {
  return `guest:${crypto.randomBytes(16).toString('hex')}`;
}
