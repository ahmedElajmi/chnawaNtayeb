import { describe, expect, it } from 'vitest';
import { migrateIngredient, migrateIngredients } from './migrations';
import { initialIngredients } from './seed/initialIngredients';

const base = {
  id: 'ing_x',
  name_fr: 'X',
  name_derja: 'X',
  name_ar: 'X',
  category: 'vegetables' as const,
  unit_default: 'kg',
};

describe('migrateIngredient', () => {
  it('turns the old fixed price into a range', () => {
    const migrated = migrateIngredient({ ...base, default_price_tnd: 2.5 });
    expect(migrated).toEqual({ ...base, price_min_tnd: 2.5, price_max_tnd: 2.5 });
    expect('default_price_tnd' in migrated).toBe(false);
  });

  it('keeps a range, puts an inverted one back in order and completes a missing bound', () => {
    expect(migrateIngredient({ ...base, price_min_tnd: 1, price_max_tnd: 2 })).toMatchObject({
      price_min_tnd: 1,
      price_max_tnd: 2,
    });
    expect(migrateIngredient({ ...base, price_min_tnd: 3, price_max_tnd: 2 })).toMatchObject({
      price_min_tnd: 2,
      price_max_tnd: 3,
    });
    expect(migrateIngredient({ ...base, price_max_tnd: 4 })).toMatchObject({ price_min_tnd: 4, price_max_tnd: 4 });
    expect(migrateIngredient(base)).toMatchObject({ price_min_tnd: 0, price_max_tnd: 0 });
  });

  it('keeps a photo and drops an empty one', () => {
    expect(
      migrateIngredient({ ...base, price_min_tnd: 1, price_max_tnd: 1, image_url: ' https://a.b/c.jpg ' })
    ).toHaveProperty('image_url', 'https://a.b/c.jpg');
    expect('image_url' in migrateIngredient({ ...base, price_min_tnd: 1, price_max_tnd: 1, image_url: '' })).toBe(
      false
    );
  });

  it('leaves the built-in catalog unchanged', () => {
    expect(migrateIngredients(initialIngredients)).toEqual(initialIngredients);
  });
});
