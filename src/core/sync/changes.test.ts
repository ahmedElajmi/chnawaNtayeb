import { describe, expect, it } from 'vitest';
import { applyChanges, latestRevision, withoutDeleted, type Versioned } from './changes';

interface Item extends Versioned {
  name: string;
}
const a: Item = { id: 'a', name: 'A', revision: 1 };
const b: Item = { id: 'b', name: 'B', revision: 2 };
const c: Item = { id: 'c', name: 'C' };

describe('latestRevision', () => {
  it('is the newest revision, 0 or the given floor when none', () => {
    expect(latestRevision([a, b, c])).toBe(2);
    expect(latestRevision([c])).toBe(0);
    expect(latestRevision([a], 5)).toBe(5);
  });
});

describe('applyChanges', () => {
  it('replaces in place, appends new items and keeps the order of the others', () => {
    const next = applyChanges([a, b, c], {
      items: [
        { ...b, name: 'B2' },
        { id: 'd', name: 'D' },
      ],
      removedIds: [],
    });
    expect(next.map((i) => i.name)).toEqual(['A', 'B2', 'C', 'D']);
  });

  it('drops deletion markers and removed ids', () => {
    const next = applyChanges([a, b, c], { items: [{ id: 'a', name: '', deleted: true }], removedIds: ['c'] });
    expect(next).toEqual([b]);
  });

  it('ignores a marker for an unknown item and does not modify the input', () => {
    const list = [a];
    const next = applyChanges(list, { items: [{ id: 'z', name: '', deleted: true }], removedIds: [] });
    expect(next).toEqual([a]);
    expect(list).toEqual([a]);
  });

  it('returns the same list when nothing changed', () => {
    const list = [a, b];
    expect(applyChanges(list, { items: [], removedIds: [] })).toBe(list);
  });

  it('stays fast on a large catalog', () => {
    const big: Item[] = Array.from({ length: 20000 }, (_, i) => ({ id: `r${i}`, name: `R${i}`, revision: i }));
    const start = performance.now();
    const next = applyChanges(big, { items: [{ id: 'r5', name: 'x', revision: 99999 }], removedIds: ['r6'] });
    expect(performance.now() - start).toBeLessThan(100);
    expect(next).toHaveLength(19999);
  });
});

describe('withoutDeleted', () => {
  it('leaves deletion markers out', () => {
    expect(withoutDeleted([a, { id: 'x', name: '', deleted: true }])).toEqual([a]);
  });
});
