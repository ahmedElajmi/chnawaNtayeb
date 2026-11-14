import type express from 'express';

/**
 * Public address of the site. APP_URL is the only source of truth: SEO URLs
 * (canonical, sitemap, robots) are never built from request headers, which any
 * client can forge (host-header poisoning would advertise an attacker host).
 */
export function getBaseUrl(_req?: express.Request): string {
  const appUrl = process.env.APP_URL;
  if (appUrl) return appUrl.replace(/\/$/, '');
  // Local development without APP_URL: the rendered SEO pages live on this very host.
  return `http://localhost:${process.env.PORT || 3000}`;
}

/**
 * Production has no safe fallback for the public address: without APP_URL the
 * canonical, sitemap and robots URLs would be wrong. Returns the reason to
 * refuse the start, or null when the configuration is fine.
 */
export function appUrlStartupError(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.NODE_ENV !== 'production') return null;
  return env.APP_URL
    ? null
    : 'APP_URL is required in production: canonical, sitemap and robots URLs are built from it.';
}
