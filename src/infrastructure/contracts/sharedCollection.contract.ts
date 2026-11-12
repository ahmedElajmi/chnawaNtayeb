import { describe, expect, it } from 'vitest';
import type { RemoteChanges, SharedCollectionSource, SharedCollectionWriter } from '@/application';
import type { Versioned } from '@/core/sync';

interface Item extends Versioned {
  name: string;
  note?: string;
}

/**
 * Behaviour every shared collection adapter (source + writer) must have, whatever the database.
 * A new adapter runs this suite in its own test file:
 *   describeSharedCollection('my database', () => createMyAdapter());
 */
export function describeSharedCollection(
  name: string,
  create: () => { source: SharedCollectionSource; writer: SharedCollectionWriter<Item> }
) {
  const collect = (source: SharedCollectionSource, since: number | null) => {
    const received: RemoteChanges[] = [];
    const stop = source.follow(
      since,
      (c) => received.push(c),
      () => {}
    );
    return { received, stop, items: () => received.flatMap((c) => c.items as Item[]) };
  };

  describe(`SharedCollection contract: ${name}`, () => {
    it('is empty at first, then gives the whole collection to a full read', async () => {
      const { source, writer } = create();
      expect(await writer.isEmpty()).toBe(true);
      await writer.putAll([
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ]);
      expect(await writer.isEmpty()).toBe(false);
      const { received, stop } = collect(source, null);
      expect(received[0].complete).toBe(true);
      expect((received[0].items as Item[]).map((i) => i.name).sort()).toEqual(['A', 'B']);
      stop();
    });

    it('sets an increasing revision on every write and drops undefined fields', async () => {
      const { source, writer } = create();
      await writer.put({ id: 'a', name: 'A', note: undefined });
      await writer.put({ id: 'b', name: 'B' });
      const { items, stop } = collect(source, null);
      const [a, b] = items().sort((x, y) => x.id.localeCompare(y.id));
      expect(a.revision).toBeTypeOf('number');
      expect(b.revision!).toBeGreaterThan(a.revision!);
      expect('note' in a).toBe(false);
      stop();
    });

    it('sends only what changed since a revision, then every later change live', async () => {
      const { source, writer } = create();
      await writer.put({ id: 'a', name: 'A' });
      const first = collect(source, null);
      const since = first.items()[0].revision!;
      first.stop();
      await writer.put({ id: 'b', name: 'B' });

      const delta = collect(source, since + 1);
      expect(delta.items().map((i) => i.id)).toEqual(['b']);
      expect(delta.received.every((c) => !c.complete)).toBe(true);

      await writer.put({ id: 'a', name: 'A2' });
      expect(delta.items().some((i) => i.id === 'a' && i.name === 'A2')).toBe(true);
      delta.stop();
      await writer.put({ id: 'c', name: 'C' });
      expect(delta.items().some((i) => i.id === 'c')).toBe(false);
    });

    it('publishes a removal as a deletion marker', async () => {
      const { source, writer } = create();
      await writer.put({ id: 'a', name: 'A' });
      const live = collect(source, null);
      await writer.remove('a');
      expect(live.items().some((i) => i.id === 'a' && i.deleted === true)).toBe(true);
      live.stop();
    });

    it('replaceAll removes what is not in the new list', async () => {
      const { source, writer } = create();
      await writer.putAll([
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ]);
      expect(await writer.replaceAll([{ id: 'b', name: 'B2' }])).toMatchObject({ ok: true, removed: 1 });
      const { items, stop } = collect(source, null);
      expect(items().filter((i) => !i.deleted)).toMatchObject([{ id: 'b', name: 'B2' }]);
      stop();
    });
  });
}
