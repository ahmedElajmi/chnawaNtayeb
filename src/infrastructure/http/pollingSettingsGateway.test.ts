import { afterEach, describe, expect, it, vi } from 'vitest';
import { readInjectedPollingSeconds } from './dataApi';
import { pollingSettingsGateway } from './pollingSettingsGateway';

function jsonResponse(status: number, body: unknown): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response;
}

describe('the injected server configuration (client side)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the polling interval from the page, without any request', () => {
    vi.stubGlobal('window', { __APP_CONFIG__: { pollingSeconds: 30 } });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(readInjectedPollingSeconds()).toBe(30);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers null when the page carries no configuration', () => {
    vi.stubGlobal('window', {});
    expect(readInjectedPollingSeconds()).toBeNull();
  });
});

describe('the backoffice polling settings gateway', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads both settings from the manager endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { ok: true, interval_seconds: 30, poll_requests_per_minute: 120 }))
    );
    await expect(pollingSettingsGateway.read()).resolves.toEqual({
      intervalSeconds: 30,
      pollRequestsPerMinute: 120,
    });
  });

  it('sends both settings to the write endpoint and reports failures', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.method).toBe('PUT');
      expect(JSON.parse(String(init?.body))).toEqual({ interval_seconds: 45, poll_limit_per_minute: 120 });
      return jsonResponse(200, { ok: true });
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      pollingSettingsGateway.save({ intervalSeconds: 45, pollRequestsPerMinute: 120 })
    ).resolves.toBeUndefined();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(403, { ok: false, error: 'forbidden' }))
    );
    await expect(pollingSettingsGateway.save({ intervalSeconds: 45 })).rejects.toThrow('polling_save_failed');
  });
});
