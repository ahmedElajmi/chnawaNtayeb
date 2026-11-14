import type { PollingSettingsGateway } from '@/application';

/** In-memory polling settings: read/save roundtrip for tests. */
export function createMemoryPollingSettings(): PollingSettingsGateway & { stored: number } {
  let stored = 60;
  return {
    get stored() {
      return stored;
    },
    async read() {
      return { intervalSeconds: stored };
    },
    async save(intervalSeconds) {
      stored = intervalSeconds;
    },
  };
}
