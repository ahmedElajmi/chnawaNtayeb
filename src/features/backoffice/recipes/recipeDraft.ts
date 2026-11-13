import { LANGUAGE_CODES, localizedField, REFERENCE_LANGUAGE, type Language } from '@/core/shared';
import { getRole, validateRecipe, type CheckedField, type Ingredient, type Recipe } from '@/core/catalog';
import { normalizeYouTubeUrl, parseYouTubeId, slugify } from '@/core/shared';

/** Starting point of a new recipe in the editor. */
export function newRecipeDraft(now = Date.now()): Recipe {
  return {
    id: `custom_rec_${now}`,
    slug: '',
    name_fr: '',
    name_derja: '',
    name_ar: '',
    description_fr: '',
    description_derja: '',
    description_ar: '',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    prep_time_minutes: 15,
    cook_time_minutes: 20,
    base_servings: 4,
    estimated_cost_tnd: 10.0,
    category: 'plat_principal',
    is_healthy: false,
    cuisine_type: 'familiale',
    difficulty: 'facile',
    ingredients: [
      { ingredient_id: 'ing_tomate', quantity_base: 2, unit: 'pièces', role: 'key' },
      { ingredient_id: 'ing_oignon', quantity_base: 1, unit: 'pièce', role: 'secondary' },
      { ingredient_id: 'ing_huile_olive', quantity_base: 3, unit: 'c.à.s', role: 'staple' },
    ],
    steps: [{ step_number: 1, instruction_fr: '', instruction_derja: '', instruction_ar: '' }],
    chef_tip: { fr: '', derja: '', ar: '' },
    // Online only once validated and published (validation workflow)
    is_published: false,
  };
}

/** Readable address (/recette/<slug>) that no other recipe uses. */
export function uniqueSlug(name: string, recipeId: string, existing: Pick<Recipe, 'id' | 'slug'>[]): string {
  const base = slugify(name) || 'recette';
  const taken = (slug: string) => existing.some((r) => r.slug === slug && r.id !== recipeId);
  let slug = base;
  for (let k = 2; taken(slug); k++) slug = `${base}-${k}`;
  return slug;
}

export type RecipeDraftCheck = { ok: true; recipe: Recipe } | { ok: false; error: string; field?: CheckedField };

/**
 * Validates the editor content and returns the recipe to save:
 * recipe rules of the domain (validateRecipe: name, ingredients, steps numbered 1..n),
 * video empty or a valid YouTube link (stored in a clean form),
 * and an address generated for new recipes.
 */
export function finalizeRecipeDraft(input: Recipe, existing: Pick<Recipe, 'id' | 'slug'>[]): RecipeDraftCheck {
  const checked = validateRecipe(input);
  if (!checked.ok) return checked;
  const draft = checked.value;
  const rawVideo = draft.video_url?.trim() ?? '';
  if (rawVideo && !parseYouTubeId(rawVideo)) {
    return {
      ok: false,
      field: 'video',
      error: 'Le lien vidéo doit être un lien YouTube valide (ou laissez le champ vide).',
    };
  }
  const slug =
    !draft.slug || /^recette-\d+$/.test(draft.slug) ? uniqueSlug(draft.name_fr, draft.id, existing) : draft.slug;
  const { video_url: _ignored, ...withoutVideo } = draft;
  const video_url = normalizeYouTubeUrl(rawVideo);
  return { ok: true, recipe: video_url ? { ...withoutVideo, slug, video_url } : { ...withoutVideo, slug } };
}

/** True when the editor content differs from what was opened (something to save or to lose). */
export function isDraftChanged(initial: Recipe, current: Recipe): boolean {
  return JSON.stringify(initial) !== JSON.stringify(current);
}

/** Copy of a recipe to start a new one from it: new id and address, unpublished, "(copie)" in the name. */
export function duplicateRecipeDraft(recipe: Recipe, now = Date.now()): Recipe {
  const copy: Recipe = JSON.parse(JSON.stringify(recipe));
  return {
    ...copy,
    id: `custom_rec_${now}`,
    slug: '',
    name_fr: `${recipe.name_fr} (copie)`,
    is_published: false,
  };
}

export type TranslationLanguage = Exclude<Language, 'fr'>;

/**
 * Texts written in French but still empty in another language or variant (name, description,
 * steps, chef tip): what the chef has left to translate in each one.
 */
export function missingTranslations(recipe: Recipe): Record<TranslationLanguage, number> {
  const texts = [
    localizedField(recipe, 'name'),
    localizedField(recipe, 'description'),
    ...recipe.steps.map((s) => localizedField(s, 'instruction')),
    recipe.chef_tip ?? { fr: '', derja: '', ar: '' },
  ].filter((t) => t.fr?.trim());
  const result = {} as Record<TranslationLanguage, number>;
  for (const lang of LANGUAGE_CODES) {
    if (lang === REFERENCE_LANGUAGE) continue;
    result[lang as TranslationLanguage] = texts.filter((t) => !t[lang]?.trim()).length;
  }
  return result;
}

export type SectionId = 'infos' | 'media' | 'ingredients' | 'steps' | 'tip';
/** done: complete; todo: required and missing; warn: saved fine but worth a look; optional: nothing yet */
export type SectionStatus = 'done' | 'todo' | 'warn' | 'optional';

/** Where each part of the recipe form stands, shown next to the section shortcuts. */
export function recipeSectionStatus(recipe: Recipe, catalog: Ingredient[]): Record<SectionId, SectionStatus> {
  const required = recipe.ingredients.filter((i) => !i.is_optional);
  const hasKey = required.some((i) => getRole(i, catalog) === 'key');
  const writtenSteps = recipe.steps.filter((s) => s.instruction_fr.trim());
  return {
    infos: recipe.name_fr.trim() ? 'done' : 'todo',
    media: recipe.image_url?.trim() || recipe.video_url?.trim() ? 'done' : 'optional',
    ingredients: recipe.ingredients.length === 0 ? 'todo' : hasKey ? 'done' : 'warn',
    steps: writtenSteps.length === 0 ? 'todo' : writtenSteps.length < recipe.steps.length ? 'warn' : 'done',
    tip: recipe.chef_tip?.fr?.trim() ? 'done' : 'optional',
  };
}
