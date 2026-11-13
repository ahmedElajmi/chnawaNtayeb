import { getRole, INGREDIENT_CATEGORIES, parseImageUrl, type Ingredient, type Recipe } from '../catalog';
import { localizedField, parseYouTubeId, type Language } from '../shared';
import type { ReviewCell, ReviewItems, ReviewKind } from './parts';

/** How much a check matters: blocks the cell, only advises, or is switched off (set per workflow). */
export type RuleLevel = 'blocking' | 'advice' | 'off';
export const RULE_LEVELS: readonly RuleLevel[] = ['blocking', 'advice', 'off'];

/** What the checks may look at besides the item itself. */
export interface ReviewContext {
  ingredients: readonly Ingredient[];
  /** Ingredients online (validated): a recipe can only be published with those */
  publishedIngredientIds?: ReadonlySet<string>;
}

/** One quality check, attached to a part (and run on each language cell of a per-language part). */
export interface ReviewRule<T> {
  id: string;
  part: string;
  /** Level when the workflow does not set one */
  level: RuleLevel;
  check: (item: T, ctx: ReviewContext, language: Language) => boolean;
}

const filled = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const stepCount = (r: Recipe, lang: Language) =>
  r.steps.filter((s) => filled((s as unknown as Record<string, unknown>)[`instruction_${lang}`])).length;

const RECIPE_RULES: readonly ReviewRule<Recipe>[] = [
  { id: 'recipe.name', part: 'identity', level: 'blocking', check: (r, _c, l) => filled(localizedField(r, 'name')[l]) },
  {
    id: 'recipe.description',
    part: 'identity',
    level: 'blocking',
    check: (r, _c, l) => filled(localizedField(r, 'description')[l]),
  },
  {
    id: 'recipe.photo',
    part: 'media',
    level: 'blocking',
    check: (r) => typeof parseImageUrl(r.image_url) === 'string',
  },
  {
    id: 'recipe.video',
    part: 'media',
    level: 'advice',
    check: (r) => !!parseYouTubeId(r.video_url),
  },
  { id: 'recipe.ingredients', part: 'details', level: 'blocking', check: (r) => r.ingredients.length > 0 },
  {
    id: 'recipe.key-ingredient',
    part: 'details',
    level: 'blocking',
    check: (r, c) => r.ingredients.some((i) => !i.is_optional && getRole(i, [...c.ingredients]) === 'key'),
  },
  {
    id: 'recipe.known-ingredients',
    part: 'details',
    level: 'blocking',
    check: (r, c) => r.ingredients.every((i) => c.ingredients.some((x) => x.id === i.ingredient_id)),
  },
  {
    id: 'recipe.published-ingredients',
    part: 'details',
    level: 'blocking',
    check: (r, c) =>
      !c.publishedIngredientIds || r.ingredients.every((i) => c.publishedIngredientIds!.has(i.ingredient_id)),
  },
  {
    id: 'recipe.times',
    part: 'details',
    level: 'blocking',
    check: (r) => r.prep_time_minutes + r.cook_time_minutes > 0 && r.base_servings > 0,
  },
  {
    // French: at least one step; another language: every French step translated
    id: 'recipe.steps',
    part: 'steps',
    level: 'blocking',
    check: (r, _c, l) => (l === 'fr' ? stepCount(r, 'fr') > 0 : stepCount(r, l) >= stepCount(r, 'fr')),
  },
  {
    id: 'recipe.tip',
    part: 'tip',
    level: 'advice',
    check: (r, _c, l) => filled(r.chef_tip?.[l]) || (l !== 'fr' && !filled(r.chef_tip?.fr)),
  },
];

const INGREDIENT_RULES: readonly ReviewRule<Ingredient>[] = [
  {
    id: 'ingredient.name',
    part: 'identity',
    level: 'blocking',
    check: (i, _c, l) => filled(localizedField(i, 'name')[l]),
  },
  {
    id: 'ingredient.category',
    part: 'details',
    level: 'blocking',
    check: (i) => INGREDIENT_CATEGORIES.includes(i.category) && filled(i.unit_default),
  },
  {
    id: 'ingredient.price',
    part: 'price',
    level: 'blocking',
    check: (i) => i.price_min_tnd > 0 && i.price_max_tnd >= i.price_min_tnd,
  },
  {
    id: 'ingredient.photo',
    part: 'media',
    level: 'advice',
    check: (i) => typeof parseImageUrl(i.image_url) === 'string',
  },
];

const RULES: { [K in ReviewKind]: readonly ReviewRule<ReviewItems[K]>[] } = {
  recipe: RECIPE_RULES,
  ingredient: INGREDIENT_RULES,
};

export function reviewRules<K extends ReviewKind>(kind: K): readonly ReviewRule<ReviewItems[K]>[] {
  return RULES[kind];
}

export interface RuleResult {
  rule: string;
  level: Exclude<RuleLevel, 'off'>;
  passed: boolean;
}

/** Checks of one cell, at the levels set by the workflow (switched-off rules are left out). */
export function checkCell<K extends ReviewKind>(
  kind: K,
  item: ReviewItems[K],
  cell: ReviewCell,
  ctx: ReviewContext,
  levels: Readonly<Record<string, RuleLevel>> = {}
): RuleResult[] {
  const rules = RULES[kind] as readonly ReviewRule<ReviewItems[K]>[];
  return rules
    .filter((rule) => rule.part === cell.part)
    .flatMap((rule) => {
      const level = levels[rule.id] ?? rule.level;
      if (level === 'off') return [];
      return [{ rule: rule.id, level, passed: rule.check(item, ctx, cell.language ?? 'fr') }];
    });
}
