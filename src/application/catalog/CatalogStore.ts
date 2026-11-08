import type { Ingredient, IngredientCategory, Recipe } from '@/core/catalog';
import { createId } from '@/core/shared';
import type { CatalogRepository, RemoteCatalogSource } from '../ports';
import { Store } from '../store';

export interface CatalogState {
  recipes: Recipe[];
  ingredients: Ingredient[];
  /** True once the remote catalog has been fetched (or found unavailable). */
  remoteChecked: boolean;
}

/** Recipes and ingredients: local copy first, then refreshed from the shared catalog. */
export class CatalogStore extends Store<CatalogState> {
  constructor(
    private readonly local: CatalogRepository,
    private readonly remote: RemoteCatalogSource
  ) {
    super({ recipes: local.loadRecipes(), ingredients: local.loadIngredients(), remoteChecked: false });
  }

  async syncFromRemote(): Promise<void> {
    const [recipes, ingredients] = await Promise.all([
      this.remote.fetchRecipes().catch(() => null),
      this.remote.fetchIngredients().catch(() => null),
    ]);
    this.setState((s) => ({
      recipes: recipes?.length ? recipes : s.recipes,
      ingredients: ingredients?.length ? ingredients : s.ingredients,
      remoteChecked: true,
    }));
  }

  /** Re-reads the local copy (after the admin edited or imported the catalog). */
  reloadLocal(): void {
    this.setState({ recipes: this.local.loadRecipes(), ingredients: this.local.loadIngredients() });
  }

  findPublishedBySlug(slug: string): Recipe | undefined {
    return this.getState().recipes.find((r) => r.slug === slug && r.is_published !== false);
  }

  /** Ingredient typed by the user that is not in the catalog. */
  addCustomIngredient(name: string, category: IngredientCategory): Ingredient {
    const ingredient: Ingredient = {
      id: createId('custom_ing'),
      name_fr: name,
      name_derja: name,
      name_ar: name,
      category,
      unit_default: 'pièce',
      default_price_tnd: 2.0,
    };
    const ingredients = [...this.getState().ingredients, ingredient];
    this.local.saveIngredients(ingredients);
    this.setState({ ingredients });
    return ingredient;
  }
}
