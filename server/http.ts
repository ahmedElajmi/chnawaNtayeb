import type express from 'express';

const DEFAULT_PUBLIC_URL = 'https://chnawantayeb.onrender.com';

/** Public address of the site (APP_URL, else the forwarded host, else the production default). */
export function getBaseUrl(req: express.Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const forwardedProto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('0.0.0.0')) {
    return `${forwardedProto}://${host}`;
  }
  return DEFAULT_PUBLIC_URL;
}
