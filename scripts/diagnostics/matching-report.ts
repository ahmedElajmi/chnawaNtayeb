// Diagnostic of the matching engine on the built-in catalog (run: npx tsx scripts/diagnostics/matching-report.ts)
import { initialRecipes, initialIngredients, getRole, getSubstitutes } from '../../src/core/catalog';
import { matchRecipes } from '../../src/core/matching';
import { DEFAULT_PANTRY_STAPLES } from '../../src/core/preferences';

const ing = new Map(initialIngredients.map((i) => [i.id, i]));
const name = (id: string) => ing.get(id)?.name_fr ?? `?${id}`;
const recipes = initialRecipes.filter((r) => r.is_published);

// --- Data quality
const unknown = new Set<string>();
let noRole = 0,
  noKey = 0,
  dupes = 0;
const roleCount = { key: 0, secondary: 0, staple: 0 };
for (const r of recipes) {
  const ids = r.ingredients.map((i) => i.ingredient_id);
  if (new Set(ids).size !== ids.length) dupes++;
  if (!r.ingredients.some((i) => getRole(i, initialIngredients) === 'key')) noKey++;
  for (const i of r.ingredients) {
    if (!ing.has(i.ingredient_id)) unknown.add(i.ingredient_id);
    if (!i.role) noRole++;
    roleCount[getRole(i, initialIngredients)]++;
    for (const s of getSubstitutes(i)) if (!ing.has(s)) unknown.add(s);
  }
}
console.log('recipes', recipes.length, 'ingredients', initialIngredients.length);
console.log(
  'roles',
  roleCount,
  'items without explicit role',
  noRole,
  'recipes without key',
  noKey,
  'recipes with duplicate ingredient',
  dupes
);
console.log('unknown ingredient ids', [...unknown]);
const keyCounts = recipes.map((r) => r.ingredients.filter((i) => getRole(i, initialIngredients) === 'key').length);
console.log(
  'key per recipe: max',
  Math.max(...keyCounts),
  'recipes with >=3 keys',
  keyCounts.filter((k) => k >= 3).length
);

// --- Scenarios
const fridges: Record<string, string[]> = {
  'oeufs + tomates': ['ing_oeuf', 'ing_tomate'],
  'oeufs + tomates + oignon + piment': ['ing_oeuf', 'ing_tomate', 'ing_oignon', 'ing_piment'],
  'poulet + pommes de terre + oignon': ['ing_poulet', 'ing_pomme_de_terre', 'ing_oignon'],
  'pates + thon': ['ing_pates', 'ing_thon_boite'],
  'tomate seule': ['ing_tomate'],
  'lait + sucre (dessert)': ['ing_lait', 'ing_sucre'],
};
for (const [label, fridge] of Object.entries(fridges)) {
  const missing = fridge.filter((id) => !ing.has(id));
  const res = matchRecipes(recipes, fridge, {}, { pantryIds: DEFAULT_PANTRY_STAPLES, catalog: initialIngredients });
  const show = (l: typeof res.ready) =>
    l
      .slice(0, 4)
      .map(
        (r) =>
          `${r.recipe.name_fr} (${r.score}%, frigo ${r.fridge_used}, manque ${r.missing_ingredients.map(name).join('/') || '-'})`
      );
  console.log(`\n### ${label}${missing.length ? ' [ids inconnus: ' + missing + ']' : ''}`);
  console.log(' ready', res.ready.length, show(res.ready));
  console.log(' almost', res.almost.length, show(res.almost));
  console.log(' ideas', res.ideas.length, show(res.ideas));
}

// --- Cost estimate vs recipe cost
const r0 = matchRecipes(recipes, ['ing_oeuf'], {}, { pantryIds: [], catalog: initialIngredients });
const sample = [...r0.almost, ...r0.ideas]
  .slice(0, 3)
  .map(
    (r) =>
      `${r.recipe.name_fr}: manque ${r.missing_ingredients.length} ingr. -> ${r.missing_cost.min}-${r.missing_cost.max} DT (recette entière ${r.recipe.estimated_cost_tnd} DT)`
  );
console.log('\ncost samples', sample);
