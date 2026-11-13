import express from 'express';
import type { AdminConfig } from './patronAuth';
import type { VisionProvider } from './vision/visionProvider';
import { accountRoutes } from './routes/accountRoutes';
import { patronRoutes } from './routes/patronRoutes';
import { seoRoutes } from './routes/seoRoutes';
import { VISION_PATH, visionRoutes } from './routes/visionRoutes';

export interface AppDependencies {
  adminConfig: AdminConfig;
  /** Fridge photo AI; null = scanner disabled */
  vision: VisionProvider | null;
}

/** API of the app (the web pages are added by server.ts: Vite in dev, dist/ in production). */
export function createApiApp({ adminConfig, vision }: AppDependencies): express.Express {
  const app = express();
  // Render (and most hosts) put the app behind one proxy: needed for correct client IPs in rate limiting
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Small JSON bodies everywhere, except the photo upload which has its own limit
  const smallJson = express.json({ limit: '100kb' });
  app.use((req, res, next) => (req.path === VISION_PATH ? next() : smallJson(req, res, next)));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });
  app.use(patronRoutes(adminConfig));
  app.use(accountRoutes(adminConfig));
  app.use(visionRoutes(vision));
  app.use(seoRoutes());
  return app;
}
