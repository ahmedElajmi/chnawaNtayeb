import express from 'express';
import { getBaseUrl } from '../http';
import { getCatalog, isSeoPath, parsePageNumber, renderHtml, resolvePage, sitemapXml } from '../seo';

/** sitemap.xml and robots.txt. */
export function seoRoutes(): express.Router {
  const router = express.Router();

  // Home, recipe list, fridge and every published recipe (server/seo.ts)
  router.get('/sitemap.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(sitemapXml(getBaseUrl(), await getCatalog()));
  });

  router.get('/robots.txt', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /superAdmin
Disallow: /api/

Sitemap: ${getBaseUrl()}/sitemap.xml
`);
  });

  return router;
}

/**
 * Public screens and recipes (server/seo.ts) are sent with their own title, description,
 * canonical URL, schema.org data and readable content, whatever the client asks for in its
 * Accept header (some robots send none or an unusual one). Other addresses fall through to the app.
 */
export function seoPages(getTemplate: (url: string) => Promise<string>): express.RequestHandler {
  return async (req, res, next) => {
    if ((req.method !== 'GET' && req.method !== 'HEAD') || !isSeoPath(req.path)) return next();
    try {
      const page = resolvePage(req.path, getBaseUrl(), await getCatalog(), parsePageNumber(req.query.page));
      if (!page) return next();
      const html = renderHtml(await getTemplate(req.originalUrl), page);
      res.status(page.status).set('Content-Type', 'text/html; charset=utf-8').send(html);
    } catch (e) {
      console.error('[seo] rendering failed, plain SPA served:', e);
      next();
    }
  };
}
