import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataPoller } from './dataPoller';

function jsonResponse(status: number, body: unknown): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response;
}

type FetchStub = (url: string, init?: RequestInit) => Promise<Response>;

describe('the shared data poller', () => {
  let server: { put: (name: string, id: string, doc: Record<string, unknown>) => void };
  beforeEach(() => {
    const docs = new Map<string, Map<string, Record<string, unknown>>>();
    const clock = { value: 100 };
    const put = (name: string, id: string, doc: Record<string, unknown>) => {
      clock.value += 1;
      const t = docs.get(name) ?? new Map();
      t.set(id, { ...doc, revision: clock.value });
      docs.set(name, t);
    };
    const fetchStub: FetchStub = async (url, init) => {
      if (url !== '/api/data/changes') return jsonResponse(404, {});
      const rev = JSON.parse(String(init?.body)).rev as Record<string, number>;
      const data: Record<string, unknown> = {};
      for (const [name, since] of Object.entries(rev)) {
        const t = docs.get(name);
        const items: Record<string, unknown>[] = [];
        const removedIds: string[] = [];
        let revision = since;
        for (const [id, doc] of t ?? []) {
          const stamp = (doc.revision as number) ?? 0;
          if (stamp > since) {
            revision = stamp;
            if (doc.deleted === true) removedIds.push(id);
            else items.push({ ...doc, id, revision: stamp });
          }
        }
        if (items.length || removedIds.length) data[name] = { items, removedIds, revision };
      }
      return jsonResponse(200, { ok: true, data });
    };
    vi.stubGlobal('fetch', vi.fn(fetchStub));
    server = { put } as never;
  });
  afterEach(() => vi.unstubAllGlobals());

  it('delivers the first full read as complete, then the deltas incrementally', async () => {
    server.put('recipes', 'r1', { name_fr: 'Ojja' });
    server.put('recipes', 'r2', { name_fr: 'Kafteji' });
    const poller = new DataPoller();
    const received: unknown[] = [];
    poller.follow(
      'recipes',
      null,
      (changes) => received.push(changes),
      () => undefined
    );
    await vi.waitFor(() => expect(received.length).toBeGreaterThan(0));
    expect(received[0]).toMatchObject({ complete: true, removedIds: [] });
    expect((received[0] as { items: unknown[] }).items).toHaveLength(2);
    // A new document later arrives alone
    server.put('recipes', 'r3', { name_fr: 'Chakchouka' });
    poller.refresh();
    await vi.waitFor(() => expect(received.length).toBeGreaterThan(1));
    expect((received.at(-1) as { items: unknown[] }).items.map((d) => (d as { id: string }).id)).toEqual(['r3']);
    expect((received.at(-1) as { complete: boolean }).complete).toBe(false);
  });

  it('ends the first full read even when the collection is empty (server skips it)', async () => {
    const poller = new DataPoller();
    const received: unknown[] = [];
    poller.follow(
      'recipes',
      null,
      (changes) => received.push(changes),
      () => undefined
    );
    await vi.waitFor(() => expect(received.length).toBeGreaterThan(0));
    expect(received[0]).toMatchObject({ complete: true, items: [] });
  });

  it('applies deletion markers through removedIds', async () => {
    server.put('ingredients', 'i1', { name_fr: 'Tomate' });
    const poller = new DataPoller();
    const received: unknown[] = [];
    poller.follow(
      'ingredients',
      null,
      (changes) => received.push(changes),
      () => undefined
    );
    await vi.waitFor(() => expect(received.length).toBeGreaterThan(0));
    server.put('ingredients', 'i1', { deleted: true });
    poller.refresh();
    await vi.waitFor(() => expect(received.length).toBeGreaterThan(1));
    expect((received.at(-1) as { removedIds: string[] }).removedIds).toEqual(['i1']);
  });

  it('keeps polling after a network failure and recovers', async () => {
    const failing = vi.fn(async () => {
      throw new Error('offline');
    });
    vi.stubGlobal('fetch', failing);
    const poller = new DataPoller();
    const errors: number[] = [];
    poller.follow(
      'recipes',
      0,
      () => undefined,
      () => errors.push(errors.length + 1)
    );
    await vi.waitFor(() => expect(errors.length).toBeGreaterThan(0));
    // The next tick goes back to the answering stub
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { ok: true, data: {} }))
    );
    poller.refresh();
    // No throw: the poller stayed alive
    await vi.waitFor(() => expect(failing).toHaveBeenCalled());
  });

  it('one tick asks every followed collection at once', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { ok: true, data: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const poller = new DataPoller();
    poller.follow(
      'recipes',
      5,
      () => undefined,
      () => undefined
    );
    poller.follow(
      'countries',
      2,
      () => undefined,
      () => undefined
    );
    await vi.waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(1));
    // The latest tick carries every followed collection at once
    const last = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit | undefined];
    expect(JSON.parse(String(last[1]?.body)).rev).toEqual({ recipes: 5, countries: 2 });
  });
});

describe('the configurable polling interval', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('applies the interval configured in the backoffice for the next ticks', async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn(async () => jsonResponse(200, { ok: true, data: {} }));
      vi.stubGlobal('fetch', fetchMock);
      const poller = new DataPoller();
      poller.follow(
        'recipes',
        5,
        () => undefined,
        () => undefined
      );
      // first immediate tick
      await vi.advanceTimersByTimeAsync(10);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      // a 20 s interval (backoffice): the second tick comes at 20 s, not 60 s
      poller.setIntervalMs(20_000);
      await vi.advanceTimersByTimeAsync(20_000);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      // nonsense values are ignored
      poller.setIntervalMs(100);
      await vi.advanceTimersByTimeAsync(20_000);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });
});
