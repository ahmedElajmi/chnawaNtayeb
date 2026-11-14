import express from 'express';
import { legacyRedirect } from './seo';
import { securityHeadersMiddleware } from './headers';
import { createFirestoreStore } from './storage/firestoreStore';
import { createMemoryDataStore } from './storage/memoryDataStore';
import { getAdminFirestore } from './firebaseAdmin';
import type { DataStore } from './storage/types';
import { parseStoredCountries, type CountryRecord } from '../src/core/accounts';
import type { BackofficeAuthConfig } from './backofficeAuth';
import type { VisionProvider } from './vision/visionProvider';
import { accountRoutes } from './routes/accountRoutes';
import { authRoutes } from './auth/routes';
import { adminDataRoutes } from './routes/adminDataRoutes';
import { dataRoutes } from './routes/dataRoutes';
import { backofficeAuthRoutes } from './routes/backofficeAuthRoutes';
import { seoRoutes } from './routes/seoRoutes';
import { VISION_PATH, visionRoutes } from './routes/visionRoutes';
import {
  clampPollLimit,
  clampPollingSeconds,
  DEFAULT_POLL_LIMIT_PER_MINUTE,
  DEFAULT_POLLING_SECONDS,
  type AppServerConfig,
  type RuntimeLimits,
} from './appConfig';

export interface AppDependencies {
  backofficeAuthConfig: BackofficeAuthConfig;
  /** Fridge photo AI; null = scanner disabled */
  vision: VisionProvider | null;
}

/** API of the app (the web pages are added by server.ts: Vite in dev, dist/ in production). */
export interface ApiApp {
  app: express.Express;
  /** THE server configuration injected into every served page (cached 60 s — one database
   *  read per minute at most, whatever the traffic). New settings are added here. */
  config: () => Promise<AppServerConfig>;
  /** The abuse ceilings the limiter middlewares enforce right now (updated on each save). */
  runtime: RuntimeLimits;
}

/**
 * TRUST_PROXY: how many proxies stand between the visitor and us (needed to read the real
 * client IP for the rate limits). 1 covers most hosts (Render, Railway, Fly single proxy);
 * 0 = direct exposure. Host-independent: set TRUST_PROXY in the environment to match any
 * hosting topology, never hard-coded.
 */
function trustProxyHops(): number {
  const raw = process.env.TRUST_PROXY?.trim();
  if (!raw) return 1;
  const hops = Number(raw);
  return Number.isFinite(hops) && hops >= 0 ? hops : 1;
}

export function createApiApp({ backofficeAuthConfig, vision }: AppDependencies): ApiApp {
  const app = express();
  app.set('trust proxy', trustProxyHops());
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

  // Small JSON bodies everywhere, except the photo upload and the data batches (catalog
  // import / replace) which carry many documents and have their own limits
  const smallJson = express.json({ limit: '100kb' });
  const bigJson = express.json({ limit: '5mb' });
  app.use((req, res, next) => {
    if (req.path === VISION_PATH || req.path.startsWith('/api/data/')) return bigJson(req, res, next);
    return smallJson(req, res, next);
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });
  // The data gateway: Firestore behind the storage contract today, any SQL engine tomorrow.
  // LOCAL_MEMORY_STORE=1 keeps everything in memory for a local run without Firebase —
  // refused in production, where nothing would survive a restart.
  const adminDb = getAdminFirestore();
  const dataStore: DataStore | null =
    process.env.LOCAL_MEMORY_STORE === '1'
      ? ((process.env.NODE_ENV === 'production'
          ? (() => {
              throw new Error('LOCAL_MEMORY_STORE=1 is refused in production: data would not survive a restart');
            })()
          : createMemoryDataStore()) as DataStore)
      : adminDb
        ? createFirestoreStore(adminDb)
        : null;
  // The abuse ceilings the limiter middlewares enforce: updated on each backoffice save and
  // each config read, shared by reference with the routes (no per-request database read).
  const runtime: RuntimeLimits = { pollRequestsPerMinute: DEFAULT_POLL_LIMIT_PER_MINUTE };
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
  app.use(adminDataRoutes(backofficeAuthConfig, dataStore, runtime));
  app.use(dataRoutes(backofficeAuthConfig, dataStore, runtime));
  app.use(visionRoutes(vision));
  app.use(seoRoutes());

  // THE server configuration injected into every served page (server/appConfig.ts): cached,
  // because a page request reads it — at most one settings read per minute. A save applies
  // instantly through the shared runtime object (the limiter reads it on every request).
  let configCache: { at: number; value: AppServerConfig } = {
    at: 0,
    value: { pollingSeconds: DEFAULT_POLLING_SECONDS },
  };
  const config = async (): Promise<AppServerConfig> => {
    if (!dataStore || Date.now() - configCache.at < 60_000) return configCache.value;
    const stored = await dataStore.get('settings', 'polling');
    const value: AppServerConfig = {
      pollingSeconds:
        stored && stored.deleted !== true ? clampPollingSeconds(stored.interval_seconds) : DEFAULT_POLLING_SECONDS,
    };
    if (stored && stored.deleted !== true) runtime.pollRequestsPerMinute = clampPollLimit(stored.poll_limit_per_minute);
    configCache = { at: Date.now(), value };
    return value;
  };

  return { app, config, runtime };
}
