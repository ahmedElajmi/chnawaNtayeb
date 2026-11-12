import type { Ingredient, Recipe } from '@/core/catalog';
import {
  ingredientSearchDocument,
  normalizeSearchText,
  planIndexUpdate,
  recipeSearchDocument,
  toSearchMatches,
} from '@/core/search';
import type { SearchEngine } from '../ports';
import { Store } from '../store';
import type { CatalogState } from '../catalog/CatalogStore';

/** What the search needs from the catalog store. */
export interface CatalogSource {
  getState(): Pick<CatalogState, 'recipes' | 'ingredients'>;
  subscribe(listener: () => void): () => void;
}

export type SearchKind = 'recipes' | 'ingredients';

export interface CatalogSearchState {
  /** Increases each time an index changes: results computed before may be out of date. */
  revision: number;
}

/**
 * Search over the catalog, kept in step with the device copy of the catalog: no database read.
 *
 * - The indexes are built on the first search only (nothing to pay for a visitor who never searches).
 * - Then they follow the catalog: only the recipes that changed are re-indexed; a change in the
 *   ingredients re-indexes them and every recipe (ingredient names are part of the recipes' words).
 * - Updates run one after the other; a search waits for the pending ones.
 * - `null` means "no search engine answer": the screens then keep their simple filtering, so an
 *   engine failure never empties a list.
 */
export class CatalogSearch extends Store<CatalogSearchState> {
  private started = false;
  private failed = false;
  private pending: Promise<void> = Promise.resolve();
  private indexedRecipes = new Map<string, Recipe>();
  private indexedIngredients = new Map<string, Ingredient>();
  private ingredientList: Ingredient[] | null = null;

  constructor(
    private readonly catalog: CatalogSource,
    private readonly engines: Readonly<Record<SearchKind, SearchEngine>>
  ) {
    super({ revision: 0 });
  }

  /** Matching ids with their relevance (higher is better); null for an empty query or when the engine failed. */
  async search(kind: SearchKind, query: string): Promise<ReadonlyMap<string, number> | null> {
    const terms = normalizeSearchText(query);
    if (!terms) return null;
    this.start();
    await this.pending;
    if (this.failed) return null;
    try {
      return toSearchMatches(await this.engines[kind].search(terms));
    } catch {
      return null;
    }
  }

  private start(): void {
    if (this.started) return;
    this.started = true;
    this.catalog.subscribe(() => this.schedule());
    this.schedule();
  }

  private schedule(): void {
    this.pending = this.pending.then(() =>
      this.update().catch(() => {
        // An engine that failed once is not trusted any more: the screens keep their simple filtering
        this.failed = true;
      })
    );
  }

  private async update(): Promise<void> {
    const { recipes, ingredients } = this.catalog.getState();
    let changed = false;

    if (ingredients !== this.ingredientList) {
      const byId = new Map(ingredients.map((i) => [i.id, i]));
      const plan = planIndexUpdate(this.indexedIngredients, ingredients);
      if (this.indexedIngredients.size === 0) {
        await this.engines.ingredients.rebuild(ingredients.map(ingredientSearchDocument));
      } else {
        if (plan.remove.length) await this.engines.ingredients.remove(plan.remove);
        if (plan.upsert.length) await this.engines.ingredients.upsert(plan.upsert.map(ingredientSearchDocument));
      }
      this.indexedIngredients = byId;
      this.ingredientList = ingredients;
      await this.engines.recipes.rebuild(recipes.map((r) => recipeSearchDocument(r, byId)));
      this.indexedRecipes = new Map(recipes.map((r) => [r.id, r]));
      changed = true;
    } else {
      const plan = planIndexUpdate(this.indexedRecipes, recipes);
      if (plan.remove.length) await this.engines.recipes.remove(plan.remove);
      if (plan.upsert.length) {
        await this.engines.recipes.upsert(plan.upsert.map((r) => recipeSearchDocument(r, this.indexedIngredients)));
      }
      if (plan.remove.length || plan.upsert.length) {
        this.indexedRecipes = new Map(recipes.map((r) => [r.id, r]));
        changed = true;
      }
    }

    if (changed) this.setState((s) => ({ revision: s.revision + 1 }));
  }
}
