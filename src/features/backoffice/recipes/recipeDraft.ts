import { validateRecipe, type Recipe } from '@/core/catalog';
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
    is_published: true,
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

export type RecipeDraftCheck = { ok: true; recipe: Recipe } | { ok: false; error: string };

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
    return { ok: false, error: 'Le lien vidéo doit être un lien YouTube valide (ou laissez le champ vide).' };
  }
  const slug =
    !draft.slug || /^recette-\d+$/.test(draft.slug) ? uniqueSlug(draft.name_fr, draft.id, existing) : draft.slug;
  const { video_url: _ignored, ...withoutVideo } = draft;
  const video_url = normalizeYouTubeUrl(rawVideo);
  return { ok: true, recipe: video_url ? { ...withoutVideo, slug, video_url } : { ...withoutVideo, slug } };
}
