import type { Ingredient, Recipe } from '@/core/catalog';
import { Store } from '../store';
import type { SyncedCollectionStore } from '../sync/SyncedCollectionStore';

export interface CatalogState {
  recipes: Recipe[];
  ingredients: Ingredient[];
  /** True once the shared catalog has answered (or was found unavailable). */
  remoteChecked: boolean;
}

/** Recipes and ingredients: two shared collections followed live, seen together by the screens. */
export class CatalogStore extends Store<CatalogState> {
  constructor(
    readonly recipes: SyncedCollectionStore<Recipe>,
    readonly ingredients: SyncedCollectionStore<Ingredient>
  ) {
    super(CatalogStore.combine(recipes, ingredients));
    const update = () => this.setState(CatalogStore.combine(recipes, ingredients));
    recipes.subscribe(update);
    ingredients.subscribe(update);
  }

  private static combine(
    recipes: SyncedCollectionStore<Recipe>,
    ingredients: SyncedCollectionStore<Ingredient>
  ): CatalogState {
    const r = recipes.getState();
    const i = ingredients.getState();
    return { recipes: r.items, ingredients: i.items, remoteChecked: r.synced && i.synced };
  }

  /** Starts following the shared catalog; returns the function that stops it. */
  start(): () => void {
    const stopRecipes = this.recipes.start();
    const stopIngredients = this.ingredients.start();
    return () => {
      stopRecipes();
      stopIngredients();
    };
  }

  /** Reads the whole catalog again from the database. */
  refreshAll(): void {
    this.recipes.refreshAll();
    this.ingredients.refreshAll();
  }

  findPublishedBySlug(slug: string): Recipe | undefined {
    return this.getState().recipes.find((r) => r.slug === slug && r.is_published !== false);
  }
}
