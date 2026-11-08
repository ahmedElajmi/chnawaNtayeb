import express from 'express';
import { getBaseUrl } from '../http';
import { renderHtml, resolvePage, sitemapXml } from '../seo';

/** sitemap.xml and robots.txt. */
export function seoRoutes(): express.Router {
  const router = express.Router();

  // Home, recipe list and every published recipe (server/seo.ts)
  router.get('/sitemap.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');
    res.send(await sitemapXml(getBaseUrl(req)));
  });

  router.get('/robots.txt', (req, res) => {
    res.header('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /patron
Disallow: /api/

Sitemap: ${getBaseUrl(req)}/sitemap.xml
`);
  });

  return router;
}

/**
 * Public pages (/, /recettes, /recette/<slug>) are sent with their own title, description,
 * canonical URL, schema.org data and readable content, so search engines can index each recipe.
 * Other addresses fall through to the plain app.
 */
export function seoPages(getTemplate: (url: string) => Promise<string>): express.RequestHandler {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !req.accepts('html')) return next();
    try {
      const page = await resolvePage(req.path, getBaseUrl(req));
      if (!page) return next();
      const html = renderHtml(await getTemplate(req.originalUrl), page);
      res.status(page.status).set('Content-Type', 'text/html; charset=utf-8').send(html);
    } catch (e) {
      console.error('[seo] rendering failed, plain SPA served:', e);
      next();
    }
  };
}
