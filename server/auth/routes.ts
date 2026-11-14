import express from 'express';
import rateLimit from 'express-rate-limit';
import type { CountryRecord } from '../../src/core/accounts';
import type { DataStore } from '../storage/types';
import type { BackofficeAuthConfig } from '../backofficeAuth';
import { resolveIdentity } from '../storage/identity';
import {
  AuthError,
  changePassword,
  createAccount,
  readProfile,
  saveSyncLists,
  unlockAccount,
  updateProfile,
  verifyLogin,
} from './users';
import { DEFAULT_POLICY, getPolicy, mergePolicy, savePolicy } from './policy';
import { createUserSessionToken, newGuestSub, verifyUserSessionToken, type UserSessionKind } from './sessions';

/**
 * Site authentication, served by the server alone: registration, login, guest sessions,
 * profile, password change and the password policy. The password hashes live in auth/{uid}
 * (server-only collection) hashed with the configured algorithm — never Firebase Auth.
 */

function authErrorStatus(code: AuthError['code']): number {
  if (code === 'locked') return 423;
  if (code === 'weak-password' || code === 'invalid-input' || code === 'email-in-use') return 400;
  return 401;
}

function bearer(req: express.Request): string | null {
  const header = req.headers.authorization;
  return typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
}

/** Reads the caller's user session (guests, clients, employees); null otherwise. */
function readUserSession(req: express.Request, secret: string) {
  return verifyUserSessionToken(bearer(req), secret);
}

export function authRoutes(
  adminConfig: BackofficeAuthConfig,
  store: DataStore | null,
  countries: () => Promise<readonly CountryRecord[]>
): express.Router {
  const router = express.Router();

  // Password guessing is expensive by design: strict IP limits on the two sensitive endpoints
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });
  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });
  const writeLimiter = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false });

  const unavailable = (res: express.Response) => res.status(503).json({ ok: false, error: 'storage_unavailable' });
  // User sessions share the backoffice secret: no configured secret, no auth at all
  const secret = (): string | null => (adminConfig.ok ? adminConfig.secret : null);
  const unconfigured = (res: express.Response) => res.status(503).json({ ok: false, error: 'auth_unconfigured' });
  const fail = (res: express.Response, error: unknown) => {
    const code = error instanceof AuthError ? error.code : 'unknown';
    return res.status(authErrorStatus(code)).json({ ok: false, error: code });
  };
  const setSessionCookie = (res: express.Response, token: string) => {
    res.setHeader('X-Session-Token', token);
    res.setHeader('Cache-Control', 'no-store');
  };

  router.post('/api/auth/register', registerLimiter, async (req, res) => {
    if (!secret()) return unconfigured(res);
    if (!store) return unavailable(res);
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const input = {
        email: String(body.email ?? ''),
        password: String(body.password ?? ''),
        displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
        phone: typeof body.phone === 'string' ? body.phone : undefined,
        address: (typeof body.address === 'object' && body.address !== null ? body.address : undefined) as never,
        preferredLanguage: typeof body.preferredLanguage === 'string' ? body.preferredLanguage : undefined,
        type: 'client' as const,
      };
      const { uid, profile } = await createAccount(store, input, await countries(), Date.now());
      const session = createUserSessionToken('client', uid, secret() as string);
      setSessionCookie(res, session.token);
      return res.json({
        ok: true,
        uid,
        kind: 'client',
        token: session.token,
        expires_at: session.payload.exp,
        user: profile,
      });
    } catch (error) {
      return fail(res, error);
    }
  });

  router.post('/api/auth/login', loginLimiter, async (req, res) => {
    if (!secret()) return unconfigured(res);
    if (!store) return unavailable(res);
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const { uid, profile, forceChange } = await verifyLogin(
        store,
        String(body.email ?? ''),
        String(body.password ?? ''),
        Date.now()
      );
      const kind: UserSessionKind = profile.type === 'employee' ? 'employee' : 'client';
      const session = createUserSessionToken(kind, uid, secret() as string);
      setSessionCookie(res, session.token);
      return res.json({
        ok: true,
        uid,
        kind,
        token: session.token,
        expires_at: session.payload.exp,
        user: profile,
        force_change: forceChange,
      });
    } catch (error) {
      return fail(res, error);
    }
  });

  router.post('/api/auth/guest', async (req, res) => {
    if (!secret()) return unconfigured(res);
    const session = createUserSessionToken('guest', newGuestSub(), secret() as string);
    setSessionCookie(res, session.token);
    return res.json({
      ok: true,
      kind: 'guest',
      uid: session.payload.sub,
      token: session.token,
      expires_at: session.payload.exp,
    });
  });

  // Client-safe subset of the password policy: the registration form shows the live criteria
  // (never the algorithm, the lockout or the migration mode).
  router.get('/api/auth/password-criteria', async (_req, res) => {
    const policy = store ? await getPolicy(store) : DEFAULT_POLICY;
    return res.json({
      ok: true,
      criteria: {
        min_length: policy.min_password_length,
        require_digit: policy.require_digit,
        require_uppercase: policy.require_uppercase,
        require_special: policy.require_special,
      },
    });
  });

  router.get('/api/auth/me', async (req, res) => {
    if (!secret()) return unconfigured(res);
    if (!store) return unavailable(res);
    const session = readUserSession(req, secret() as string);
    if (!session || session.kind === 'guest') return res.json({ ok: true, user: null, kind: session?.kind ?? null });
    const profile = await readProfile(store, session.sub);
    return res.json({ ok: true, kind: session.kind, user: profile });
  });

  router.post('/api/auth/change-password', writeLimiter, async (req, res) => {
    if (!secret()) return unconfigured(res);
    if (!store) return unavailable(res);
    const session = readUserSession(req, secret() as string);
    if (!session || session.kind === 'guest') return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      await changePassword(store, session.sub, String(body.current ?? ''), String(body.next ?? ''), Date.now());
      return res.json({ ok: true });
    } catch (error) {
      return fail(res, error);
    }
  });

  router.put('/api/auth/profile', writeLimiter, async (req, res) => {
    if (!secret()) return unconfigured(res);
    if (!store) return unavailable(res);
    const session = readUserSession(req, secret() as string);
    if (!session || (session.kind !== 'client' && session.kind !== 'employee')) {
      return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const patch = {
      displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
      phone: typeof body.phone === 'string' ? body.phone : undefined,
      preferredLanguage: typeof body.preferredLanguage === 'string' ? body.preferredLanguage : undefined,
      address: (typeof body.address === 'object' && body.address !== null ? body.address : undefined) as never,
    };
    try {
      const profile = await updateProfile(store, session.sub, patch, await countries(), Date.now());
      return profile ? res.json({ ok: true, user: profile }) : res.status(404).json({ ok: false, error: 'unknown' });
    } catch (error) {
      return fail(res, error);
    }
  });

  router.put('/api/auth/sync-lists', writeLimiter, async (req, res) => {
    if (!secret()) return unconfigured(res);
    if (!store) return unavailable(res);
    const session = readUserSession(req, secret() as string);
    if (!session || (session.kind !== 'client' && session.kind !== 'employee')) {
      return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const favorites = Array.isArray(body.favorites) ? (body.favorites as unknown[]).map(String) : undefined;
    const savedFridge = Array.isArray(body.savedFridge) ? (body.savedFridge as unknown[]).map(String) : undefined;
    const ok = await saveSyncLists(store, session.sub, favorites, savedFridge);
    return ok ? res.json({ ok: true }) : res.status(404).json({ ok: false, error: 'unknown' });
  });

  // Password policy: read by any manager, written by the super admin only
  router.get('/admin/api/password-policy', async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, adminConfig);
    if (!identity.canManage) return res.status(403).json({ ok: false, error: 'forbidden' });
    return res.json({ ok: true, policy: await getPolicy(store) });
  });

  router.put('/admin/api/password-policy', writeLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, adminConfig);
    if (!identity.owner) return res.status(403).json({ ok: false, error: 'forbidden' });
    const policy = mergePolicy(((req.body ?? {}).policy ?? {}) as Record<string, unknown>);
    await savePolicy(store, policy, Date.now());
    return res.json({ ok: true, policy });
  });

  // Manual unlock of a locked account (backoffice action on the client row)
  router.post('/admin/api/accounts/:uid/unlock', writeLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, adminConfig);
    if (!identity.canManage) return res.status(403).json({ ok: false, error: 'forbidden' });
    const uid = req.params.uid ?? '';
    if (!/^[a-zA-Z0-9_:-]{1,128}$/.test(uid)) return res.status(400).json({ ok: false, error: 'invalid_id' });
    return (await unlockAccount(store, uid, Date.now()))
      ? res.json({ ok: true })
      : res.status(404).json({ ok: false, error: 'unknown' });
  });

  return router;
}
