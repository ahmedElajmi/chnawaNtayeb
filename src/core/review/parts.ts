import type { Ingredient, Recipe } from '../catalog';
import { LANGUAGE_CODES, localizedField, withLocalizedField, type Language } from '../shared';
import { contentHash } from './hash';

/** Content that goes through validation, and its type. New kinds are added here. */
export interface ReviewItems {
  recipe: Recipe;
  ingredient: Ingredient;
}
export type ReviewKind = keyof ReviewItems;
export const REVIEW_KINDS: readonly ReviewKind[] = ['recipe', 'ingredient'];

/**
 * A part of an item reviewed on its own. A part with texts is split by language (one cell per
 * language or variant), so a change in one language only touches that language's cell; the other
 * parts are common to every language (one cell).
 */
export interface ReviewPart<T> {
  id: string;
  perLanguage: boolean;
  /** What the cell covers (fingerprinted): only this language's texts for a per-language part */
  read: (item: T, language: Language) => unknown;
  /**
   * Copy of `target` where this cell's content is taken from `source` (the version online), or
   * removed when there is none: used to publish an item without one of its unvalidated cells.
   */
  copy: (target: T, source: T | null, language: Language) => T;
}

/** A cell of the validation grid: a part, and its language for a per-language part. */
export interface ReviewCell {
  id: string;
  part: string;
  language?: Language;
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** Copies the `<field>_<language>` texts of one language from `source` (empty when there is none). */
function copyLocalized<T extends object>(target: T, source: T | null, fields: string[], language: Language): T {
  let next = target;
  for (const field of fields) {
    const own = localizedField(next, field);
    own[language] = source ? (localizedField(source, field)[language] ?? '') : '';
    next = withLocalizedField(next, field, own);
  }
  return next;
}

/** Instructions written in one language, in step order (empty ones left out: adding a step changes nothing). */
const stepTexts = (recipe: Recipe, language: Language) =>
  [...recipe.steps]
    .sort((a, b) => a.step_number - b.step_number)
    .map((s) => text((s as unknown as Record<string, unknown>)[`instruction_${language}`]))
    .filter(Boolean);

const RECIPE_PARTS: readonly ReviewPart<Recipe>[] = [
  {
    id: 'identity',
    perLanguage: true,
    read: (r, lang) => ({
      name: localizedField(r, 'name')[lang]?.trim() ?? '',
      description: localizedField(r, 'description')[lang]?.trim() ?? '',
    }),
    copy: (target, source, lang) => copyLocalized(target, source, ['name', 'description'], lang),
  },
  {
    id: 'media',
    perLanguage: false,
    read: (r) => ({ image: text(r.image_url), video: text(r.video_url) }),
    copy: (target, source) => {
      if (!source) return target;
      const { video_url: _video, ...rest } = target;
      return { ...rest, image_url: source.image_url, ...(source.video_url ? { video_url: source.video_url } : {}) };
    },
  },
  {
    id: 'details',
    perLanguage: false,
    read: (r) => ({
      prep: r.prep_time_minutes,
      cook: r.cook_time_minutes,
      servings: r.base_servings,
      cost: r.estimated_cost_tnd,
      category: r.category,
      cuisine: r.cuisine_type,
      difficulty: r.difficulty,
      healthy: Boolean(r.is_healthy),
      ingredients: r.ingredients,
    }),
    copy: (target, source) =>
      source
        ? {
            ...target,
            prep_time_minutes: source.prep_time_minutes,
            cook_time_minutes: source.cook_time_minutes,
            base_servings: source.base_servings,
            estimated_cost_tnd: source.estimated_cost_tnd,
            category: source.category,
            cuisine_type: source.cuisine_type,
            difficulty: source.difficulty,
            is_healthy: Boolean(source.is_healthy),
            ingredients: source.ingredients,
          }
        : target,
  },
  {
    id: 'steps',
    perLanguage: true,
    read: (r, lang) => stepTexts(r, lang),
    copy: (target, source, lang) => ({
      ...target,
      steps: target.steps.map((step) => {
        const online = source?.steps.find((s) => s.step_number === step.step_number);
        return copyLocalized(step, online ?? null, ['instruction'], lang);
      }),
    }),
  },
  {
    id: 'tip',
    perLanguage: true,
    read: (r, lang) => text(r.chef_tip?.[lang]),
    copy: (target, source, lang) => {
      const tip = { ...target.chef_tip };
      const value = source?.chef_tip?.[lang] ?? '';
      if (value || lang === 'fr' || lang === 'derja' || lang === 'ar') tip[lang] = value;
      else delete tip[lang];
      return { ...target, chef_tip: tip };
    },
  },
];

const INGREDIENT_PARTS: readonly ReviewPart<Ingredient>[] = [
  {
    id: 'identity',
    perLanguage: true,
    read: (i, lang) => localizedField(i, 'name')[lang]?.trim() ?? '',
    copy: (target, source, lang) => copyLocalized(target, source, ['name'], lang),
  },
  {
    id: 'details',
    perLanguage: false,
    read: (i) => ({ category: i.category, unit: text(i.unit_default), icon: text(i.icon) }),
    copy: (target, source) =>
      source ? { ...target, category: source.category, unit_default: source.unit_default, icon: source.icon } : target,
  },
  {
    id: 'price',
    perLanguage: false,
    read: (i) => ({ min: i.price_min_tnd, max: i.price_max_tnd }),
    copy: (target, source) =>
      source ? { ...target, price_min_tnd: source.price_min_tnd, price_max_tnd: source.price_max_tnd } : target,
  },
  {
    id: 'media',
    perLanguage: false,
    read: (i) => text(i.image_url),
    copy: (target, source) => {
      if (!source) return target;
      const { image_url: _image, ...rest } = target;
      return source.image_url ? { ...rest, image_url: source.image_url } : rest;
    },
  },
];

const PARTS: { [K in ReviewKind]: readonly ReviewPart<ReviewItems[K]>[] } = {
  recipe: RECIPE_PARTS,
  ingredient: INGREDIENT_PARTS,
};

export function reviewParts<K extends ReviewKind>(kind: K): readonly ReviewPart<ReviewItems[K]>[] {
  return PARTS[kind];
}

/** Id of a cell: `steps:derja` for a per-language part, `media` for a common one. */
export function cellId(part: string, language?: Language): string {
  return language ? `${part}:${language}` : part;
}

/** Reads a cell id back (null when it names no cell of this kind). */
export function parseCellId(kind: ReviewKind, id: string): ReviewCell | null {
  const [partId, language, ...rest] = id.split(':');
  if (rest.length) return null;
  const part = PARTS[kind].find((p) => p.id === partId);
  if (!part) return null;
  if (!part.perLanguage) return language === undefined ? { id, part: part.id } : null;
  const lang = LANGUAGE_CODES.find((l) => l === language);
  return lang ? { id, part: part.id, language: lang } : null;
}

/** Every cell of the grid of a kind: parts × languages (taken from LANGUAGES), in part order. */
export function reviewCells(kind: ReviewKind): ReviewCell[] {
  return PARTS[kind].flatMap((part) =>
    part.perLanguage
      ? LANGUAGE_CODES.map((language) => ({ id: cellId(part.id, language), part: part.id, language }))
      : [{ id: part.id, part: part.id }]
  );
}

function partOf<K extends ReviewKind>(kind: K, cell: ReviewCell): ReviewPart<ReviewItems[K]> {
  const part = PARTS[kind].find((p) => p.id === cell.part);
  if (!part) throw new Error(`Unknown review part ${kind}.${cell.part}`);
  return part as ReviewPart<ReviewItems[K]>;
}

/** Fingerprint of one cell of an item. */
export function cellHash<K extends ReviewKind>(kind: K, item: ReviewItems[K], cell: ReviewCell): string {
  return contentHash(partOf(kind, cell).read(item, cell.language ?? 'fr'));
}

/** Fingerprints of every cell of an item (computed once, when it is saved). */
export function cellHashes<K extends ReviewKind>(kind: K, item: ReviewItems[K]): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const cell of reviewCells(kind)) hashes[cell.id] = cellHash(kind, item, cell);
  return hashes;
}

/** Copy of `target` with one cell taken from `source` (see ReviewPart.copy). */
export function copyCell<K extends ReviewKind>(
  kind: K,
  target: ReviewItems[K],
  source: ReviewItems[K] | null,
  cell: ReviewCell
): ReviewItems[K] {
  return partOf(kind, cell).copy(target, source, cell.language ?? 'fr');
}
