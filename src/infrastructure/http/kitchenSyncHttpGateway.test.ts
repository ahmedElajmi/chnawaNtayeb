import { afterEach, describe, expect, it, vi } from 'vitest';
import { kitchenSyncHttpGateway } from './kitchenSyncHttpGateway';
import type { ElementSet } from '@/core/kitchen';

function jsonResponse(status: number, body: unknown): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response;
}

/** A remote set section as the server keeps it (added/removed versions per id). */
const elementSet = (added: string[], removed: string[] = [], at: number): ElementSet => ({
  added: Object.fromEntries(added.map((id) => [id, { physical: at, counter: 0, device: 'remote' }])),
  removed: Object.fromEntries(removed.map((id) => [id, { physical: at, counter: 0, device: 'remote' }])),
});

afterEach(() => vi.unstubAllGlobals());

describe('the kitchen sync HTTP gateway', () => {
  it('answers null when the account has no document yet', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { ok: true, doc: null }));
    vi.stubGlobal('fetch', fetchMock);
    const pull = await kitchenSyncHttpGateway.pull();
    expect(pull.doc).toBeNull();
    expect(pull.reconciliationRequired).toBe(false);
  });

  it('reads the stored document back in the port shape', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        ok: true,
        doc: {
          uid: 'u1',
          sections: {
            favorites: { value: elementSet(['r1'], [], 100), updated_at: 100 },
            groceryLists: { value: { lists: [{ id: 'l1' }], activeId: 'l1' }, updated_at: 200 },
            // Legacy sections of the previous app version: never adopted by the current client
            groceryList: { value: [{ id: 'g1' }], updated_at: 250 },
            groceryMeta: { value: { note: 'old' }, updated_at: 260 },
            unknown_section: { value: 'x', updated_at: 300 },
          },
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const pull = await kitchenSyncHttpGateway.pull();
    expect(pull.doc).toEqual({
      favorites: { value: elementSet(['r1'], [], 100), updatedAt: 100 },
      groceryLists: { value: { lists: [{ id: 'l1' }], activeId: 'l1' }, updatedAt: 200 },
    });
  });

  it('throws when the server cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(500, {}))
    );
    await expect(kitchenSyncHttpGateway.pull()).rejects.toThrow('kitchen_unavailable');
  });

  it('declares the protocol version on every request and reads back the reconciliation signal', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      expect(headers['X-Kitchen-Protocol-Version']).toBe('1');
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, doc: null }),
        headers: new Headers({ 'X-Kitchen-Protocol-Status': 'reconciliation-required' }),
      } as unknown as Response;
    });
    vi.stubGlobal('fetch', fetchMock);
    const pull = await kitchenSyncHttpGateway.pull();
    expect(pull.doc).toBeNull();
    expect(pull.reconciliationRequired).toBe(true);
  });

  it('reports no reconciliation signal when the response carries none', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { ok: true, doc: null }))
    );
    const pull = await kitchenSyncHttpGateway.pull();
    expect(pull.reconciliationRequired).toBe(false);
  });

  it('surfaces the protocol refusals as distinct codes, for pull and push alike', async () => {
    const refused = (status: number, error: string): Response =>
      ({ ok: false, status, json: async () => ({ ok: false, error }) }) as unknown as Response;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => refused(409, 'protocol-version-unsupported'))
    );
    await expect(kitchenSyncHttpGateway.pull()).rejects.toThrow('kitchen_protocol_unsupported');
    await expect(kitchenSyncHttpGateway.push({})).rejects.toThrow('kitchen_protocol_unsupported');
    const invalid = vi.fn(async () => refused(400, 'protocol-version-invalid'));
    vi.stubGlobal('fetch', invalid);
    await expect(kitchenSyncHttpGateway.pull()).rejects.toThrow('kitchen_protocol_invalid');
    await expect(kitchenSyncHttpGateway.push({})).rejects.toThrow('kitchen_protocol_invalid');
  });

  it('sends the changed sections in the server shape and returns the merged document', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.method).toBe('PUT');
      const headers = (init?.headers ?? {}) as Record<string, string>;
      expect(headers['X-Kitchen-Protocol-Version']).toBe('1');
      expect(JSON.parse(String(init?.body))).toEqual({
        sections: { favorites: { value: elementSet(['r1', 'r2'], [], 500), updated_at: 500 } },
      });
      return jsonResponse(200, {
        ok: true,
        doc: { sections: { favorites: { value: elementSet(['r1', 'r2'], [], 500), updated_at: 500 } } },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const doc = await kitchenSyncHttpGateway.push({
      favorites: { value: elementSet(['r1', 'r2'], [], 500), updatedAt: 500 },
    });
    expect(doc.favorites).toEqual({ value: elementSet(['r1', 'r2'], [], 500), updatedAt: 500 });
  });

  it('throws when the server refuses the push', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(400, { ok: false, error: 'invalid-input' }))
    );
    await expect(kitchenSyncHttpGateway.push({})).rejects.toThrow('kitchen_refused');
  });

  it('sends the session token of the signed-in account', async () => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) =>
        key === 'user_session'
          ? JSON.stringify({ token: 'tok', uid: 'u1', kind: 'client', expiresAt: Date.now() + 1000 })
          : null,
      setItem: () => undefined,
      removeItem: () => undefined,
    });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer tok');
      return jsonResponse(200, { ok: true, doc: null });
    });
    vi.stubGlobal('fetch', fetchMock);
    await kitchenSyncHttpGateway.pull();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
