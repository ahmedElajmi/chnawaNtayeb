import express from 'express';
import { legacyRedirect, setCatalogSource } from './seo';
import { securityHeadersMiddleware } from './headers';
import { createFirestoreStore } from './storage/firestoreStore';
import { createMemoryDataStore } from './storage/memoryDataStore';
import { createSqlStore, createSqliteKnex, ensureSchema } from './storage/sqlStore';
import { getAdminFirestore } from './firebaseAdmin';
import type { DataStore } from './storage/types';
import { contractEmployeeRights, createIdentityResolver, type IdentityResolver } from './storage/identity';
import { contractPublishedCatalog } from './storage/publishedCatalog';
import { parseStoredCountries, type CountryRecord } from '../src/core/accounts';
import type { BackofficeAuthConfig } from './backofficeAuth';
import type { VisionProvider } from './vision/visionProvider';
import { accountRoutes } from './routes/accountRoutes';
import { authRoutes } from './auth/routes';
import { adminDataRoutes } from './routes/adminDataRoutes';
import { dataRoutes } from './routes/dataRoutes';
import { kitchenRoutes } from './routes/kitchenRoutes';
import { backofficeAuthRoutes } from './routes/backofficeAuthRoutes';
import { seoRoutes } from './routes/seoRoutes';
import { VISION_PATH, visionRoutes } from './routes/visionRoutes';

export interface AppDependencies {
  backofficeAuthConfig: BackofficeAuthConfig;
  /** Fridge photo AI; null = scanner disabled */
  vision: VisionProvider | null;
}

/**
 * Selects the provider from DATA_STORE (default `firestore`). An unknown value is a startup
 * error, never a silent fallback. `memory` is a local-run convenience, refused in production.
 * `sql` is the local/test run of the generic adapter (better-sqlite3 via SQLITE_PATH): the
 * production switch stays the one global migration, never this setting.
 */
async function createDataStore(): Promise<DataStore | null> {
  const raw = process.env.DATA_STORE ?? 'firestore';
  if (raw !== 'firestore' && raw !== 'sql' && raw !== 'memory') {
    throw new Error(`DATA_STORE="${raw}" is unknown: expected firestore | sql | memory`);
  }
  switch (raw) {
    case 'memory':
      if (process.env.NODE_ENV === 'production') {
        throw new Error('DATA_STORE=memory is refused in production: data would not survive a restart');
      }
      return createMemoryDataStore();
    case 'sql': {
      const path = process.env.SQLITE_PATH?.trim();
      if (!path) throw new Error('DATA_STORE=sql needs SQLITE_PATH (a local SQLite file for tests)');
      const db = createSqliteKnex(path);
      await ensureSchema(db);
      return createSqlStore(db);
    }
    default: {
      const adminDb = getAdminFirestore();
      return adminDb ? createFirestoreStore(adminDb) : null;
    }
  }
}

/** API of the app (the web pages are added by server.ts: Vite in dev, dist/ in production). */
/** Transport bound for /api/kitchen (lot F1 A1, chef-validated): the full-caps legitimate
 *  worst case measured 2 435 950 bytes (report 2026-11-20, config C1, HTTP 200); 3 MiB =
 *  3 145 728 bytes leaves +29.13 % (C2: 2 567 965 bytes, +22.50 %). Business caps remain the
 *  reference protection; above the bound body-parser answers 413 before any handler. */
const KITCHEN_BODY_LIMIT = '3mb';

export async function createApiApp({ backofficeAuthConfig, vision }: AppDependencies): Promise<express.Express> {
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

  // Small JSON bodies everywhere, except the photo upload, the data batches (catalog
  // import / replace) which carry many documents and have their own limits, and the kitchen
  // sync (the dedicated 3 MiB bound above — the full-caps worst case measured under it)
  const smallJson = express.json({ limit: '100kb' });
  const bigJson = express.json({ limit: '5mb' });
  const kitchenJson = express.json({ limit: KITCHEN_BODY_LIMIT });
  // Exact match: /api/kitchen itself and its real sub-routes (/api/kitchen/history), never
  // a sibling path that merely starts with the same prefix (e.g. /api/kitchenX) — no
  // accidental widening beyond the kitchen route space (lot F1 A1).
  const isKitchenPath = (path: string): boolean => path === '/api/kitchen' || path.startsWith('/api/kitchen/');
  app.use((req, res, next) => {
    if (req.path === VISION_PATH || req.path.startsWith('/api/data/')) return bigJson(req, res, next);
    if (isKitchenPath(req.path)) return kitchenJson(req, res, next);
    return smallJson(req, res, next);
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });
  // The storage contract: the selected provider behind it, anything else changed nowhere else.
  // No provider configured (no service account): the endpoints degrade, as before.
  const dataStore = await createDataStore();
  // The server-side SEO pages read the public catalog through the same contract
  setCatalogSource(contractPublishedCatalog(dataStore));
  // Identity of every endpoint call, bound once: employee rights read over the contract
  const identity: IdentityResolver = createIdentityResolver(backofficeAuthConfig, contractEmployeeRights(dataStore));
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
  app.use(authRoutes(backofficeAuthConfig, dataStore, countriesProvider, identity));
  // The personal kitchen data of signed-in accounts (guests keep theirs on the device;
  // the collection is server-only: never served by the data endpoints)
  app.use(kitchenRoutes(backofficeAuthConfig, dataStore));
  app.use(adminDataRoutes(backofficeAuthConfig, dataStore, identity));
  app.use(dataRoutes(backofficeAuthConfig, dataStore, identity));
  app.use(visionRoutes(vision));
  app.use(seoRoutes());
  return app;
}
