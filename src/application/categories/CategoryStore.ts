import {
  buildCategoryTree,
  deletionBlocker,
  validateCategory,
  withBuiltInCategories,
  type CategoryError,
  type CategoryTree,
  type CategoryWriteBlocker,
  type CategoryUsage,
  type ContentCategory,
} from '@/core/categories';
import type { SharedCollectionWriter, WriteResult } from '../ports';
import { Store } from '../store';
import type { SyncedCollectionStore } from '../sync/SyncedCollectionStore';

export interface CategoryState {
  categories: ContentCategory[];
  /** Built once per change of the list */
  tree: CategoryTree;
}

export type CategoryWriteResult =
  | { ok: true; local?: boolean }
  | {
      ok: false;
      error?: string;
      errors?: CategoryError[];
      blocker?: CategoryWriteBlocker;
    };

/**
 * Categories of one kind of content (recipes or ingredients): a shared collection, followed like the
 * catalog, edited in the backoffice by an account allowed to publish. Every change is checked by the
 * domain (validateCategory) before it is written.
 */
export class CategoryStore extends Store<CategoryState> {
  constructor(
    private readonly collection: SyncedCollectionStore<ContentCategory>,
    private readonly writer: SharedCollectionWriter<ContentCategory>,
    private readonly canEdit: () => boolean,
    /** Categories of the code: shown unless the database holds an edited copy */
    private readonly builtIn: readonly ContentCategory[] = []
  ) {
    super(CategoryStore.stateOf(collection.getState().items, builtIn));
    let stored = collection.getState().items;
    collection.subscribe(() => {
      if (collection.getState().items === stored) return;
      stored = collection.getState().items;
      this.setState(CategoryStore.stateOf(stored, builtIn));
    });
  }

  private static stateOf(stored: ContentCategory[], builtIn: readonly ContentCategory[]): CategoryState {
    const categories = withBuiltInCategories(stored, builtIn);
    return { categories, tree: buildCategoryTree(categories) };
  }

  start(): () => void {
    return this.collection.start();
  }

  /** Creates or updates a category (rename, translate, move, reorder). */
  async save(category: ContentCategory): Promise<CategoryWriteResult> {
    if (!this.canEdit()) return { ok: false, blocker: 'denied' };
    const errors = validateCategory(category, this.getState().categories);
    if (errors.length) return { ok: false, errors };
    const clean: ContentCategory = { ...category, name_fr: category.name_fr.trim() };
    const result = await this.writer.put(clean);
    this.collection.putLocal(clean);
    return result.ok ? { ok: true } : { ok: true, local: true };
  }

  /** Moves categories in one go (new order of siblings): only the changed ones are written. */
  async reorder(ids: readonly string[]): Promise<CategoryWriteResult> {
    if (!this.canEdit()) return { ok: false, blocker: 'denied' };
    let local = false;
    for (const [index, id] of ids.entries()) {
      const category = this.getState().tree.byId.get(id)?.category;
      const order = (index + 1) * 10;
      if (!category || category.order === order) continue;
      const result: WriteResult = await this.writer.put({ ...category, order });
      this.collection.putLocal({ ...category, order });
      if (!result.ok) local = true;
    }
    return { ok: true, ...(local ? { local } : {}) };
  }

  /** Deletes a category that is not built in, has no sub-category and holds no item. */
  async remove(id: string, usage: ReadonlyMap<string, CategoryUsage>): Promise<CategoryWriteResult> {
    if (!this.canEdit()) return { ok: false, blocker: 'denied' };
    const blocker = deletionBlocker(this.getState().tree, id, usage);
    if (blocker) return { ok: false, blocker };
    const result = await this.writer.remove(id);
    this.collection.removeLocal(id);
    return result.ok ? { ok: true } : { ok: true, local: true };
  }
}
