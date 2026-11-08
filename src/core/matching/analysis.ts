import type { Ingredient, IngredientRole, Recipe } from '../catalog/types';
import { getRole } from '../catalog/roles';
import { getSubstitutes } from '../catalog/substitutions';
import { normalizeCategory } from '../catalog/course';
import type { MatchingConfig } from './config';
import type { Substitution } from './types';

/** What the user has at home. */
export interface Availability {
  fridge: ReadonlySet<string>;
  pantry: ReadonlySet<string>;
}

export function createAvailability(fridgeIds: Iterable<string>, pantryIds: Iterable<string> = []): Availability {
  return { fridge: new Set(fridgeIds), pantry: new Set(pantryIds) };
}

const has = (a: Availability, id: string) => a.fridge.has(id) || a.pantry.has(id);

/** Status of one ingredient of a recipe. */
export interface IngredientStatus {
  ingredient_id: string;
  role: IngredientRole;
  /** The ingredient itself, a replacement, or nothing */
  status: 'available' | 'substituted' | 'missing';
  /** What is used instead (status `substituted`) */
  substitute_id?: string;
}

/** Facts about one recipe for one user, before any scoring or ranking. */
export interface RecipeFacts {
  items: IngredientStatus[];
  matched: string[];
  missingKey: string[];
  missingSecondary: string[];
  missingStaples: string[];
  substitutions: Substitution[];
  keyAvailable: number;
  keyTotal: number;
  /** Distinct fridge ingredients used by the recipe (directly or as a replacement) */
  fridgeUsed: number;
  /** Cost of buying the missing key/secondary ingredients (one purchase unit each: 1 kg, 1 pack...) */
  missingCost: number;
}

/** Looks at every non-optional ingredient of a recipe: available, replaced, or missing. */
export function analyzeAvailability(
  recipe: Recipe,
  availability: Availability,
  ingredientsById: ReadonlyMap<string, Ingredient>,
  config: Pick<MatchingConfig, 'substitutions'>
): RecipeFacts {
  const catalog = [...ingredientsById.values()];
  const course = normalizeCategory(recipe.category);
  const fridgeUsed = new Set<string>();
  const facts: RecipeFacts = {
    items: [],
    matched: [],
    missingKey: [],
    missingSecondary: [],
    missingStaples: [],
    substitutions: [],
    keyAvailable: 0,
    keyTotal: 0,
    fridgeUsed: 0,
    missingCost: 0,
  };

  for (const item of recipe.ingredients) {
    if (item.is_optional) continue;
    const role = getRole(item, catalog);
    const id = item.ingredient_id;
    if (role === 'key') facts.keyTotal++;

    const substitute = has(availability, id)
      ? undefined
      : getSubstitutes(item, { course, role }, config.substitutions).find((s) => has(availability, s));
    const usedId = has(availability, id) ? id : substitute;

    if (usedId) {
      facts.items.push(
        substitute
          ? { ingredient_id: id, role, status: 'substituted', substitute_id: substitute }
          : { ingredient_id: id, role, status: 'available' }
      );
      facts.matched.push(id);
      if (substitute) facts.substitutions.push({ ingredient_id: id, substitute_id: substitute });
      if (availability.fridge.has(usedId)) fridgeUsed.add(usedId);
      if (role === 'key') facts.keyAvailable++;
      continue;
    }

    facts.items.push({ ingredient_id: id, role, status: 'missing' });
    if (role === 'staple') {
      facts.missingStaples.push(id);
      continue;
    }
    (role === 'key' ? facts.missingKey : facts.missingSecondary).push(id);
    facts.missingCost += ingredientsById.get(id)?.default_price_tnd ?? 0;
  }

  facts.fridgeUsed = fridgeUsed.size;
  facts.missingCost = Math.round(facts.missingCost * 10) / 10;
  return facts;
}
