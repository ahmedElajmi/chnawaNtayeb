import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  createSessionToken,
  readBearerToken,
  safeEqual,
  verifySessionToken,
  type BackofficeAuthConfig,
} from '../backofficeAuth';

/** super-admin (admin) authentication: login and session check. The data writes go through
 * the data endpoints with this session — no Firebase identity is involved anywhere. */
export function backofficeAuthRoutes(backofficeAuthConfig: BackofficeAuthConfig): express.Router {
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
    if (!backofficeAuthConfig.ok) return null;
    const payload = verifySessionToken(readBearerToken(req.headers.authorization), backofficeAuthConfig.secret);
    return payload ? { username: payload.sub, expiresAt: payload.exp } : null;
  };

  // One-release aliases: cached PWA clients still call the older /api/auth paths
  router.post(
    ['/admin/api/login', '/api/auth/admin-login', '/api/auth/superAdmin-login'],
    loginLimiter,
    async (req, res) => {
      if (!backofficeAuthConfig.ok) {
        return res.status(503).json({ success: false, error: 'Accès superAdmin non configuré sur le serveur.' });
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
      const userOk = safeEqual(username.trim(), backofficeAuthConfig.username);
      const passOk = safeEqual(password, backofficeAuthConfig.password);
      if (!userOk || !passOk) {
        return res.status(401).json({ success: false, error: 'Identifiants superAdmin incorrects.' });
      }
      const { token, payload } = createSessionToken(backofficeAuthConfig.username, backofficeAuthConfig.secret);
      return res.json({
        success: true,
        token,
        expiresAt: payload.exp,
        user: { username: backofficeAuthConfig.username, role: 'admin' },
      });
    }
  );

  router.get(['/admin/api/verify', '/api/auth/admin-verify', '/api/auth/superAdmin-verify'], (req, res) => {
    const session = requireSession(req);
    if (!session) return res.status(401).json({ valid: false });
    return res.json({ valid: true, user: { username: session.username, role: 'admin' }, expiresAt: session.expiresAt });
  });

  return router;
}
