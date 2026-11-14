import crypto from 'crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { AuthError, createAccount } from '../auth/users';
import type { DataStore } from '../storage/types';
import { readBearerToken, verifySessionToken, type BackofficeAuthConfig } from '../backofficeAuth';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// 4 random groups of 3 characters: strong enough for a first login, readable over the phone
const temporaryPassword = (): string =>
  Array.from({ length: 4 }, () => crypto.randomBytes(2).toString('hex')).join('-');

/**
 * Employee accounts are created by the server only (super-admin session required): the
 * account lives in users/{uid} + auth/{uid} through the storage contract — a temporary
 * password is returned once for the super admin to hand over.
 */
export function accountRoutes(backofficeAuthConfig: BackofficeAuthConfig, store: DataStore | null): express.Router {
  const router = express.Router();

  // Account creation costs a database write: 20 per hour and per IP, whatever the outcome
  const employeeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { ok: false, error: 'Trop de créations de comptes. Réessayez dans une heure.' },
  });

  const requireSession = (req: express.Request): boolean => {
    if (!backofficeAuthConfig.ok) return false;
    return verifySessionToken(readBearerToken(req.headers.authorization), backofficeAuthConfig.secret) !== null;
  };

  router.post(['/admin/api/employees', '/api/accounts/employees'], employeeLimiter, async (req, res) => {
    if (!requireSession(req)) return res.status(401).json({ ok: false, error: 'unauthorized' });
    if (!store) return res.status(503).json({ ok: false, error: 'storage_unavailable' });
    const { email, displayName } = req.body ?? {};
    if (typeof email !== 'string' || typeof displayName !== 'string') {
      return res.status(400).json({ ok: false, error: 'invalid-input' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim();
    if (!EMAIL.test(cleanEmail) || cleanEmail.length > 254 || !cleanName || cleanName.length > 60) {
      return res.status(400).json({ ok: false, error: 'invalid-email' });
    }
    const password = temporaryPassword();
    try {
      const { uid } = await createAccount(
        store,
        { email: cleanEmail, password, displayName: cleanName, type: 'employee' },
        [],
        Date.now()
      );
      // The temporary password is shown once, to hand to the employee over a trusted channel.
      return res.json({ ok: true, uid, temporaryPassword: password });
    } catch (error) {
      const code = error instanceof AuthError ? error.code : 'unknown';
      return res.status(code === 'unknown' ? 500 : 400).json({ ok: false, error: code });
    }
  });

  return router;
}
