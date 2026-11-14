import { afterEach, describe, expect, it, vi } from 'vitest';
import { kitchenSyncHttpGateway } from './kitchenSyncHttpGateway';

function jsonResponse(status: number, body: unknown): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe('the kitchen sync HTTP gateway', () => {
  it('answers null when the account has no document yet', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { ok: true, doc: null }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(kitchenSyncHttpGateway.pull()).resolves.toBeNull();
  });

  it('reads the stored document back in the port shape', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        ok: true,
        doc: {
          uid: 'u1',
          sections: {
            favorites: { value: ['r1'], updated_at: 100 },
            groceryList: { value: [{ id: 'g1' }], updated_at: 200 },
            unknown_section: { value: 'x', updated_at: 300 },
          },
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const doc = await kitchenSyncHttpGateway.pull();
    expect(doc).toEqual({
      favorites: { value: ['r1'], updatedAt: 100 },
      groceryList: { value: [{ id: 'g1' }], updatedAt: 200 },
    });
  });

  it('throws when the server cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(500, {}))
    );
    await expect(kitchenSyncHttpGateway.pull()).rejects.toThrow('kitchen_unavailable');
  });

  it('sends the changed sections in the server shape and returns the merged document', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.method).toBe('PUT');
      expect(JSON.parse(String(init?.body))).toEqual({
        sections: { favorites: { value: ['r1', 'r2'], updated_at: 500 } },
      });
      return jsonResponse(200, {
        ok: true,
        doc: { sections: { favorites: { value: ['r1', 'r2'], updated_at: 500 } } },
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const doc = await kitchenSyncHttpGateway.push({ favorites: { value: ['r1', 'r2'], updatedAt: 500 } });
    expect(doc.favorites).toEqual({ value: ['r1', 'r2'], updatedAt: 500 });
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
