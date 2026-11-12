import { describe, expect, it, vi } from 'vitest';
import { initialIngredients, initialRecipes, type Ingredient, type Recipe } from '@/core/catalog';
import { createMemorySearchEngine } from '@/infrastructure/memory/memorySearchEngine';
import type { SearchEngine } from '../ports';
import { CatalogSearch, type CatalogSource } from './CatalogSearch';

function fakeCatalog(recipes: Recipe[], ingredients: Ingredient[]) {
  let state = { recipes, ingredients };
  const listeners = new Set<() => void>();
  const source: CatalogSource = {
    getState: () => state,
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
  const set = (patch: Partial<typeof state>) => {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  };
  return { source, set };
}

const recipe = (id: string, name: string, ingredientIds: string[] = []): Recipe => ({
  ...initialRecipes[0],
  id,
  name_fr: name,
  name_derja: '',
  name_ar: '',
  description_fr: '',
  description_derja: '',
  description_ar: '',
  ingredients: ingredientIds.map((ingredient_id) => ({ ingredient_id, quantity_base: 1, unit: 'g' })),
});
const ingredient = (id: string, name: string): Ingredient => ({
  ...initialIngredients[0],
  id,
  name_fr: name,
  name_derja: '',
  name_ar: '',
});

function setup(
  recipes: Recipe[],
  ingredients: Ingredient[],
  engines?: Partial<Record<'recipes' | 'ingredients', SearchEngine>>
) {
  const catalog = fakeCatalog(recipes, ingredients);
  const search = new CatalogSearch(catalog.source, {
    recipes: engines?.recipes ?? createMemorySearchEngine(),
    ingredients: engines?.ingredients ?? createMemorySearchEngine(),
  });
  const ids = async (kind: 'recipes' | 'ingredients', q: string) => [...((await search.search(kind, q))?.keys() ?? [])];
  return { search, catalog, ids };
}

describe('CatalogSearch', () => {
  it('finds recipes by name and by the name of their ingredients', async () => {
    const { ids } = setup([recipe('r1', 'Ojja', ['i1']), recipe('r2', 'Brik')], [ingredient('i1', 'Merguez')]);
    expect(await ids('recipes', 'ojja')).toEqual(['r1']);
    expect(await ids('recipes', 'merguez')).toEqual(['r1']);
    expect(await ids('ingredients', 'merg')).toEqual(['i1']);
  });

  it('gives null for an empty query (the screens keep their full list)', async () => {
    const { search } = setup([recipe('r1', 'Ojja')], []);
    expect(await search.search('recipes', '  ')).toBeNull();
  });

  it('builds nothing before the first search', async () => {
    const engine = createMemorySearchEngine();
    const rebuild = vi.spyOn(engine, 'rebuild');
    setup([recipe('r1', 'Ojja')], [], { recipes: engine });
    await Promise.resolve();
    expect(rebuild).not.toHaveBeenCalled();
  });

  it('follows the catalog: a changed recipe is re-indexed alone, a removed one disappears', async () => {
    const engine = createMemorySearchEngine();
    const upsert = vi.spyOn(engine, 'upsert');
    const r1 = recipe('r1', 'Ojja');
    const r2 = recipe('r2', 'Brik');
    const { catalog, ids, search } = setup([r1, r2], [], { recipes: engine });
    expect(await ids('recipes', 'brik')).toEqual(['r2']);

    catalog.set({ recipes: [recipe('r1', 'Ojja crevettes'), r2] });
    expect(await ids('recipes', 'crevettes')).toEqual(['r1']);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0][0].map((d) => d.id)).toEqual(['r1']);

    const before = search.getState().revision;
    catalog.set({ recipes: [r2] });
    expect(await ids('recipes', 'ojja')).toEqual([]);
    expect(search.getState().revision).toBeGreaterThan(before);
  });

  it('re-indexes the recipes when an ingredient is renamed', async () => {
    const { catalog, ids } = setup([recipe('r1', 'Ojja', ['i1'])], [ingredient('i1', 'Merguez')]);
    expect(await ids('recipes', 'merguez')).toEqual(['r1']);
    catalog.set({ ingredients: [ingredient('i1', 'Saucisse')] });
    expect(await ids('recipes', 'saucisse')).toEqual(['r1']);
    expect(await ids('recipes', 'merguez')).toEqual([]);
  });

  it('answers null when the engine fails, so the screens keep their simple filtering', async () => {
    const broken: SearchEngine = {
      ...createMemorySearchEngine(),
      rebuild: () => Promise.reject(new Error('boom')),
    };
    const { search } = setup([recipe('r1', 'Ojja')], [], { recipes: broken });
    expect(await search.search('recipes', 'ojja')).toBeNull();
  });
});
