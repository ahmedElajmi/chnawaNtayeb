import type { PollingSettings, PollingSettingsGateway } from '@/application';

/** In-memory polling settings: read/save roundtrip for tests. */
export function createMemoryPollingSettings(): PollingSettingsGateway & { stored: PollingSettings } {
  let stored: PollingSettings = { intervalSeconds: 60, pollRequestsPerMinute: 300 };
  return {
    get stored() {
      return stored;
    },
    async read() {
      return { ...stored };
    },
    async save(settings) {
      stored = { ...settings };
    },
  };
}
