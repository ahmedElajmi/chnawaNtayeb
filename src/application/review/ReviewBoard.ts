import type { Ingredient } from '@/core/catalog';
import type { ReviewContext, RoleDefinition, WorkCopy } from '@/core/review';
import type { ReviewWorkspaceWriter } from '../ports';
import type { CatalogStore } from '../catalog/CatalogStore';
import type { SyncedCollectionStore } from '../sync/SyncedCollectionStore';
import { ReviewStore } from './ReviewStore';
import type { ReviewSettingsStore } from './ReviewSettingsStore';

export interface ReviewBoardDeps {
  settings: ReviewSettingsStore;
  catalog: CatalogStore;
  recipes: { workspace: SyncedCollectionStore<WorkCopy<'recipe'>>; writer: ReviewWorkspaceWriter<'recipe'> };
  ingredients: {
    workspace: SyncedCollectionStore<WorkCopy<'ingredient'>>;
    writer: ReviewWorkspaceWriter<'ingredient'>;
  };
  actor: () => { id: string; role: RoleDefinition };
  now: () => number;
}

/**
 * Validation of the whole catalog: one ReviewStore per kind, sharing the workflow settings and the
 * context of the checks (a recipe may use an ingredient still in the workspace, but can only be
 * published with ingredients that are online).
 */
export class ReviewBoard {
  readonly settings: ReviewSettingsStore;
  readonly recipes: ReviewStore<'recipe'>;
  readonly ingredients: ReviewStore<'ingredient'>;
  private ctx: { key: [unknown, unknown]; value: ReviewContext } | null = null;

  constructor(private readonly deps: ReviewBoardDeps) {
    this.settings = deps.settings;
    const context = () => this.context();
    this.ingredients = new ReviewStore({
      kind: 'ingredient',
      ...deps.ingredients,
      published: deps.catalog.ingredients,
      settings: deps.settings,
      context,
      actor: deps.actor,
      now: deps.now,
    });
    this.recipes = new ReviewStore({
      kind: 'recipe',
      ...deps.recipes,
      published: deps.catalog.recipes,
      settings: deps.settings,
      context,
      actor: deps.actor,
      now: deps.now,
    });
    // A recipe's checks look at the ingredients: recompute when they change
    const refreshRecipes = () => this.recipes.refresh();
    deps.catalog.ingredients.subscribe(refreshRecipes);
    deps.ingredients.workspace.subscribe(refreshRecipes);
  }

  /** Ingredients known (online or in the workspace) and online: the same object while they do not change. */
  context(): ReviewContext {
    const online = this.deps.catalog.ingredients.getState().items;
    const copies = this.deps.ingredients.workspace.getState().items;
    if (this.ctx && this.ctx.key[0] === online && this.ctx.key[1] === copies) return this.ctx.value;
    const known = new Map<string, Ingredient>(online.map((i) => [i.id, i]));
    for (const copy of copies) if (!known.has(copy.id)) known.set(copy.id, copy.content);
    const value: ReviewContext = {
      ingredients: [...known.values()],
      publishedIngredientIds: new Set(online.map((i) => i.id)),
    };
    this.ctx = { key: [online, copies], value };
    return value;
  }

  /** Who acts on this device, with their role. */
  actor(): { id: string; role: RoleDefinition } {
    return this.deps.actor();
  }

  /** Follows the settings and both workspaces (admin only); returns the stop function. */
  start(): () => void {
    const stops = [this.settings.start(), this.ingredients.start(), this.recipes.start()];
    return () => stops.forEach((stop) => stop());
  }
}
