import { afterEach, describe, expect, it, vi } from 'vitest';
import { appUrlStartupError, getBaseUrl } from './http';

describe('getBaseUrl', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns APP_URL without its trailing slash', () => {
    vi.stubEnv('APP_URL', 'https://chnawantayeb.onrender.com/');
    expect(getBaseUrl()).toBe('https://chnawantayeb.onrender.com');
  });

  it('never reads request headers, even a forged forwarded host', () => {
    vi.stubEnv('APP_URL', 'https://chnawantayeb.onrender.com');
    expect(getBaseUrl({ headers: { 'x-forwarded-host': 'evil.com' } } as never)).toBe(
      'https://chnawantayeb.onrender.com'
    );
  });

  it('falls back to localhost outside production', () => {
    vi.stubEnv('APP_URL', '');
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('PORT', '');
    expect(getBaseUrl()).toBe('http://localhost:3000');

    vi.stubEnv('PORT', '4321');
    expect(getBaseUrl()).toBe('http://localhost:4321');
  });
});

describe('appUrlStartupError', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('refuses the start in production without APP_URL', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_URL', '');
    expect(appUrlStartupError()).toContain('APP_URL is required in production');
  });

  it('accepts a configured production start', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_URL', 'https://chnawantayeb.onrender.com');
    expect(appUrlStartupError()).toBeNull();
  });

  it('does not require APP_URL outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('APP_URL', '');
    expect(appUrlStartupError()).toBeNull();
  });
});
