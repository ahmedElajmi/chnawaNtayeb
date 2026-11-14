import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createApiApp } from './server/app';
import { appUrlStartupError } from './server/http';
import { injectAppConfig } from './server/appConfig';
import { getBackofficeAuthConfig } from './server/backofficeAuth';
import { isFirebaseAdminConfigured } from './server/firebaseAdmin';
import { createGeminiVisionProvider } from './server/vision/geminiVisionProvider';
import { seoPages } from './server/routes/seoRoutes';
import { getCatalog } from './server/seo';

/**
 * Entry point: reads the configuration, builds the API (server/app.ts),
 * then serves the web app (Vite in development, dist/ in production).
 */
dotenv.config();

const appUrlError = appUrlStartupError();
if (appUrlError) {
  console.error(`[seo] Refusing to start: ${appUrlError}`);
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const backofficeAuthConfig = getBackofficeAuthConfig();
if (!backofficeAuthConfig.ok) console.warn(`[super-admin] Connexion admin désactivée : ${backofficeAuthConfig.reason}`);
if (!isFirebaseAdminConfigured()) {
  console.warn(
    '[super-admin] FIREBASE_SERVICE_ACCOUNT absent : le backoffice fonctionnera en mode local (pas d écriture Firestore).'
  );
}

const { app, config } = createApiApp({
  backofficeAuthConfig,
  vision: process.env.GEMINI_API_KEY ? createGeminiVisionProvider(process.env.GEMINI_API_KEY) : null,
});

/**
 * THE one pipeline every served page goes through (SEO pages and the SPA fallback alike):
 * the base HTML, then the server configuration injected into the head — read synchronously
 * by the client, one request less per page load. A new server setting only changes
 * `AppServerConfig` (server/appConfig.ts) and the client reader.
 */
const shell = async (url: string, html: string): Promise<string> =>
  injectAppConfig(html, {
    pollingSeconds: await config()
      .catch(() => ({ pollingSeconds: 60 }))
      .then((c) => c.pollingSeconds),
  });

/** THE one pipeline for every navigation (SEO pages, admin, deep links): base HTML —
 *  transformed by Vite in dev — then the server configuration injected into the head. */
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const indexPath = path.resolve(__dirname, isDev ? 'index.html' : 'dist/index.html');

  let devTransform: ((url: string, html: string) => Promise<string>) | null = null;
  let template: string | null = null;
  const serveShell = async (url: string): Promise<string> => {
    const raw = template ?? fs.readFileSync(indexPath, 'utf8');
    return shell(url, devTransform ? await devTransform(url, raw) : raw);
  };

  // 1) SEO pages with their own metadata, 2) static/module assets, 3) our shell fallback.
  app.use(seoPages(serveShell));
  if (isDev) {
    // appType 'custom': vite transforms the modules but leaves every HTML page to US — one
    // shell for every navigation, dev and prod alike.
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
    devTransform = (url, html) => vite.transformIndexHtml(url, html);
    app.use(vite.middlewares);
  } else {
    template = fs.readFileSync(indexPath, 'utf8');
    app.use(express.static(path.resolve(__dirname, 'dist'), { index: false }));
  }

  // THE single fallback for every navigation that is not a SEO page (admin, deep links).
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    serveShell(req.originalUrl)
      .then((html) => res.type('html').send(html))
      .catch(next);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Chnowa Ntayeb server running on http://0.0.0.0:${PORT} (${isDev ? 'development' : 'production'})`);
    // Read the catalog now: the first robot after a wake-up does not wait for the database
    getCatalog().catch((e) => console.warn('[seo] catalog preload failed:', (e as Error).message));
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
