import type { PollingSettingsGateway } from '@/application';
import { getBackofficeToken } from './backofficeAuth';

/** The "Synchronisation des appareils" settings: read by the backoffice card (manager
 *  session), saved by the super admin. Visitors receive the interval injected into their
 *  page; the ceiling itself is server-side and never served publicly. */
export const pollingSettingsGateway: PollingSettingsGateway = {
  async read() {
    const token = getBackofficeToken();
    const res = await fetch('/admin/api/settings/polling', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const body = (await res.json().catch(() => ({}))) as {
      interval_seconds?: number;
      poll_requests_per_minute?: number;
    };
    if (!res.ok || typeof body.interval_seconds !== 'number') throw new Error('polling_unavailable');
    return {
      intervalSeconds: body.interval_seconds,
      ...(typeof body.poll_requests_per_minute === 'number'
        ? { pollRequestsPerMinute: body.poll_requests_per_minute }
        : {}),
    };
  },

  async save(settings) {
    const token = getBackofficeToken();
    const res = await fetch('/admin/api/settings/polling', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        interval_seconds: settings.intervalSeconds,
        poll_limit_per_minute: settings.pollRequestsPerMinute,
      }),
    });
    if (!res.ok) throw new Error('polling_save_failed');
  },
};
