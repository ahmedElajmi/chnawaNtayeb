import { localizedField, pickLocalized, type Language } from '@/core/shared';
import { unitDescriptionIndex, unitLookupKey, type UnitInfo } from '@/core/units';
import type { Ingredient, Recipe } from '@/core/catalog';
import { Store } from '../store';
import type { SyncedCollectionStore } from '../sync/SyncedCollectionStore';

export interface CatalogState {
  recipes: Recipe[];
  ingredients: Ingredient[];
  /** Unit descriptions managed in the backoffice (units followed like the catalog) */
  units: UnitInfo[];
  /** Units indexed by their label or id (lookup keys): the screens ask it for the unit shown */
  unitDescriptions: ReadonlyMap<string, UnitInfo>;
  /** True once the shared catalog has answered (or was found unavailable). */
  remoteChecked: boolean;
}

/** Recipes and ingredients: two shared collections followed live, seen together by the screens. */
export class CatalogStore extends Store<CatalogState> {
  constructor(
    readonly recipes: SyncedCollectionStore<Recipe>,
    readonly ingredients: SyncedCollectionStore<Ingredient>,
    readonly units: SyncedCollectionStore<UnitInfo>
  ) {
    super(CatalogStore.combine(recipes, ingredients, units));
    const update = () => this.setState(CatalogStore.combine(recipes, ingredients, units));
    recipes.subscribe(update);
    ingredients.subscribe(update);
    units.subscribe(update);
  }

  private static combine(
    recipes: SyncedCollectionStore<Recipe>,
    ingredients: SyncedCollectionStore<Ingredient>,
    units: SyncedCollectionStore<UnitInfo>
  ): CatalogState {
    const r = recipes.getState();
    const i = ingredients.getState();
    const unitItems = units.getState().items;
    return {
      recipes: r.items,
      ingredients: i.items,
      units: unitItems,
      unitDescriptions: unitDescriptionIndex(unitItems),
      remoteChecked: r.synced && i.synced,
    };
  }

  /** Starts following the shared catalog; returns the function that stops it. */
  start(): () => void {
    const stopRecipes = this.recipes.start();
    const stopIngredients = this.ingredients.start();
    const stopUnits = this.units.start();
    return () => {
      stopRecipes();
      stopIngredients();
      stopUnits();
    };
  }

  /** Reads the whole catalog again from the database. */
  refreshAll(): void {
    this.recipes.refreshAll();
    this.ingredients.refreshAll();
    this.units.refreshAll();
  }

  findPublishedBySlug(slug: string): Recipe | undefined {
    return this.getState().recipes.find((r) => r.slug === slug && r.is_published !== false);
  }

  /**
   * The unit description configured in the backoffice for this unit label (or its id), written
   * in the requested language with its fallbacks; undefined when no description is defined —
   * the front office then shows the bare unit (no default description exists in the code).
   */
  unitDescriptionOf(unit: string, language: Language): string | undefined {
    const info = this.getState().unitDescriptions.get(unitLookupKey(unit));
    if (!info) return undefined;
    const description = pickLocalized(language, localizedField(info, 'description'));
    return description || undefined;
  }
}
