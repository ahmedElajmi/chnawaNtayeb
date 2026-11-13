import express from 'express';
import rateLimit from 'express-rate-limit';
import { createSessionToken, readBearerToken, safeEqual, verifySessionToken, type AdminConfig } from '../patronAuth';
import { createPatronFirebaseToken } from '../firebaseAdmin';

/** Patron (admin) authentication: login, session check, Firebase token for cloud edits. */
export function patronRoutes(adminConfig: AdminConfig): express.Router {
  const router = express.Router();

  // 5 failed attempts per IP every 15 minutes (successful logins are not counted)
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  });

  const requireSession = (req: express.Request): { username: string; expiresAt: number } | null => {
    if (!adminConfig.ok) return null;
    const payload = verifySessionToken(readBearerToken(req.headers.authorization), adminConfig.secret);
    return payload ? { username: payload.sub, expiresAt: payload.exp } : null;
  };

  const safeCreateFirebaseToken = async (): Promise<string | null> => {
    try {
      return await createPatronFirebaseToken();
    } catch (err) {
      console.error('[patron] Impossible de créer le jeton Firebase :', err);
      return null;
    }
  };

  // One-release aliases: cached PWA clients still call the older /api/auth paths
  router.post(
    ['/admin/api/login', '/api/auth/admin-login', '/api/auth/patron-login'],
    loginLimiter,
    async (req, res) => {
      if (!adminConfig.ok) {
        return res.status(503).json({ success: false, error: 'Accès patron non configuré sur le serveur.' });
      }
      const { username, password } = req.body ?? {};
      if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        username.length > 100 ||
        password.length > 200
      ) {
        return res.status(400).json({ success: false, error: 'Requête invalide.' });
      }
      // Both comparisons always run (no early exit) so timing does not reveal which field is wrong
      const userOk = safeEqual(username.trim(), adminConfig.username);
      const passOk = safeEqual(password, adminConfig.password);
      if (!userOk || !passOk) {
        return res.status(401).json({ success: false, error: 'Identifiants patron incorrects.' });
      }
      const { token, payload } = createSessionToken(adminConfig.username, adminConfig.secret);
      return res.json({
        success: true,
        token,
        expiresAt: payload.exp,
        user: { username: adminConfig.username, role: 'admin' },
        firebaseToken: await safeCreateFirebaseToken(),
      });
    }
  );

  router.get(['/admin/api/verify', '/api/auth/admin-verify', '/api/auth/patron-verify'], (req, res) => {
    const session = requireSession(req);
    if (!session) return res.status(401).json({ valid: false });
    return res.json({ valid: true, user: { username: session.username, role: 'admin' }, expiresAt: session.expiresAt });
  });

  // Re-issues a Firebase custom token for an existing patron session (e.g. after a page reload)
  router.post(
    ['/admin/api/firebase-token', '/api/auth/admin-firebase-token', '/api/auth/patron-firebase-token'],
    async (req, res) => {
      if (!requireSession(req)) return res.status(401).json({ error: 'Session patron invalide.' });
      const firebaseToken = await safeCreateFirebaseToken();
      if (!firebaseToken) return res.status(503).json({ error: 'Synchronisation cloud non configurée.' });
      return res.json({ firebaseToken });
    }
  );

  return router;
}
