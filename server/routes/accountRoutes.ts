import express from 'express';
import { createEmployeeAccount } from '../firebaseAdmin';
import { readBearerToken, verifySessionToken, type AdminConfig } from '../patronAuth';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Employee accounts are created by the server only (patron session required). */
export function accountRoutes(adminConfig: AdminConfig): express.Router {
  const router = express.Router();

  const requireSession = (req: express.Request): boolean => {
    if (!adminConfig.ok) return false;
    return verifySessionToken(readBearerToken(req.headers.authorization), adminConfig.secret) !== null;
  };

  router.post('/api/accounts/employees', async (req, res) => {
    if (!requireSession(req)) return res.status(401).json({ ok: false, error: 'unauthorized' });
    const { email, displayName } = req.body ?? {};
    if (typeof email !== 'string' || typeof displayName !== 'string') {
      return res.status(400).json({ ok: false, error: 'invalid-input' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim();
    if (!EMAIL.test(cleanEmail) || cleanEmail.length > 254 || !cleanName || cleanName.length > 60) {
      return res.status(400).json({ ok: false, error: 'invalid-email' });
    }
    const result = await createEmployeeAccount(cleanEmail, cleanName);
    if (!result.ok) {
      const status = result.reason === 'not-configured' ? 503 : 400;
      return res.status(status).json({ ok: false, error: result.reason });
    }
    // The temporary password is shown once, to hand to the employee over a trusted channel.
    return res.json({ ok: true, uid: result.uid, temporaryPassword: result.temporaryPassword });
  });

  return router;
}
