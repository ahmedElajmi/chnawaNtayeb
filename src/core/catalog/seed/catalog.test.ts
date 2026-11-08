import { describe, expect, it } from 'vitest';
import { initialRecipes } from './initialRecipes';
import { initialIngredients } from './initialIngredients';
import { MEAL_CATEGORIES } from '../types';

const ingredientIds = new Set(initialIngredients.map((i) => i.id));
const ARABIC = /[؀-ۿ]/;
const CUISINES = ['traditionnelle', 'rapide', 'economique', 'vegetarienne', 'familiale', 'internationale'];
const DIFFICULTIES = ['facile', 'moyen', 'avance'];

function duplicates(values: string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) !== i);
}

describe('built-in catalog', () => {
  it('has unique recipe ids, slugs and names', () => {
    expect(duplicates(initialRecipes.map((r) => r.id))).toEqual([]);
    expect(duplicates(initialRecipes.map((r) => r.slug))).toEqual([]);
    expect(duplicates(initialRecipes.map((r) => r.name_fr.toLowerCase()))).toEqual([]);
  });

  it('has unique ingredient ids made of safe characters (Firestore document ids)', () => {
    expect(duplicates(initialIngredients.map((i) => i.id))).toEqual([]);
    const unsafe = initialIngredients.filter((i) => !/^[a-z0-9_]+$/.test(i.id)).map((i) => i.id);
    expect(unsafe).toEqual([]);
  });

  it('only uses known ingredients, with a role and a positive quantity', () => {
    const problems: string[] = [];
    for (const r of initialRecipes) {
      if (!r.ingredients.some((i) => i.role === 'key')) problems.push(`${r.id}: no key ingredient`);
      for (const i of r.ingredients) {
        if (!ingredientIds.has(i.ingredient_id)) problems.push(`${r.id}: unknown ${i.ingredient_id}`);
        if (!i.role) problems.push(`${r.id}: no role for ${i.ingredient_id}`);
        if (!(i.quantity_base > 0)) problems.push(`${r.id}: quantity of ${i.ingredient_id}`);
        for (const s of i.substitutes ?? [])
          if (!ingredientIds.has(s)) problems.push(`${r.id}: unknown substitute ${s}`);
      }
      if (new Set(r.ingredients.map((i) => i.ingredient_id)).size !== r.ingredients.length)
        problems.push(`${r.id}: duplicate ingredient`);
    }
    expect(problems).toEqual([]);
  });

  it('uses valid course, cuisine, difficulty, times and cost', () => {
    const problems: string[] = [];
    for (const r of initialRecipes) {
      if (!MEAL_CATEGORIES.includes(r.category)) problems.push(`${r.id}: category ${r.category}`);
      if (!CUISINES.includes(r.cuisine_type)) problems.push(`${r.id}: cuisine ${r.cuisine_type}`);
      if (!DIFFICULTIES.includes(r.difficulty)) problems.push(`${r.id}: difficulty ${r.difficulty}`);
      if (r.prep_time_minutes + r.cook_time_minutes <= 0) problems.push(`${r.id}: no time`);
      if (!(r.estimated_cost_tnd > 0 && r.estimated_cost_tnd <= 80))
        problems.push(`${r.id}: cost ${r.estimated_cost_tnd}`);
      if (r.base_servings < 1) problems.push(`${r.id}: servings`);
    }
    expect(problems).toEqual([]);
  });

  it('has complete texts in the 3 languages, derja in Latin letters and Arabic in Arabic', () => {
    const problems: string[] = [];
    for (const r of initialRecipes) {
      const derja = [r.name_derja, r.description_derja, r.chef_tip.derja, ...r.steps.map((s) => s.instruction_derja)];
      const arabic = [r.name_ar, r.description_ar, r.chef_tip.ar, ...r.steps.map((s) => s.instruction_ar)];
      const french = [r.name_fr, r.description_fr, r.chef_tip.fr, ...r.steps.map((s) => s.instruction_fr)];
      if ([...derja, ...arabic, ...french].some((t) => !t || !t.trim())) problems.push(`${r.id}: empty text`);
      if (derja.some((t) => ARABIC.test(t))) problems.push(`${r.id}: Arabic letters in derja`);
      if (french.some((t) => ARABIC.test(t))) problems.push(`${r.id}: Arabic letters in French`);
      if (arabic.some((t) => t && !ARABIC.test(t))) problems.push(`${r.id}: Arabic text without Arabic letters`);
      if (r.steps.length < 3) problems.push(`${r.id}: less than 3 steps`);
      r.steps.forEach((s, i) => s.step_number !== i + 1 && problems.push(`${r.id}: step numbering`));
    }
    expect(problems).toEqual([]);
  });

  it('offers enough choice for the weekly menu', () => {
    const count = (c: string) => initialRecipes.filter((r) => r.category === c).length;
    expect(count('plat_principal')).toBeGreaterThanOrEqual(14);
    expect(count('entree')).toBeGreaterThanOrEqual(10);
    expect(count('dessert')).toBeGreaterThanOrEqual(4);
  });
});
