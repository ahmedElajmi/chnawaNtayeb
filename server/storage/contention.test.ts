import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import knex, { type Knex } from 'knex';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { COLLECTIONS } from './collections';
import { createSqliteKnex, createSqlStore, ensureSchema } from './sqlStore';
import { createMemoryDataStore } from './memoryDataStore';
import { TRANSACT_REJEUX, withTransactRetries } from './conflicts';
import type { DataStore, StorageChanges } from './types';

/**
 * Contention and constraints suite (lot 1.4, C1 + C4): real parallel connections over the
 * same backing, not just concurrent calls on one adapter. The contract suite
 * (contract.ts) stays the behavioural reference — this suite proves the mechanisms hold
 * when two writers really race: revision sequences, read-merge-write serialisation,
 * guarded claims, catch-up under concurrent writes, G-DIR (query coherence, T1–T5),
 * rollback.
 *
 * Engines: memory (reference) and SQLite (real parallel connections) always run. Any other
 * SQL engine runs the same scenarios when TEST_SQL_CLIENT + TEST_SQL_DSN are provided
 * (validated micro-arbitrage 2); absent, it is skipped cleanly and stays "not demonstrated".
 */

const DOC = (name: string): Record<string, unknown> => ({
  name_fr: name,
  is_published: true,
  category: 'plat_principal',
  steps: [],
  ingredients: [],
  prep_time_minutes: 5,
  cook_time_minutes: 10,
  base_servings: 2,
  estimated_cost_tnd: 8,
  cuisine_type: 'tunisienne',
  chef_tip: { fr: 'x' },
  description_fr: 'y',
});

/** A client-shaped, idempotent catch-up: applies one page to the seen map. */
const apply = (seen: Map<string, number>, page: StorageChanges): void => {
  for (const id of page.removedIds) seen.delete(id);
  for (const item of page.items) seen.set(item.id as string, item.revision as number);
};

/** The revisions delivered, in delivery order, must strictly increase and never repeat. */
const expectCleanFeed = (deliveryOrder: number[]): void => {
  for (let i = 1; i < deliveryOrder.length; i++) {
    expect(deliveryOrder[i]).toBeGreaterThan(deliveryOrder[i - 1]);
  }
};

/** The scenarios, identical for every engine (the expected conflict classes differ, the
 *  contractual guarantees do not). */
function contentionScenarios(
  kind: string,
  create: () => Promise<{
    storeA: DataStore;
    storeB: DataStore;
    reset: () => Promise<void>;
    close: () => Promise<void>;
  }>
) {
  describe(`contention (${kind})`, () => {
    let ctx: { storeA: DataStore; storeB: DataStore; reset: () => Promise<void>; close: () => Promise<void> };

    beforeAll(async () => {
      ctx = await create();
    });
    // A clean backing for every scenario: no test sees another test's rows (and both shapes
    // start from an empty collection, revision sequence included).
    beforeEach(async () => {
      await ctx.reset();
    });
    afterAll(() => ctx.close());

    it('keeps the revision sequence strictly increasing when two writers put at once', async () => {
      const writes: Promise<unknown>[] = [];
      for (let i = 0; i < 20; i++) {
        const store = i % 2 === 0 ? ctx.storeA : ctx.storeB;
        writes.push(store.put('recipes', `p${i}`, DOC(`Recette ${i}`)));
      }
      await Promise.all(writes);
      const seen = new Map<string, number>();
      let cursor = 0;
      for (;;) {
        const page = await ctx.storeA.changes('recipes', cursor, 100);
        apply(seen, page);
        cursor = page.revision;
        if (!page.more) break;
      }
      expect(seen.size).toBe(20);
      expectCleanFeed([...seen.values()]);
    });

    it('serialises concurrent transacts across two connections: no lost section', async () => {
      const sections = ['favorites', 'fridge', 'pantry', 'weeklyPlan'];
      const pushes = sections.map((section, i) =>
        (i % 2 === 0 ? ctx.storeA : ctx.storeB).transact('kitchen', 'u1', (current) => {
          const s = (current?.sections as Record<string, unknown> | undefined) ?? {};
          return { next: { ...current, sections: { ...s, [section]: { value: [section] } } }, result: section };
        })
      );
      await Promise.all(pushes);
      const merged = (await ctx.storeA.get('kitchen', 'u1'))!.sections as Record<string, unknown>;
      expect(Object.keys(merged).sort()).toEqual([...sections].sort());
    });

    it('gives a guarded claim to exactly one racing writer (the other conflicts, nothing doubles)', async () => {
      const guard = { name: 'email_index', id: 'a@b.co', field: 'taken', expected: null };
      const ops = (uid: string) => [
        { name: 'users' as const, id: uid, doc: { email: 'a@b.co', type: 'client' } },
        { name: 'email_index' as const, id: 'a@b.co', doc: { uid, taken: 1 } },
      ];
      const [first, second] = await Promise.all([
        ctx.storeA.commit(ops('uA'), guard),
        ctx.storeB.commit(ops('uB'), guard),
      ]);
      expect([first, second].filter((r) => r.ok)).toHaveLength(1);
      // Exactly one reservation and one account row landed (the loser rolled back whole)
      const uA = await ctx.storeA.findWhere('email_index', 'uid', 'uA', 10);
      const uB = await ctx.storeA.findWhere('email_index', 'uid', 'uB', 10);
      expect(uA.length + uB.length).toBe(1);
      expect(await ctx.storeA.findWhere('users', 'email', 'a@b.co', 10)).toHaveLength(1);
    });

    it('loses nothing in a catch-up running while another connection writes', async () => {
      // The reader pages the change feed while two connections write K documents
      const K = 30;
      let writerDone = false;
      const writer = (async () => {
        for (let i = 0; i < K; i++)
          await (i % 2 === 0 ? ctx.storeA : ctx.storeB).put('recipes', `w${i}`, DOC(`W ${i}`));
        writerDone = true;
      })();
      const seen = new Map<string, number>();
      const deliveryOrder: number[] = [];
      let cursor = 0;
      for (;;) {
        const page = await ctx.storeA.changes('recipes', cursor, 5);
        apply(seen, page);
        // Deliveries that were genuinely new this page (a rewritten id would not grow the map)
        for (const item of page.items) {
          if (!deliveryOrder.includes(item.revision as number)) deliveryOrder.push(item.revision as number);
        }
        cursor = page.revision;
        if (page.more) continue;
        if (writerDone) break;
        await writer; // the feed is drained at this instant: let the writer finish, then re-drain
      }
      await writer;
      expect(seen.size).toBe(K);
      expect(deliveryOrder.length).toBe(K);
      expectCleanFeed(deliveryOrder);
    });

    it('G-DIR T1–T5: directory pagination stays clean while another connection writes', async () => {
      // Ids are zero-padded: the directory orders by id, lexicographically
      for (let i = 0; i < 10; i++)
        await ctx.storeA.put('users', `u${String(i).padStart(2, '0')}`, { email: `u${i}@x.co`, type: 'client' });
      // First page: u00..u04 (id order), the strict cursor on u04
      const first = await ctx.storeA.page('users', { where: { field: 'type', value: 'client' }, limit: 5 });
      expect(first.items.map((d) => d.id)).toEqual(['u00', 'u01', 'u02', 'u03', 'u04']);
      expect(first.total).toBe(10);
      expect(first.nextCursor).toBe('u04');
      // Concurrent writes: four new matching users, one existing user deleted
      await ctx.storeB.put('users', 'u10', { email: 'u10@x.co', type: 'client' });
      await ctx.storeB.put('users', 'u11', { email: 'u11@x.co', type: 'client' });
      await ctx.storeB.remove('users', 'u02');
      await ctx.storeB.put('users', 'u12', { email: 'u12@x.co', type: 'client' });
      await ctx.storeB.put('users', 'u13', { email: 'u13@x.co', type: 'client' });
      // T1 + T2: continue the pagination — no duplicate, always strictly after the cursor
      const delivered = first.items.map((d) => d.id as string);
      let after: string | null = first.nextCursor;
      while (after) {
        const page = await ctx.storeA.page('users', { where: { field: 'type', value: 'client' }, limit: 5, after });
        for (const item of page.items) {
          expect((item.id as string) > after!).toBe(true); // T2: monotonic, never before the cursor
          delivered.push(item.id as string);
        }
        after = page.nextCursor;
      }
      expect(new Set(delivered).size).toBe(delivered.length); // T1: no id delivered twice
      expect(delivered).toEqual([
        'u00',
        'u01',
        'u02',
        'u03',
        'u04',
        'u05',
        'u06',
        'u07',
        'u08',
        'u09',
        'u10',
        'u11',
        'u12',
        'u13',
      ]);
      // T3: once the writes have settled, the total of a fresh call equals an independent count
      const fresh = await ctx.storeA.page('users', { where: { field: 'type', value: 'client' }, limit: 5 });
      const independent = await ctx.storeA.findWhere('users', 'type', 'client', 1000);
      expect(fresh.total).toBe(independent.length);
      // T5: the drain terminated and the pages after the writes delivered the survivors only
      expect(delivered.slice(5)).toEqual(['u05', 'u06', 'u07', 'u08', 'u09', 'u10', 'u11', 'u12', 'u13']);
    });

    it('G-DIR T4: continuing after the cursor document was deleted never restarts the pagination', async () => {
      for (let i = 0; i < 10; i++)
        await ctx.storeA.put('users', `v${String(i).padStart(2, '0')}`, { email: `v${i}@x.co`, type: 'client' });
      const first = await ctx.storeA.page('users', { where: { field: 'type', value: 'client' }, limit: 5 });
      expect(first.nextCursor).toBe('v04');
      await ctx.storeB.remove('users', 'v04'); // the cursor document disappears
      const second = await ctx.storeA.page('users', {
        where: { field: 'type', value: 'client' },
        limit: 5,
        after: first.nextCursor!,
      });
      expect(second.items.map((d) => d.id)).toEqual(['v05', 'v06', 'v07', 'v08', 'v09']); // no restart at v00
    });

    it('rollback: a batch that fails midway leaves no partial write and no revision hole', async () => {
      const before = await ctx.storeA.maxRevision('recipes');
      const failing = { name_fr: 'Cassé', bad: Number('not a number') };
      await expect(
        ctx.storeA.commit([
          { name: 'recipes', id: 'rb1', doc: DOC('Valide') },
          { name: 'recipes', id: 'rb2', doc: failing },
        ])
      ).rejects.toThrow();
      expect(await ctx.storeA.get('recipes', 'rb1')).toBeNull();
      expect(await ctx.storeA.get('recipes', 'rb2')).toBeNull();
      expect(await ctx.storeA.maxRevision('recipes')).toBe(before); // the sequence has no hole
    });
  });
}

contentionScenarios('memory', async () => {
  // One adapter IS one concurrency domain for the memory store (single process); the
  // contract suite covers the parallel-call shapes on it. A reset = fresh stores.
  let storeA = createMemoryDataStore();
  return {
    get storeA() {
      return storeA;
    },
    get storeB() {
      return storeA;
    },
    reset: async () => {
      storeA = createMemoryDataStore();
    },
    close: async () => undefined,
  };
});

describe('SQLite file: real parallel connections', () => {
  let dbA: Knex;
  let dbB: Knex;
  let file = '';

  beforeAll(async () => {
    file = join(tmpdir(), `contention-${process.pid}-${Date.now()}.db`);
    dbA = createSqliteKnex(file);
    dbB = createSqliteKnex(file); // a second pool, its own connection: the two really race
    await ensureSchema(dbA);
  });

  afterAll(async () => {
    await dbA.destroy();
    await dbB.destroy();
    // WAL leaves -wal/-shm sidecars next to the file
    rmSync(file, { force: true });
    rmSync(`${file}-wal`, { force: true });
    rmSync(`${file}-shm`, { force: true });
  });

  contentionScenarios('sqlite', async () => ({
    storeA: createSqlStore(dbA),
    storeB: createSqlStore(dbB),
    reset: async () => {
      // A straggler from the previous scenario may still hold the write lock for a moment
      for (let attempt = 0; ; attempt++) {
        try {
          for (const spec of Object.values(COLLECTIONS)) await dbA(spec.name).delete();
          return;
        } catch (error) {
          if (attempt >= 20) throw error;
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
      }
    },
    close: async () => undefined,
  }));
});

// Any other SQL engine: the same scenarios, run only when an instance is provided
// (validated micro-arbitrage 2). Absent = skipped cleanly: never "compatible" untested.
const engine = process.env.TEST_SQL_CLIENT;
const dsn = process.env.TEST_SQL_DSN;
describe.skipIf(!engine || !dsn)(`SQL engine under test: ${engine ?? '(none)'}`, () => {
  let db: Knex;

  beforeAll(async () => {
    // The driver package is required by knex at construction: a requested engine without
    // its driver fails loudly (a declared compatibility must come from a real green run).
    db = knex({ client: engine, connection: dsn });
    await ensureSchema(db);
  });

  afterAll(async () => {
    await db.destroy();
  });

  contentionScenarios(`${engine} (gated)`, async () => ({
    storeA: createSqlStore(db),
    storeB: createSqlStore(db),
    reset: async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          for (const spec of Object.values(COLLECTIONS)) await db(spec.name).delete();
          return;
        } catch (error) {
          if (attempt >= 20) throw error;
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
      }
    },
    close: async () => undefined,
  }));
});

describe('transact retry budget (C3: initial attempt + 3 rejeux, then a clean error)', () => {
  it('retries a conflict within the budget and succeeds', async () => {
    let attempts = 0;
    const result = await withTransactRetries(
      async () => {
        attempts += 1;
        if (attempts <= 3) throw new Error('lock lost');
        return 'done';
      },
      () => true
    );
    expect(result).toBe('done');
    expect(attempts).toBe(4); // 1 attempt + 3 rejeux
  });

  it('throws the storage error once the budget is exhausted', async () => {
    let attempts = 0;
    await expect(
      withTransactRetries(
        async () => {
          attempts += 1;
          throw new Error(`always conflicting (${attempts})`);
        },
        () => true
      )
    ).rejects.toThrow('always conflicting (4)');
    expect(attempts).toBe(4); // the 4th failure is beyond the 3 rejeux: surfaced, not retried
  });

  it('never retries a non-conflict failure', async () => {
    let attempts = 0;
    await expect(
      withTransactRetries(
        async () => {
          attempts += 1;
          throw new Error('storage down');
        },
        () => false
      )
    ).rejects.toThrow('storage down');
    expect(attempts).toBe(1);
  });

  it('the budget constant is the validated one', () => {
    expect(TRANSACT_REJEUX).toBe(3);
  });
});
