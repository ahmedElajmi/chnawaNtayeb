import type express from 'express';

/**
 * Security response headers, kept deliberately minimal: every directive below
 * restricts a mechanism this app does not use, so none of them can break a
 * legitimate page. A richer Content-Security-Policy (scripts, styles, frames,
 * connections) must first run as Report-Only: the inline theme script and the
 * Vite dev server would otherwise be blocked.
 */

/**
 * @param secure true when the request reaches us over https (production behind
 *   the hosting proxy): only then is HSTS meaningful.
 */
export function securityHeaders(secure: boolean): express.RequestHandler {
  return (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // We embed YouTube, we are never embedded: clickjacking is off the table.
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'"
    );
    if (secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    next();
  };
}

/** The middleware as wired in server/app.ts: detects https per request. */
export function securityHeadersMiddleware(): express.RequestHandler {
  return (req, res, next) => securityHeaders(isSecureRequest(req))(req, res, next);
}

/** Whether this request is served over https (directly or through the proxy). */
export function isSecureRequest(req: express.Request): boolean {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}
