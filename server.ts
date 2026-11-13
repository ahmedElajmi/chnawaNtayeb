import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createApiApp } from './server/app';
import { getAdminConfig } from './server/patronAuth';
import { isFirebaseAdminConfigured } from './server/firebaseAdmin';
import { createGeminiVisionProvider } from './server/vision/geminiVisionProvider';
import { seoPages } from './server/routes/seoRoutes';
import { getCatalog } from './server/seo';

/**
 * Entry point: reads the configuration, builds the API (server/app.ts),
 * then serves the web app (Vite in development, dist/ in production).
 */
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const adminConfig = getAdminConfig();
if (!adminConfig.ok) console.warn(`[patron] Connexion admin désactivée : ${adminConfig.reason}`);
if (!isFirebaseAdminConfigured()) {
  console.warn(
    '[patron] FIREBASE_SERVICE_ACCOUNT absent : le backoffice fonctionnera en mode local (pas d écriture Firestore).'
  );
}

const app = createApiApp({
  adminConfig,
  vision: process.env.GEMINI_API_KEY ? createGeminiVisionProvider(process.env.GEMINI_API_KEY) : null,
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(
      seoPages(async (url) =>
        vite.transformIndexHtml(url, fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8'))
      )
    );
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const template = fs.readFileSync(path.resolve(distPath, 'index.html'), 'utf8');
    app.use(seoPages(async () => template));
    app.use(express.static(distPath, { index: false }));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

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
