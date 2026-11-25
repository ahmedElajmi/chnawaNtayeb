/**
 * Temporary seed for the isolated verification server (lot 2.6.2): a handful of realistic
 * recipes + ingredients in a disposable SQLite file, so /recipes, /suggestions and / render
 * real cards. Nothing here touches the chef's data or port.
 */

import { createSqlStore, ensureSchema, createSqliteKnex } from '../../server/storage/sqlStore';
import { normalizeRecipe } from '../../src/core/catalog/course';
import type { Recipe, Ingredient } from '../../src/core/catalog/types';

const FILE = process.argv[2] ?? '/tmp/lot262-seed.sqlite';
const knex = createSqliteKnex(FILE);
await ensureSchema(knex);
const store = createSqlStore(knex);

const ingredients: Ingredient[] = [
  {
    id: 'tomate',
    name_fr: 'Tomate',
    name_derja: 'Tmatem',
    name_ar: 'طماطم',
    category: 'vegetables',
    unit_default: 'kg',
    price_min_tnd: 1.2,
    price_max_tnd: 2.5,
  },
  {
    id: 'pates',
    name_fr: 'Pâtes',
    name_derja: 'Ma3rouna',
    name_ar: 'معكرونة',
    category: 'grocery',
    unit_default: 'paquet',
    price_min_tnd: 1.4,
    price_max_tnd: 2.2,
  },
  {
    id: 'thon',
    name_fr: 'Thon',
    name_derja: 'Toun',
    name_ar: 'تونة',
    category: 'fish',
    unit_default: 'boîte',
    price_min_tnd: 4.5,
    price_max_tnd: 7,
  },
  {
    id: 'oeufs',
    name_fr: 'Œufs',
    name_derja: '3adham',
    name_ar: 'بيض',
    category: 'dairy_eggs',
    unit_default: 'pièce',
    price_min_tnd: 0.35,
    price_max_tnd: 0.55,
  },
  {
    id: 'harissa',
    name_fr: 'Harissa',
    name_derja: 'Harissa',
    name_ar: 'هريسة',
    category: 'spices_condiments',
    unit_default: 'tube',
    price_min_tnd: 0.8,
    price_max_tnd: 1.5,
  },
  {
    id: 'oignon',
    name_fr: 'Oignon',
    name_derja: 'Bsel',
    name_ar: 'بصل',
    category: 'vegetables',
    unit_default: 'kg',
    price_min_tnd: 0.9,
    price_max_tnd: 1.8,
  },
  {
    id: 'fromage',
    name_fr: 'Fromage',
    name_derja: 'Jben',
    name_ar: 'جبن',
    category: 'dairy_eggs',
    unit_default: 'paquet',
    price_min_tnd: 3.5,
    price_max_tnd: 6,
  },
];

const recipe = (over: Partial<Recipe> & Pick<Recipe, 'id' | 'slug' | 'name_fr'>): Recipe =>
  normalizeRecipe({
    name_derja: over.name_derja ?? '',
    name_ar: over.name_ar ?? '',
    description_fr: 'Une recette tunisienne simple et savoureuse.',
    description_derja: '',
    description_ar: '',
    image_url: '',
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    base_servings: 2,
    estimated_cost_tnd: 6,
    category: 'plat_principal',
    cuisine_type: 'traditionnelle',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'tomate', quantity_base: 0.5, unit: 'kg' },
      { ingredient_id: 'oignon', quantity_base: 1, unit: 'kg' },
    ],
    steps: [{ step_number: 1, instruction_fr: 'Couper les légumes.', instruction_derja: '', instruction_ar: '' }],
    chef_tip: undefined,
    is_published: true,
    ...over,
  } as Recipe);

const recipes: Recipe[] = [
  recipe({
    id: 'r-thon-pates',
    slug: 'thon-pates',
    name_fr: 'Pâtes au thon',
    name_derja: 'Ma3rouna b toun',
    name_ar: 'معكرونة بالتونة',
    ingredients: [
      { ingredient_id: 'pates', quantity_base: 1, unit: 'paquet' },
      { ingredient_id: 'thon', quantity_base: 1, unit: 'boîte' },
      { ingredient_id: 'tomate', quantity_base: 0.3, unit: 'kg' },
      { ingredient_id: 'harissa', quantity_base: 0.5, unit: 'tube' },
    ],
    is_healthy: false,
  }),
  recipe({
    id: 'r-omelette',
    slug: 'omelette-tunisienne',
    name_fr: 'Omelette tunisienne',
    name_derja: '3adham mchakkel',
    name_ar: 'أومليت تونسية',
    ingredients: [
      { ingredient_id: 'oeufs', quantity_base: 3, unit: 'pièce' },
      { ingredient_id: 'tomate', quantity_base: 0.4, unit: 'kg' },
      { ingredient_id: 'oignon', quantity_base: 0.5, unit: 'kg' },
      { ingredient_id: 'harissa', quantity_base: 0.3, unit: 'tube' },
    ],
    prep_time_minutes: 5,
    cook_time_minutes: 10,
  }),
  recipe({
    id: 'r-sandwich-thon',
    slug: 'sandwich-thon-fromage',
    name_fr: 'Sandwich thon-fromage',
    name_derja: 'Casse-croute toun',
    name_ar: 'سندويش تونة',
    category: 'entree',
    ingredients: [
      { ingredient_id: 'thon', quantity_base: 1, unit: 'boîte' },
      { ingredient_id: 'fromage', quantity_base: 1, unit: 'paquet' },
      { ingredient_id: 'tomate', quantity_base: 0.2, unit: 'kg' },
    ],
    prep_time_minutes: 8,
    cook_time_minutes: 0,
  }),
  recipe({
    id: 'r-pates-simple',
    slug: 'pates-tomate',
    name_fr: 'Pâtes à la tomate',
    name_derja: 'Ma3rouna b tmatem',
    name_ar: 'معكرونة بالطماطم',
    ingredients: [
      { ingredient_id: 'pates', quantity_base: 1, unit: 'paquet' },
      { ingredient_id: 'tomate', quantity_base: 0.4, unit: 'kg' },
      { ingredient_id: 'oignon', quantity_base: 0.3, unit: 'kg' },
    ],
    cuisine_type: 'economique',
  }),
];

for (const ing of ingredients) await store.put('ingredients', ing.id, ing as unknown as Record<string, unknown>);
for (const r of recipes) await store.put('recipes', r.id, r as unknown as Record<string, unknown>);

await knex.destroy();
console.log('seeded', recipes.length, 'recipes and', ingredients.length, 'ingredients in', FILE);
