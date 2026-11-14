import { describe, expect, it } from 'vitest';
import { parseStoredIngredients, parseStoredRecipes, type Ingredient, type Recipe } from '@/core/catalog';
import { parseStoredUnitInfos, type UnitInfo } from '@/core/units';
import type { Versioned } from '@/core/sync';
import { createMemoryCollectionCache } from '@/infrastructure/memory/memoryCollectionCache';
import { createMemorySharedCollection } from '@/infrastructure/memory/memorySharedCollection';
import { SyncedCollectionStore } from '../sync/SyncedCollectionStore';
import { CatalogStore } from './CatalogStore';

const settle = () => new Promise((r) => setTimeout(r, 0));

const unit = (patch: Partial<UnitInfo>): UnitInfo => ({
  id: 'c-a-s',
  label: 'c.à.s',
  description_fr: 'Cuillère à soupe (environ 15 ml)',
  description_derja: 'Ma3l9a kbira',
  description_ar: '',
  ...patch,
});

function setup() {
  const sharedRecipes = createMemorySharedCollection<Recipe>();
  const sharedIngredients = createMemorySharedCollection<Ingredient>();
  const sharedUnits = createMemorySharedCollection<UnitInfo>();
  const synced = <T extends Versioned>(
    shared: ReturnType<typeof createMemorySharedCollection<T>>,
    read: (raw: readonly unknown[]) => T[]
  ) =>
    new SyncedCollectionStore<T>({
      source: shared.source,
      cache: createMemoryCollectionCache<T>(),
      read,
      builtIn: () => [],
      now: () => 1,
      fullRefreshAfterMs: 1e12,
    });
  const store = new CatalogStore(
    synced(sharedRecipes, parseStoredRecipes),
    synced(sharedIngredients, parseStoredIngredients),
    synced(sharedUnits, parseStoredUnitInfos)
  );
  store.start();
  return { store, sharedUnits };
}

describe('CatalogStore unit descriptions', () => {
  it('gives the description configured in the backoffice, with its language fallbacks', async () => {
    const { store, sharedUnits } = setup();
    expect(store.unitDescriptionOf('c.à.s', 'fr')).toBeUndefined();
    await sharedUnits.writer.put(unit({}));
    await settle();
    expect(store.unitDescriptionOf('c.à.s', 'fr')).toBe('Cuillère à soupe (environ 15 ml)');
    expect(store.unitDescriptionOf('c.à.s', 'derja')).toBe('Ma3l9a kbira');
    // Empty Arabic text falls back to French (derja is the last resort of the ar family)
    expect(store.unitDescriptionOf('c.à.s', 'ar')).toBe('Cuillère à soupe (environ 15 ml)');
  });

  it('matches the unit ignoring case, spacing and the id of the document', async () => {
    const { store, sharedUnits } = setup();
    await sharedUnits.writer.put(unit({}));
    await settle();
    expect(store.unitDescriptionOf(' C.À.S ', 'fr')).toBe('Cuillère à soupe (environ 15 ml)');
    expect(store.unitDescriptionOf('c-a-s', 'fr')).toBe('Cuillère à soupe (environ 15 ml)');
    expect(store.unitDescriptionOf('kg', 'fr')).toBeUndefined();
  });

  it('follows the shared collection live and forgets a deleted description', async () => {
    const { store, sharedUnits } = setup();
    await sharedUnits.writer.put(unit({ id: 'kg', label: 'kg', description_fr: 'Kilogramme' }));
    await settle();
    expect(store.unitDescriptionOf('kg', 'fr')).toBe('Kilogramme');
    await sharedUnits.writer.remove('kg');
    await settle();
    expect(store.unitDescriptionOf('kg', 'fr')).toBeUndefined();
  });
});
