import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes } from '../catalog';
import { activeEnvelope, presenceEntryId, tombstoneEnvelope } from '../kitchen';
import { createBackup, BACKUP_IMPORT_MAX_CHARS, backupImportWithinBound, parseBackup } from './backup';

const recipe = initialRecipes[0];

describe('parseBackup', () => {
  it('refuses what is not a backup', () => {
    expect(parseBackup(null)).toBeNull();
    expect(parseBackup({ hello: 'world' })).toBeNull();
  });

  it('keeps every language, photo and price range through an export / import round trip', () => {
    const edited = {
      ...recipe,
      name_derja: 'Ojja derja',
      name_ar: 'عجة',
      name_derja_ar: 'عجّة بالمرقاز',
      description_derja_ar: 'ماكلة فيسع',
      steps: [
        {
          step_number: 1,
          instruction_fr: 'Cuire.',
          instruction_derja: 'Tayyeb.',
          instruction_ar: 'اطبخ.',
          instruction_derja_ar: 'طيّب.',
        },
      ],
      chef_tip: { fr: 'Astuce', derja: 'Nasi7a', ar: 'نصيحة', derja_ar: 'نصيحة الشاف' },
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      category_ids: ['ramadan', 'rapide'],
    };
    const ingredient = {
      ...initialIngredients[0],
      category: 'volaille',
      name_derja_ar: 'طماطم',
      price_min_tnd: 2,
      price_max_tnd: 3,
      image_url: 'https://a.b/c.jpg',
    };
    const file = JSON.parse(
      JSON.stringify({
        recipes: [edited],
        ingredients: [ingredient],
        favorites: [recipe.id],
        grocery_list: [
          { id: 'g1', name: 'Tomate', quantity: 1, unit: 'kg', category: 'vegetables', is_checked: false },
        ],
      })
    );
    expect(parseBackup(file)).toEqual({
      recipes: [edited],
      ingredients: [ingredient],
      favorites: [recipe.id],
      groceryList: [{ id: 'g1', name: 'Tomate', quantity: 1, unit: 'kg', category: 'vegetables', is_checked: false }],
      skipped: 0,
    });
  });

  it('brings old entries up to date and skips broken ones', () => {
    const { price_min_tnd: _min, price_max_tnd: _max, ...oldIngredient } = initialIngredients[0];
    const parsed = parseBackup({
      recipes: [recipe, { id: 'broken' }],
      ingredients: [{ ...oldIngredient, default_price_tnd: 2.5 }, { id: 'x' }],
      favorites: ['a', 3],
      grocery_list: [{ name: 'no id' }],
    });
    expect(parsed?.recipes).toHaveLength(1);
    // Old single price within the built-in market range: the range is used
    expect(parsed?.ingredients?.[0]).toMatchObject({
      price_min_tnd: initialIngredients[0].price_min_tnd,
      price_max_tnd: initialIngredients[0].price_max_tnd,
    });
    expect(parsed?.ingredients).toHaveLength(1);
    expect(parsed?.favorites).toEqual(['a']);
    expect(parsed?.groceryList).toEqual([]);
    expect(parsed?.skipped).toBe(4);
  });
});

describe('createBackup', () => {
  it('writes complete objects that parseBackup reads back, without sync revisions', () => {
    const recipes = [{ ...recipe, revision: 123 }];
    const ingredients = [{ ...initialIngredients[0], revision: 456 }];
    const file = createBackup(
      { recipes, ingredients, weeklyPlan: [], favorites: [recipe.id], groceryList: [] },
      '2026-11-12T10:00:00.000Z'
    );
    expect(file.exported_at).toBe('2026-11-12T10:00:00.000Z');
    expect(JSON.stringify(file)).not.toContain('revision');
    const back = parseBackup(JSON.parse(JSON.stringify(file)));
    expect(back?.recipes).toEqual([recipe]);
    expect(back?.ingredients).toEqual([initialIngredients[0]]);
    expect(back?.favorites).toEqual([recipe.id]);
  });

  it('keeps the full stock envelopes through an export / import round trip (lot F1 § 13-B)', () => {
    const key = presenceEntryId('fridge', 'tomate');
    const tombKey = presenceEntryId('pantry', 'sel');
    const stock = {
      [key]: activeEnvelope(
        {
          id: key,
          ingredient_id: 'tomate',
          location: 'fridge',
          origin: 'manual' as const,
          added_at: '2026-01-01T10:00:00Z',
          quantity: 2,
          unit: 'g',
          note: 'paquet ouvert',
        },
        { physical: 500, counter: 0, device: 'devA' }
      ),
      [tombKey]: tombstoneEnvelope(
        { id: tombKey, ingredient_id: 'sel', location: 'pantry' },
        { physical: 600, counter: 0, device: 'devB' }
      ),
    };
    const file = createBackup(
      { recipes: [recipe], ingredients: [], weeklyPlan: [], favorites: [], groceryList: [], stock },
      '2026-11-19T10:00:00.000Z'
    );
    const back = parseBackup(JSON.parse(JSON.stringify(file)));
    expect(back?.stock).toEqual(stock); // quantity, note and tombstone kept as they are
  });

  it('reads old backups (no stock section) unchanged and skips a malformed stock', () => {
    const old = createBackup(
      { recipes: [recipe], ingredients: [], weeklyPlan: [], favorites: [], groceryList: [] },
      '2026-11-12T10:00:00.000Z'
    );
    expect(parseBackup(JSON.parse(JSON.stringify(old)))?.stock).toBeUndefined();
    const broken = JSON.parse(JSON.stringify(old));
    broken.stock = 'not an object';
    const parsed = parseBackup(broken);
    expect(parsed?.stock).toBeUndefined();
    expect(parsed?.skipped).toBe(1);
  });
});

describe('backup restore integrity (lot F1 A4 — chef decision AR-1, option α) and import guard', () => {
  it('restores a stock over the caps WHOLE: no partial restore, every envelope kept', () => {
    const stock: Record<string, unknown> = {};
    for (let i = 0; i < 301; i++) {
      stock[`st_fridge_i${i}`] = {
        state: 'active',
        version: { physical: 1_000 + i, counter: 0, device: 'a' },
        entry: {
          id: `st_fridge_i${i}`,
          ingredient_id: `i${i}`,
          location: 'fridge',
          origin: 'manual',
          added_at: '2026-01-01T10:00:00Z',
          quantity: 1,
          unit: 'g',
        },
      };
    }
    const parsed = parseBackup({
      recipes: [],
      ingredients: [],
      weekly_plan: [],
      favorites: [],
      grocery_list: [],
      stock,
    });
    expect(parsed?.stock).toBeDefined();
    expect(Object.keys(parsed!.stock!)).toHaveLength(301); // 300 = cap + 1 over: nothing dropped
  });

  it('refuses an absurdly large backup BEFORE any parse (explicit guard-rail, AR-1)', () => {
    expect(backupImportWithinBound('x'.repeat(BACKUP_IMPORT_MAX_CHARS))).toBe(true);
    expect(backupImportWithinBound('x'.repeat(BACKUP_IMPORT_MAX_CHARS + 1))).toBe(false);
  });

  it('counts UTF-16 code units (logical length), NOT UTF-8 bytes (documented semantics)', () => {
    // An astral character costs 2 UTF-16 units but 4 UTF-8 bytes: a string of
    // BACKUP_IMPORT_MAX_CHARS units of it is accepted (64 MiB only in a theoretical
    // two-bytes-per-unit UTF-16 representation — an engine may store it more compactly)
    // while its UTF-8 file size would be ~128 MiB — the guard bounds the logical length,
    // not the real memory footprint nor the file size.
    const astral = '\u{1D11E}'.repeat(BACKUP_IMPORT_MAX_CHARS / 2);
    expect(astral.length).toBe(BACKUP_IMPORT_MAX_CHARS); // 2 units per character
    expect(new TextEncoder().encode(astral).length).toBeGreaterThan(BACKUP_IMPORT_MAX_CHARS);
    expect(backupImportWithinBound(astral)).toBe(true);
  });
});
