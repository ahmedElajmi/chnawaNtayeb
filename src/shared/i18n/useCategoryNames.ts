import { useMemo } from 'react';
import { categoryWithAncestors, type CategoryKind, type CategoryTree } from '@/core/categories';
import { localizedField, pickLocalized } from '@/core/shared';
import { useCategories } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';

export interface CategoryNames {
  tree: CategoryTree;
  /** Name in the current language ('' when unknown) */
  name: (id: string) => string;
  /** Names from the root ("Occasions › Ramadan") */
  path: (id: string) => string;
  /** Every category in tree order, indented by depth (for a select) */
  options: [string, string][];
}

/** Managed categories of recipes or ingredients, named in the current language. */
export function useCategoryNames(kind: CategoryKind): CategoryNames {
  const { tree } = useCategories(kind);
  const { language } = useLanguage();
  return useMemo(() => {
    const name = (id: string) => {
      const category = tree.byId.get(id)?.category;
      return category ? pickLocalized(language, localizedField(category, 'name')) : '';
    };
    return {
      tree,
      name,
      path: (id) => categoryWithAncestors(tree, id).map(name).join(' › '),
      options: tree.ordered.map((n) => [
        n.category.id,
        `${'\u00a0\u00a0\u00a0'.repeat(n.depth - 1)}${name(n.category.id)}`,
      ]),
    };
  }, [tree, language]);
}

/** Ingredient categories in tree order, with their label in the current language (indented by depth). */
export function useIngredientCategories(): [string, string][] {
  return useCategoryNames('ingredient').options;
}
