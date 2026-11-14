/**
 * THE single place for the server configuration injected into every served page.
 *
 * A page request carries `window.__APP_CONFIG__` in its <head>, read synchronously by the
 * client at startup — zero extra request per page load. To expose a new setting, add it to
 * `AppServerConfig`, fill it in the config provider (server/app.ts) and read it client-side
 * from the injected object — nothing else changes.
 *
 * Security: the values are produced by the server alone (never user input) and serialized
 * with `JSON.stringify` plus a `</script>` escape, so a future text value cannot break out
 * of the inline script. The configuration read is cached (60 s): a flood of page requests
 * costs at most one database read per minute.
 */

export interface AppServerConfig {
  /** How often the devices poll the change feed, configured in the backoffice (seconds). */
  pollingSeconds: number;
}

export const DEFAULT_POLLING_SECONDS = 60;
export const POLLING_BOUNDS = { min: 15, max: 600 } as const;

export function clampPollingSeconds(value: unknown): number {
  const seconds = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : DEFAULT_POLLING_SECONDS;
  return Math.max(POLLING_BOUNDS.min, Math.min(POLLING_BOUNDS.max, seconds));
}

/**
 * The abuse ceiling the SERVER enforces on the change feed, per IP and per minute —
 * configured in the backoffice (card "Synchronisation des appareils"). Deliberately NOT
 * injected into pages: a client-side value is only a default for honest clients, while
 * this ceiling is enforced by the server whatever the visitor does with their console.
 */
export interface RuntimeLimits {
  pollRequestsPerMinute: number;
}

export const DEFAULT_POLL_LIMIT_PER_MINUTE = 300;
export const POLL_LIMIT_BOUNDS = { min: 30, max: 6000 } as const;

export function clampPollLimit(value: unknown): number {
  const limit = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : DEFAULT_POLL_LIMIT_PER_MINUTE;
  return Math.max(POLL_LIMIT_BOUNDS.min, Math.min(POLL_LIMIT_BOUNDS.max, limit));
}

/** Inline script safe for any value: `</` never appears inside it. */
function serialize(config: AppServerConfig): string {
  return JSON.stringify(config).replace(/<\//g, '<\\/');
}

export function injectAppConfig(html: string, config: AppServerConfig): string {
  const script = `<script>window.__APP_CONFIG__=${serialize({
    pollingSeconds: clampPollingSeconds(config.pollingSeconds),
  })};</script>`;
  const anchor = '<head>';
  return html.includes(anchor) ? html.replace(anchor, `${anchor}\n    ${script}`) : `${script}\n${html}`;
}
