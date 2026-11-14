import express from 'express';
import { legacyRedirect } from './seo';
import { securityHeadersMiddleware } from './headers';
import { createFirestoreStore } from './storage/firestoreStore';
import { getAdminFirestore } from './firebaseAdmin';
import { parseStoredCountries, type CountryRecord } from '../src/core/accounts';
import type { BackofficeAuthConfig } from './backofficeAuth';
import type { VisionProvider } from './vision/visionProvider';
import { accountRoutes } from './routes/accountRoutes';
import { authRoutes } from './auth/routes';
import { dataRoutes } from './routes/dataRoutes';
import { backofficeAuthRoutes } from './routes/backofficeAuthRoutes';
import { seoRoutes } from './routes/seoRoutes';
import { VISION_PATH, visionRoutes } from './routes/visionRoutes';

export interface AppDependencies {
  backofficeAuthConfig: BackofficeAuthConfig;
  /** Fridge photo AI; null = scanner disabled */
  vision: VisionProvider | null;
}

/** API of the app (the web pages are added by server.ts: Vite in dev, dist/ in production). */
export function createApiApp({ backofficeAuthConfig, vision }: AppDependencies): express.Express {
  const app = express();
  // Render (and most hosts) put the app behind one proxy: needed for correct client IPs in rate limiting
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Defense in depth: descriptive headers and a CSP over mechanisms the app never uses
  app.use(securityHeadersMiddleware());

  // Addresses of the French era answer with a permanent redirect (SEO transfer, query kept)
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const target = legacyRedirect(req.path);
    if (!target) return next();
    const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
    return res.redirect(301, target + query);
  });

  // Small JSON bodies everywhere, except the photo upload which has its own limit
  const smallJson = express.json({ limit: '100kb' });
  app.use((req, res, next) => (req.path === VISION_PATH ? next() : smallJson(req, res, next)));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });
  // The data gateway: Firestore behind the storage contract today, any SQL engine tomorrow
  const adminDb = getAdminFirestore();
  const dataStore = adminDb ? createFirestoreStore(adminDb) : null;
  // Enabled countries for the server-side registration validation, read through the store
  let countriesCache: { at: number; list: CountryRecord[] } = { at: 0, list: [] };
  const countriesProvider = async (): Promise<readonly CountryRecord[]> => {
    if (!dataStore || Date.now() - countriesCache.at < 60_000) return countriesCache.list;
    const changes = await dataStore.changes('countries', 0, 500);
    countriesCache = { at: Date.now(), list: parseStoredCountries(changes.items) };
    return countriesCache.list;
  };
  app.use(backofficeAuthRoutes(backofficeAuthConfig));
  app.use(accountRoutes(backofficeAuthConfig, dataStore));
  app.use(authRoutes(backofficeAuthConfig, dataStore, countriesProvider));
  app.use(dataRoutes(backofficeAuthConfig, dataStore));
  app.use(visionRoutes(vision));
  app.use(seoRoutes());
  return app;
}
