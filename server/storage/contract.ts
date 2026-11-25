import { expect, describe, it } from 'vitest';
import type { CommitResult, DataStore } from './types';
import { DocumentValidationError } from './validation';

/**
 * The behaviour every DataStore implementation (memory, Firestore, SQL…) must have.
 * A new backend runs this suite in its own test file — if it passes, the routes and
 * the future client need no change at all.
 */

/** The revision of a commit result (the union's success branch) — `remove` returns it bare. */
const committed = (result: CommitResult | number): number => {
  if (typeof result === 'number') return result;
  if (!result.ok) throw new Error('unexpected commit conflict in test');
  return result.revision;
};

export function describeDataStore(name: string, create: () => DataStore): void {
  describe(`DataStore (${name})`, () => {
    it('writes and reads back whole documents, revisions increasing', async () => {
      const store = create();
      const r1 = await store.put('recipes', 'r1', { name_fr: 'Ojja' });
      const r2 = await store.put('recipes', 'r1', { name_fr: 'Ojja aux Merguez' });
      expect(r2).toBeGreaterThan(r1);
      const changes = await store.changes('recipes', 0, 100);
      expect(changes.items).toHaveLength(1);
      expect(changes.items[0]).toMatchObject({ id: 'r1', name_fr: 'Ojja aux Merguez' });
      expect(changes.revision).toBe(r2);
    });

    it('answers a change query with only what is newer than the given revision', async () => {
      const store = create();
      const r1 = await store.put('ingredients', 'i1', { name_fr: 'Tomate' });
      await store.put('ingredients', 'i2', { name_fr: 'Oignon' });
      const changes = await store.changes('ingredients', r1, 100);
      expect(changes.items.map((d) => d.id)).toEqual(['i2']);
    });

    it('bounds a catch-up by the limit and lets the client continue from the returned revision', async () => {
      const store = create();
      for (let i = 1; i <= 5; i++) await store.put('recipes', `r${i}`, { name_fr: `Recette ${i}` });
      const page1 = await store.changes('recipes', 0, 3);
      expect(page1.items).toHaveLength(3);
      const page2 = await store.changes('recipes', page1.revision, 3);
      expect(page2.items).toHaveLength(2);
      const nothing = await store.changes('recipes', page2.revision, 3);
      expect(nothing.items).toHaveLength(0);
      expect(nothing.revision).toBe(page2.revision);
    });

    it('publishes deletions as markers the change query returns through removedIds', async () => {
      const store = create();
      await store.put('recipes', 'r1', { name_fr: 'Ojja' });
      const removeRevision = await store.remove('recipes', 'r1');
      const changes = await store.changes('recipes', 0, 100);
      expect(changes.removedIds).toEqual(['r1']);
      expect(changes.items).toHaveLength(0);
      expect(changes.revision).toBe(removeRevision);
      // a rewrite clears the marker
      await store.put('recipes', 'r1', { name_fr: 'Ojja de retour' });
      const back = await store.changes('recipes', removeRevision, 100);
      expect(back.removedIds).toEqual([]);
      expect(back.items.map((d) => d.id)).toEqual(['r1']);
    });

    it('keeps collections apart', async () => {
      const store = create();
      await store.put('recipes', 'r1', { name_fr: 'Ojja' });
      await store.put('ingredients', 'i1', { name_fr: 'Tomate' });
      expect((await store.changes('recipes', 0, 100)).items.map((d) => d.id)).toEqual(['r1']);
      expect((await store.changes('ingredients', 0, 100)).items.map((d) => d.id)).toEqual(['i1']);
      expect(await store.maxRevision('countries')).toBe(0);
    });

    it('reports the newest revision of a collection', async () => {
      const store = create();
      expect(await store.maxRevision('recipes')).toBe(0);
      await store.put('recipes', 'r1', { name_fr: 'Ojja' });
      const r2 = await store.put('recipes', 'r2', { name_fr: 'Kafteji' });
      expect(await store.maxRevision('recipes')).toBe(r2);
    });

    it('flags a bounded catch-up with `more` so the client catches up at once', async () => {
      const store = create();
      for (let i = 1; i <= 5; i++) await store.put('recipes', `r${i}`, { name_fr: `Recette ${i}` });
      const page1 = await store.changes('recipes', 0, 3);
      expect(page1.more).toBe(true);
      const page2 = await store.changes('recipes', page1.revision, 3);
      expect(page2.more).toBe(false);
    });

    it('answers equality queries with every matching document', async () => {
      const store = create();
      await store.put('recipes_versions', 'v1', { item_id: 'r1', version: 1 });
      await store.put('recipes_versions', 'v2', { item_id: 'r1', version: 2 });
      await store.put('recipes_versions', 'v3', { item_id: 'r2', version: 1 });
      const found = await store.findWhere('recipes_versions', 'item_id', 'r1', 10);
      expect(found.map((d) => d.id).sort()).toEqual(['v1', 'v2']);
      expect(await store.findWhere('recipes_versions', 'item_id', 'ghost', 10)).toEqual([]);
    });

    it('pages a filtered listing with an exact total and a cursor', async () => {
      const store = create();
      await store.put('users', 'u1', { email: 'a@b.co', type: 'client' });
      await store.put('users', 'u2', { email: 'b@b.co', type: 'client' });
      await store.put('users', 'u3', { email: 'c@b.co', type: 'employee' });
      const clients = await store.page('users', { where: { field: 'type', value: 'client' }, limit: 10 });
      expect(clients.total).toBe(2);
      expect(clients.items.map((d) => d.id).sort()).toEqual(['u1', 'u2']);
      const first = await store.page('users', { where: { field: 'type', value: 'client' }, limit: 1 });
      expect(first.items).toHaveLength(1);
      expect(first.nextCursor).toBe(first.items[0].id);
      const next = await store.page('users', {
        where: { field: 'type', value: 'client' },
        limit: 10,
        after: first.nextCursor,
      });
      expect(next.items.map((d) => d.id)).toEqual(['u2']);
      const search = await store.page('users', { prefix: { field: 'email', value: 'b' }, limit: 10 });
      expect(search.total).toBe(1);
      expect(search.items.map((d) => d.id)).toEqual(['u2']);
    });

    it('lists every id, deletion markers included', async () => {
      const store = create();
      await store.put('recipes', 'r1', { name_fr: 'Ojja' });
      await store.put('recipes', 'r2', { name_fr: 'Kafteji' });
      await store.remove('recipes', 'r2');
      expect((await store.ids('recipes')).sort()).toEqual(['r1', 'r2']);
    });

    it('writes a batch atomically and fails the whole batch on a failed guard', async () => {
      const store = create();
      await store.put('recipes_workspace', 'r1', { written_at: 10, content: { name_fr: 'Brouillon' } });
      const ok = await store.commit(
        [
          { name: 'recipes', id: 'r1', doc: { name_fr: 'Publiée' } },
          { name: 'recipes_versions', id: 'r1-v1', doc: { version: 1 } },
          { name: 'recipes_workspace', id: 'r1', doc: { written_at: 11, content: { name_fr: 'Publiée' } } },
        ],
        { name: 'recipes_workspace', id: 'r1', field: 'written_at', expected: 10 }
      );
      expect(ok.ok).toBe(true);
      expect(await store.get('recipes', 'r1')).toMatchObject({ name_fr: 'Publiée' });

      const conflict = await store.commit([{ name: 'recipes', id: 'r1', doc: { name_fr: 'Écrasée' } }], {
        name: 'recipes_workspace',
        id: 'r1',
        field: 'written_at',
        expected: 10,
      });
      expect(conflict).toEqual({ ok: false, conflict: true });
      expect(await store.get('recipes', 'r1')).toMatchObject({ name_fr: 'Publiée' });

      // A missing guard document counts as `expected: null` (first publication)
      const fresh = await store.commit([{ name: 'recipes_workspace', id: 'r9', doc: { written_at: 1 } }], {
        name: 'recipes_workspace',
        id: 'r9',
        field: 'written_at',
        expected: null,
      });
      expect(fresh.ok).toBe(true);
    });

    it('claims an absent guarded document exactly once: the second claimer conflicts and writes nothing', async () => {
      const store = create();
      // The same shape the account creation uses: profile + credentials + e-mail reservation
      const guard = { name: 'email_index', id: 'a@b.co', field: 'taken', expected: null };
      const first = await store.commit(
        [
          { name: 'users', id: 'u1', doc: { email: 'a@b.co' } },
          { name: 'email_index', id: 'a@b.co', doc: { uid: 'u1', taken: 1 } },
        ],
        guard
      );
      expect(first.ok).toBe(true);
      // A second registration of the same address: the reservation is taken, nothing is written
      const second = await store.commit(
        [
          { name: 'users', id: 'u2', doc: { email: 'a@b.co' } },
          { name: 'email_index', id: 'a@b.co', doc: { uid: 'u2', taken: 1 } },
        ],
        guard
      );
      expect(second).toEqual({ ok: false, conflict: true });
      expect(await store.get('users', 'u2')).toBeNull();
      expect(await store.get('email_index', 'a@b.co')).toMatchObject({ uid: 'u1' });
      // A deleted reservation frees the address
      await store.remove('email_index', 'a@b.co');
      const freed = await store.commit([{ name: 'email_index', id: 'a@b.co', doc: { uid: 'u2', taken: 1 } }], guard);
      expect(freed.ok).toBe(true);
    });

    it('transacts a read-merge-write: the operation sees the stored document and the write is atomic', async () => {
      const store = create();
      // First transact on an absent document: current is null
      const created = await store.transact('kitchen', 'u1', (current) => {
        expect(current).toBeNull();
        return { next: { sections: { favorites: { updated_at: 10, value: ['r1'] } } }, result: 'created' };
      });
      expect(created).toBe('created');
      const stored = await store.get('kitchen', 'u1');
      expect(stored).toMatchObject({ sections: { favorites: { updated_at: 10, value: ['r1'] } } });
      // `id` and `revision` are owned by the storage layer: never inside the document
      expect(stored && 'revision' in (stored.sections as Record<string, unknown>)).toBe(false);

      // Second transact: the operation receives the stored document as it is
      await store.transact('kitchen', 'u1', (current) => {
        const doc = current as Record<string, unknown>;
        const sections = doc.sections as Record<string, unknown>;
        return {
          next: { ...doc, sections: { ...sections, pantry: { updated_at: 20, value: ['i1'] } } },
          result: null,
        };
      });
      expect(await store.get('kitchen', 'u1')).toMatchObject({
        sections: { favorites: { updated_at: 10, value: ['r1'] }, pantry: { updated_at: 20, value: ['i1'] } },
      });

      // Returning the current reference writes nothing (no revision bump)
      const before = (await store.get('kitchen', 'u1'))!.revision as number;
      await store.transact('kitchen', 'u1', (current) => ({ next: current, result: 'untouched' }));
      expect((await store.get('kitchen', 'u1'))!.revision as number).toBe(before);

      // A deleted document counts as an absent one: the next transact recreates it
      await store.remove('kitchen', 'u1');
      const recreated = await store.transact('kitchen', 'u1', (current) => ({
        next: current === null ? { sections: {} } : current,
        result: current,
      }));
      expect(recreated).toBeNull();
      expect(await store.get('kitchen', 'u1')).toMatchObject({ sections: {} });
    });

    it('writes nothing when one batch op is invalid: no partial write, no consumed revision', async () => {
      const store = create();
      await store.put('recipes', 'r1', { name_fr: 'Ojja' });
      const before = await store.maxRevision('recipes');
      // The second op violates the shared id rules: the whole commit is refused upfront,
      // before anything is written — the valid first op is NOT applied alone.
      await expect(
        store.commit([
          { name: 'recipes', id: 'r1', doc: { name_fr: 'Publiée' } },
          { name: 'recipes', id: 'bad/id', doc: { name_fr: 'Invalide' } },
        ])
      ).rejects.toBeInstanceOf(DocumentValidationError);
      expect(await store.get('recipes', 'r1')).toMatchObject({ name_fr: 'Ojja' });
      expect(await store.maxRevision('recipes')).toBe(before);
      // The same refusal for a non-JSON-safe payload: nothing is stored, nothing is bumped
      await expect(
        store.commit([{ name: 'recipes', id: 'r2', doc: { value: Number.POSITIVE_INFINITY } }])
      ).rejects.toBeInstanceOf(DocumentValidationError);
      expect(await store.get('recipes', 'r2')).toBeNull();
      expect(await store.maxRevision('recipes')).toBe(before);
    });

    it('leaves the document untouched and its revision unconsumed when a transact callback throws', async () => {
      const store = create();
      await store.transact('kitchen', 'u1', () => ({ next: { sections: {} }, result: 'ok' }));
      const before = (await store.get('kitchen', 'u1'))!.revision as number;
      const boom = new Error('callback failure');
      await expect(
        store.transact('kitchen', 'u1', () => {
          throw boom;
        })
      ).rejects.toBe(boom);
      const after = await store.get('kitchen', 'u1');
      expect(after).toMatchObject({ sections: {} });
      expect(after!.revision).toBe(before);
    });

    it('stamps every touched collection once per commit and keeps each feed monotone', async () => {
      const store = create();
      await store.put('recipes_versions', 'seed', { version: 0 });
      const beforeR = await store.maxRevision('recipes');
      const beforeV = await store.maxRevision('recipes_versions');
      const result = await store.commit([
        { name: 'recipes', id: 'r1', doc: { name_fr: 'Publiée' } },
        { name: 'recipes_versions', id: 'r1-v1', doc: { version: 1 } },
      ]);
      expect(result.ok).toBe(true);
      const rev = committed(result);
      const afterR = await store.maxRevision('recipes');
      const afterV = await store.maxRevision('recipes_versions');
      // Each touched collection advanced strictly once; the commit revision is the max of them
      expect(afterR).toBeGreaterThan(beforeR);
      expect(afterV).toBeGreaterThan(beforeV);
      expect(rev).toBe(Math.max(afterR, afterV));
      // Every collection keeps its own strictly increasing sequence afterwards (no hole, no reuse)
      expect(await store.put('recipes', 'r2', { name_fr: 'Kafteji' })).toBeGreaterThan(afterR);
      expect(await store.put('recipes_versions', 'r1-v2', { version: 2 })).toBeGreaterThan(afterV);
    });

    it('serialises concurrent transacts on the same document: no read-merge-write loses a section', async () => {
      const store = create();
      // The same shape two devices pushing different sections at once produce: each transact
      // merges its own section over whatever the previous one wrote
      const pushes = ['favorites', 'fridge', 'pantry', 'weeklyPlan', 'groceryList', 'groceryMeta'].map((section, i) =>
        store.transact('kitchen', 'u1', (current) => {
          const sections = (current?.sections as Record<string, unknown> | undefined) ?? {};
          return {
            next: { ...current, sections: { ...sections, [section]: { updated_at: 100 + i, value: [section] } } },
            result: section,
          };
        })
      );
      const results = await Promise.all(pushes);
      expect(results).toHaveLength(6);
      const merged = (await store.get('kitchen', 'u1'))!.sections as Record<string, unknown>;
      expect(Object.keys(merged).sort()).toEqual([
        'favorites',
        'fridge',
        'groceryList',
        'groceryMeta',
        'pantry',
        'weeklyPlan',
      ]);
    }, 15_000);

    // ------------------------------------------------------------------------
    // Structured change cursor: one commit = one revision shared by its ops, the tie set
    // is covered completely by the strict resume, and the inclusive resume re-delivers it.
    // ------------------------------------------------------------------------

    it('shares one revision across a commit and resumes the tie set exactly from the cursor', async () => {
      const store = create();
      const done = await store.commit([
        { name: 'recipes', id: 'r1', doc: { name_fr: 'Ojja' } },
        { name: 'recipes', id: 'r2', doc: { name_fr: 'Kafteji' } },
      ]);
      expect(done.ok).toBe(true);
      // One commit = one revision shared by every op of the collection (a frozen tie set)
      expect((await store.get('recipes', 'r1'))!.revision).toBe(committed(done));
      expect((await store.get('recipes', 'r2'))!.revision).toBe(committed(done));
      // The page is delivered in contract order (revision, id) with the exact resume position
      const page = await store.changes('recipes', 0, 10);
      expect(page.items.map((d) => d.id)).toEqual(['r1', 'r2']);
      expect(page.cursor).toEqual({ revision: committed(done), id: 'r2' });
      expect(page.more).toBe(false);
      // Strict resume from an earlier tie position: the rest arrives, nothing is lost
      const rest = await store.changes('recipes', { revision: committed(done), id: 'r1' }, 10);
      expect(rest.items.map((d) => d.id)).toEqual(['r2']);
      expect(rest.more).toBe(false);
    });

    it('delivers a whole revision group rather than cutting inside it (the limit is soft)', async () => {
      const store = create();
      const ops = Array.from({ length: 5 }, (_, i) => ({
        name: 'recipes' as const,
        id: `r${i + 1}`,
        doc: { name_fr: `Recette ${i + 1}` },
      }));
      const done = await store.commit(ops);
      expect(done.ok).toBe(true);
      // The group of 5 exceeds the page limit of 3: delivered whole, never cut
      const page = await store.changes('recipes', 0, 3);
      expect(page.items).toHaveLength(5);
      expect(page.items.map((d) => d.id).sort()).toEqual(['r1', 'r2', 'r3', 'r4', 'r5']);
      expect(page.more).toBe(false);
      expect(page.cursor).toEqual({ revision: committed(done), id: 'r5' });
    });

    it('re-delivers the frontier revision inclusively when the cursor carries no id', async () => {
      const store = create();
      const done = await store.commit([
        { name: 'recipes', id: 'r1', doc: { name_fr: 'Ojja' } },
        { name: 'recipes', id: 'r2', doc: { name_fr: 'Kafteji' } },
      ]);
      expect(done.ok).toBe(true);
      // Between polls the client resumes at the revision only: the whole tie set comes back
      // (consumption is idempotent — an already-applied change is a no-op, never a loss)
      const again = await store.changes('recipes', { revision: committed(done) }, 10);
      expect(again.items.map((d) => d.id).sort()).toEqual(['r1', 'r2']);
    });

    it('covers deletion markers and rewrites in the tie set exactly like modifications', async () => {
      const store = create();
      await store.put('recipes', 'r0', { name_fr: 'Ancienne' });
      const seen = await store.changes('recipes', 0, 100);
      // One commit mixing a modification and a marker: same revision, both in the feed
      const done = await store.commit([
        { name: 'recipes', id: 'r1', doc: { name_fr: 'Ojja' } },
        { name: 'recipes', id: 'r2', doc: { deleted: true } },
      ]);
      expect(done.ok).toBe(true);
      // The tie group (modification + marker) is delivered whole, marker included
      const page = await store.changes('recipes', seen.revision, 1);
      expect(page.items.map((d) => d.id)).toEqual(['r1']);
      expect(page.removedIds).toEqual(['r2']);
      expect(page.cursor).toEqual({ revision: committed(done), id: 'r2' });
      expect(page.more).toBe(false);
      expect(page.revision).toBe(committed(done));
      // Resuming from the cursor answers nothing more
      const rest = await store.changes('recipes', page.cursor!, 10);
      expect(rest.items).toHaveLength(0);
      expect(rest.removedIds).toHaveLength(0);
      expect(rest.more).toBe(false);
    });

    it('strips undefined fields (a removed field is absent) and refuses non-JSON-safe documents', async () => {
      const store = create();
      // `undefined` is the shape of a removed field: the write lands without it, on every provider
      await store.put('recipes', 'r1', { name_fr: 'Ojja', tags: undefined });
      expect(await store.get('recipes', 'r1')).toMatchObject({ name_fr: 'Ojja' });
      expect((await store.get('recipes', 'r1'))!.tags).toBeUndefined();
      // Inside an array, `undefined` becomes null (JSON semantics: nothing is lost)
      await store.put('recipes', 'r3', { tags: ['ok', undefined] });
      expect((await store.get('recipes', 'r3'))!.tags).toEqual(['ok', null]);
      // NaN, provider types, class instances and circular references are refused, nothing written
      await expect(store.put('recipes', 'r2', { price: Number.NaN })).rejects.toThrow();
      await expect(store.put('recipes', 'r2', { when: new Date() })).rejects.toThrow();
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      await expect(store.put('recipes', 'r2', circular)).rejects.toThrow();
      expect((await store.changes('recipes', 0, 10)).items.map((d) => d.id)).toEqual(['r1', 'r3']);
    });

    it('refuses ids outside the common guarantee (never a data lockout for legal ids)', async () => {
      const store = create();
      await expect(store.put('recipes', '', { name_fr: 'x' })).rejects.toThrow();
      await expect(store.put('recipes', 'a/b', { name_fr: 'x' })).rejects.toThrow();
      await expect(store.put('recipes', '.', { name_fr: 'x' })).rejects.toThrow();
      await expect(store.put('recipes', '..', { name_fr: 'x' })).rejects.toThrow();
      // The reserved Firestore pattern __.*__ : two underscores at the start AND the end
      await expect(store.put('recipes', '__internal__', { name_fr: 'x' })).rejects.toThrow();
      await expect(store.put('recipes', '__abc__', { name_fr: 'x' })).rejects.toThrow();
      await expect(store.put('recipes', '____', { name_fr: 'x' })).rejects.toThrow();
      // Plain ids, dots-only ids and dot-initial ids stay LEGAL
      await store.put('recipes', 'internal', { name_fr: 'x' });
      await store.put('recipes', 'abc', { name_fr: 'x' });
      await store.put('recipes', '...', { name_fr: 'x' });
      await store.put('recipes', '.hidden', { name_fr: 'x' });
      await store.put('recipes', 'a.b', { name_fr: 'x' });
      await store.put('recipes', '__leading', { name_fr: 'x' }); // double underscores, no closing pair
      await store.put('recipes', 'trailing__', { name_fr: 'x' });
      // E-mails, guest subs and long legal ids stay accepted — no existing data excluded
      await store.put('email_index', 'a@b.co', { taken: 1 });
      await store.put('kitchen', 'guest:0123456789abcdef', { sections: {} });
      await store.put('recipes', 'x'.repeat(1500), { name_fr: 'x' });
    });

    it('refuses a commit beyond its envelope before writing anything', async () => {
      const store = create();
      const ops = Array.from({ length: 11 }, (_, i) => ({
        name: 'recipes' as const,
        id: `r${i + 1}`,
        doc: { name_fr: `Recette ${i + 1}` },
      }));
      await expect(store.commit(ops)).rejects.toThrow();
      expect(await store.maxRevision('recipes')).toBe(0); // nothing was written
      // The envelope boundary itself works
      const ok = await store.commit(ops.slice(0, 10));
      expect(ok.ok).toBe(true);
      expect(await store.maxRevision('recipes')).toBe(committed(ok));
    });

    it('keeps revisions strictly increasing across commits, markers included', async () => {
      const store = create();
      const a = await store.commit([{ name: 'recipes', id: 'r1', doc: { name_fr: 'A' } }]);
      const b = await store.remove('recipes', 'r1');
      const c = await store.commit([{ name: 'recipes', id: 'r1', doc: { name_fr: 'Retour' } }]);
      expect(b).toBeGreaterThan(committed(a));
      expect(committed(c)).toBeGreaterThan(b);
      expect(await store.maxRevision('recipes')).toBe(committed(c)); // markers count in the maximum
    });
  });
}
