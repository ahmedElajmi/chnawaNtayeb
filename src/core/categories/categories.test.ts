import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_INGREDIENT_CATEGORIES,
  MAX_CATEGORY_DEPTH,
  buildCategoryTree,
  categoryUsage,
  categoryWithDescendants,
  deletionBlocker,
  expandCategories,
  groupByCategory,
  parseStoredCategories,
  possibleParents,
  validateCategory,
  withBuiltInCategories,
  type ContentCategory,
} from './index';

const cat = (id: string, parent_id: string | null = null, order = 0): ContentCategory => ({
  id,
  parent_id,
  name_fr: id,
  name_derja: '',
  name_ar: '',
  order,
});

// Occasions › Ramadan › Chorba ; Régime ; (Cuisine › Sfax)
const list = [
  cat('occasions', null, 2),
  cat('ramadan', 'occasions'),
  cat('chorba', 'ramadan'),
  cat('regime', null, 1),
  cat('cuisine', null, 3),
  cat('sfax', 'cuisine'),
];
const tree = buildCategoryTree(list);

describe('category tree', () => {
  it('orders siblings and knows each depth and path', () => {
    expect(tree.roots.map((n) => n.category.id)).toEqual(['regime', 'occasions', 'cuisine']);
    expect(tree.byId.get('chorba')!.depth).toBe(3);
    expect(tree.byId.get('chorba')!.path).toEqual(['occasions', 'ramadan', 'chorba']);
    expect(tree.ordered.map((n) => n.category.id)).toEqual([
      'regime',
      'occasions',
      'ramadan',
      'chorba',
      'cuisine',
      'sfax',
    ]);
  });

  it('puts a category with an unknown parent, or in a loop, at the root', () => {
    const t = buildCategoryTree([cat('a', 'b'), cat('b', 'a'), cat('orphan', 'gone')]);
    expect(t.roots.map((n) => n.category.id).sort()).toEqual(['a', 'b', 'orphan']);
  });

  it('expands to ancestors and descendants', () => {
    expect([...expandCategories(tree, ['chorba', 'regime'])].sort()).toEqual([
      'chorba',
      'occasions',
      'ramadan',
      'regime',
    ]);
    expect([...categoryWithDescendants(tree, 'occasions')].sort()).toEqual(['chorba', 'occasions', 'ramadan']);
  });
});

describe('category usage and groups', () => {
  const items = [
    { id: 'r1', cats: ['chorba'] },
    { id: 'r2', cats: ['ramadan', 'chorba'] },
    { id: 'r3', cats: ['regime', 'sfax'] },
    { id: 'r4', cats: [] },
    { id: 'r5', cats: ['unknown'] },
  ];

  it('counts each item once per category, descendants included', () => {
    const usage = categoryUsage(
      tree,
      items.map((i) => i.cats)
    );
    expect(usage.get('occasions')).toEqual({ own: 0, total: 2 });
    expect(usage.get('ramadan')).toEqual({ own: 1, total: 2 });
    expect(usage.get('chorba')).toEqual({ own: 2, total: 2 });
    expect(usage.get('regime')).toEqual({ own: 1, total: 1 });
  });

  it('groups at a level, an item in each of its groups, the others last', () => {
    const level1 = groupByCategory(items, (i) => i.cats, tree, 1);
    expect(level1.map((g) => [g.id, g.items.map((i) => i.id)])).toEqual([
      ['regime', ['r3']],
      ['occasions', ['r1', 'r2']],
      ['cuisine', ['r3']],
      [null, ['r4', 'r5']],
    ]);
    const level2 = groupByCategory(items, (i) => i.cats, tree, 2);
    expect(level2.map((g) => g.id)).toEqual(['regime', 'ramadan', 'sfax', null]);
  });
});

describe('category checks', () => {
  it('needs a French name, unique among siblings', () => {
    expect(validateCategory({ ...cat('x'), name_fr: ' ' }, list)).toContainEqual({
      field: 'name',
      problem: 'name-required',
    });
    expect(validateCategory({ ...cat('x', 'occasions'), name_fr: 'RAMADAN' }, list)).toContainEqual({
      field: 'name',
      problem: 'name-taken',
    });
    expect(validateCategory({ ...cat('x', 'cuisine'), name_fr: 'ramadan' }, list)).toEqual([]);
  });

  it('refuses a loop, an unknown parent and a branch too deep', () => {
    expect(validateCategory(cat('occasions', 'chorba'), list)).toContainEqual({
      field: 'parent',
      problem: 'parent-loop',
    });
    expect(validateCategory(cat('x', 'nope'), list)).toContainEqual({ field: 'parent', problem: 'parent-unknown' });
    const deep = [...list, cat('d4', 'chorba')];
    expect(MAX_CATEGORY_DEPTH).toBe(4);
    expect(validateCategory(cat('d5', 'd4'), deep)).toContainEqual({ field: 'parent', problem: 'too-deep' });
    // Moving "occasions" (3 levels) under "sfax" would make 5 levels
    expect(validateCategory(cat('occasions', 'sfax'), list)).toContainEqual({ field: 'parent', problem: 'too-deep' });
    expect(possibleParents(tree, 'occasions')).toEqual(['regime', 'cuisine']);
  });

  it('only deletes an empty leaf that is not built in', () => {
    const usage = categoryUsage(tree, [['regime']]);
    expect(deletionBlocker(tree, 'occasions', usage)).toBe('has-children');
    expect(deletionBlocker(tree, 'regime', usage)).toBe('in-use');
    expect(deletionBlocker(tree, 'sfax', usage)).toBeNull();
    const ing = buildCategoryTree(BUILT_IN_INGREDIENT_CATEGORIES);
    expect(deletionBlocker(ing, 'vegetables', new Map())).toBe('built-in');
  });
});

describe('stored categories', () => {
  it('reads what is usable and keeps the built-in ones', () => {
    const read = parseStoredCategories([
      { id: 'ok', name_fr: 'Ok', parent_id: 'ok', order: 'x' },
      { id: 'Bad Id', name_fr: 'x' },
      { id: 'noname', name_fr: '' },
      { id: 'gone', name_fr: 'x', deleted: true },
      { id: 'vegetables', name_fr: 'Légumes frais', parent_id: null, order: 1 },
    ]);
    expect(read.map((c) => c.id)).toEqual(['ok', 'vegetables']);
    expect(read[0].parent_id).toBeNull();
    expect(read[0].order).toBe(0);
    const all = withBuiltInCategories(read, BUILT_IN_INGREDIENT_CATEGORIES);
    expect(all).toHaveLength(BUILT_IN_INGREDIENT_CATEGORIES.length + 1);
    expect(all.find((c) => c.id === 'vegetables')).toMatchObject({ name_fr: 'Légumes frais', built_in: true });
  });
});
