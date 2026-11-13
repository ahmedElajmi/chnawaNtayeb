import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_INGREDIENT_CATEGORIES,
  categoryUsage,
  parseStoredCategories,
  type ContentCategory,
} from '@/core/categories';
import { createMemoryCollectionCache } from '@/infrastructure/memory/memoryCollectionCache';
import { createMemorySharedCollection } from '@/infrastructure/memory/memorySharedCollection';
import { SyncedCollectionStore } from '../sync/SyncedCollectionStore';
import { CategoryStore } from './CategoryStore';

const settle = () => new Promise((r) => setTimeout(r, 0));

function setup(canEdit = true) {
  const shared = createMemorySharedCollection<ContentCategory>();
  const collection = new SyncedCollectionStore<ContentCategory>({
    source: shared.source,
    cache: createMemoryCollectionCache(),
    read: parseStoredCategories,
    builtIn: () => [],
    now: () => 1,
    fullRefreshAfterMs: 1e12,
  });
  const store = new CategoryStore(collection, shared.writer, () => canEdit, BUILT_IN_INGREDIENT_CATEGORIES);
  store.start();
  return { store, shared };
}

const category = (id: string, parent_id: string | null = null): ContentCategory => ({
  id,
  parent_id,
  name_fr: id,
  name_derja: '',
  name_ar: '',
  order: 0,
});

describe('CategoryStore', () => {
  it('starts from the built-in categories and adds a sub-category', async () => {
    const { store } = setup();
    await settle();
    expect(store.getState().tree.roots).toHaveLength(BUILT_IN_INGREDIENT_CATEGORIES.length);
    expect((await store.save(category('volaille', 'meats'))).ok).toBe(true);
    expect(store.getState().tree.byId.get('volaille')!.path).toEqual(['meats', 'volaille']);
  });

  it('keeps the other built-in categories once one of them is edited', async () => {
    const { store, shared } = setup();
    await settle();
    await store.save({ ...BUILT_IN_INGREDIENT_CATEGORIES[0], name_fr: 'Légumes frais' });
    // Another device reads the database: one stored category, the others from the code
    const other = setup();
    await shared.writer.putAll([]);
    await settle();
    expect(other.store.getState().categories).toHaveLength(BUILT_IN_INGREDIENT_CATEGORIES.length);
  });

  it('refuses a loop, a deletion that would lose something, and an account without the right', async () => {
    const { store } = setup();
    await settle();
    await store.save(category('volaille', 'meats'));
    expect(await store.save({ ...BUILT_IN_INGREDIENT_CATEGORIES[2], parent_id: 'volaille' })).toMatchObject({
      ok: false,
      errors: [{ field: 'parent', problem: 'parent-loop' }],
    });
    const usage = categoryUsage(store.getState().tree, [['volaille']]);
    expect(await store.remove('meats', usage)).toMatchObject({ ok: false, blocker: 'built-in' });
    expect(await store.remove('volaille', usage)).toMatchObject({ ok: false, blocker: 'in-use' });
    expect((await store.remove('volaille', new Map())).ok).toBe(true);
    expect(store.getState().tree.byId.has('volaille')).toBe(false);
    expect(await setup(false).store.save(category('x'))).toMatchObject({ ok: false, blocker: 'denied' });
  });

  it('writes only the categories whose order changes', async () => {
    const { store } = setup();
    await settle();
    await store.reorder(['fruits', 'vegetables']);
    const order = (id: string) => store.getState().tree.byId.get(id)!.category.order;
    expect(order('fruits')).toBeLessThan(order('vegetables'));
  });
});
