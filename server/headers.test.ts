import type express from 'express';
import { describe, expect, it } from 'vitest';
import { isSecureRequest, securityHeaders } from './headers';

/** Captures what the middleware sets on the response. */
function run(secure: boolean, req: Partial<express.Request> = {}) {
  const headers: Record<string, string | undefined> = {};
  const res = {
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
  };
  let nextCalled = false;
  securityHeaders(secure)(req as express.Request, res as unknown as express.Response, () => {
    nextCalled = true;
  });
  return { headers, nextCalled };
}

describe('securityHeaders', () => {
  it('sets the descriptive headers and the minimal CSP on every response', () => {
    const { headers, nextCalled } = run(false);
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(headers['Content-Security-Policy']).toBe(
      "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'"
    );
    expect(nextCalled).toBe(true);
  });

  it('never sends a script or style restriction that could break a page', () => {
    const csp = run(false).headers['Content-Security-Policy'];
    expect(csp).not.toContain('script-src');
    expect(csp).not.toContain('style-src');
    expect(csp).not.toContain('img-src');
    expect(csp).not.toContain('connect-src');
  });

  it('sends HSTS only over https', () => {
    expect(run(true).headers['Strict-Transport-Security']).toBe('max-age=31536000');
    expect(run(false).headers['Strict-Transport-Security']).toBeUndefined();
  });
});

describe('isSecureRequest', () => {
  it('detects https, directly or through the proxy', () => {
    expect(isSecureRequest({ secure: true } as express.Request)).toBe(true);
    expect(
      isSecureRequest({ secure: false, headers: { 'x-forwarded-proto': 'https' } } as unknown as express.Request)
    ).toBe(true);
    expect(isSecureRequest({ secure: false, headers: {} } as express.Request)).toBe(false);
  });
});
