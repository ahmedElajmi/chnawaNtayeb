import type { ReactNode } from 'react';
import type { ReviewItems, ReviewKind } from '@/core/review';
import type { Language } from '@/core/shared';
import { useCatalog } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { BACKOFFICE_PAGES, type BackofficePageId } from '@/shared/paths';
import { useIngredientEditor } from '../shell/IngredientEditorContext';
import { useRecipeEditor } from '../shell/RecipeEditorContext';
import { IngredientCellContent } from './IngredientCellContent';
import { RecipeCellContent } from './RecipeCellContent';

/** What the review screens need to know about a kind of content (name, list page, editor, cell view). */
export interface KindView<K extends ReviewKind> {
  kind: K;
  listPage: BackofficePageId;
  name: (item: ReviewItems[K]) => string;
  /** Version online (null when the item is not online) */
  online: (id: string) => ReviewItems[K] | null;
  edit: (item: ReviewItems[K]) => void;
  content: (item: ReviewItems[K], part: string, language?: Language) => ReactNode;
  /** The public sheet exists for recipes only */
  hasPreview: boolean;
}

export function useRecipeView(): KindView<'recipe'> {
  const { getRecipeName } = useLanguage();
  const { recipes } = useCatalog();
  const { editRecipe } = useRecipeEditor();
  return {
    kind: 'recipe',
    listPage: BACKOFFICE_PAGES.recipes,
    name: getRecipeName,
    online: (id) => recipes.find((r) => r.id === id && r.is_published !== false) ?? null,
    edit: editRecipe,
    content: (item, part, language) => <RecipeCellContent recipe={item} part={part} language={language} />,
    hasPreview: true,
  };
}

export function useIngredientView(): KindView<'ingredient'> {
  const { getIngredientName } = useLanguage();
  const { ingredients } = useCatalog();
  const { editIngredient } = useIngredientEditor();
  return {
    kind: 'ingredient',
    listPage: BACKOFFICE_PAGES.ingredients,
    name: getIngredientName,
    online: (id) => ingredients.find((i) => i.id === id) ?? null,
    edit: editIngredient,
    content: (item, part, language) => <IngredientCellContent item={item} part={part} language={language} />,
    hasPreview: false,
  };
}
