import type { PollingSettingsGateway } from '@/application';
import { getBackofficeToken } from './backofficeAuth';

/** Polling interval configured by the super admin, served publicly to every device. */
export const pollingSettingsGateway: PollingSettingsGateway = {
  async read() {
    const res = await fetch('/api/settings/polling');
    const body = (await res.json().catch(() => ({}))) as { interval_seconds?: number };
    if (!res.ok || typeof body.interval_seconds !== 'number') throw new Error('polling_unavailable');
    return { intervalSeconds: body.interval_seconds };
  },

  async save(intervalSeconds) {
    const token = getBackofficeToken();
    const res = await fetch('/admin/api/settings/polling', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ interval_seconds: intervalSeconds }),
    });
    if (!res.ok) throw new Error('polling_save_failed');
  },
};
