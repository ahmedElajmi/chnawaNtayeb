import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { validateIngredient, type Ingredient, type PriceRange } from '@/core/catalog';
import { useCatalog, useContainer, useReview } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { backofficePath, BACKOFFICE_PAGES } from '@/shared/paths';
import { IngredientEditorModal, NEW_INGREDIENT } from '../ingredients/IngredientEditorModal';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { format } from '../i18n/backofficeTexts';
import { useNotify } from './NotifyContext';

interface IngredientEditorActions {
  addIngredient: () => void;
  editIngredient: (ingredient: Ingredient) => void;
  /**
   * Saves edited price ranges to the workspace (validated first): false when one of them is not
   * valid (nothing saved).
   */
  savePrices: (ingredients: Ingredient[], prices: Record<string, PriceRange>) => Promise<boolean>;
  /** Ingredients as the team sees them: work copy when there is one, else the version online */
  ingredients: Ingredient[];
}

const IngredientEditorContext = createContext<IngredientEditorActions | null>(null);

/**
 * The ingredient editor, opened from any backoffice page. Like recipes, every change goes to the
 * validation workspace: an ingredient (name, price, photo) reaches the public once validated.
 */
export function IngredientEditorProvider({ children }: { children: ReactNode }) {
  const { catalogAdmin } = useContainer();
  const { entries, store } = useReview('ingredient');
  const { getIngredientName } = useLanguage();
  const notify = useNotify();
  const navigate = useNavigate();
  const b = useBackofficeText();
  const { ingredients: online } = useCatalog();
  const [editing, setEditing] = useState<Ingredient | null>(null);

  const ingredients = useMemo(() => {
    const copies = new Map(entries.map((e) => [e.copy.id, e.copy.content]));
    return [
      ...online.map((i) => copies.get(i.id) ?? i),
      ...entries.filter((e) => !online.some((i) => i.id === e.copy.id)).map((e) => e.copy.content),
    ];
  }, [entries, online]);

  const savePrices = useCallback<IngredientEditorActions['savePrices']>(
    async (list, prices) => {
      const updated: Ingredient[] = [];
      for (const [id, range] of Object.entries(prices)) {
        const ingredient = list.find((i) => i.id === id);
        if (!ingredient) continue;
        const checked = validateIngredient({ ...ingredient, price_min_tnd: range.min, price_max_tnd: range.max });
        if (!checked.ok) {
          notify(`${getIngredientName(ingredient)} : ${checked.error}`, true);
          return false;
        }
        updated.push(checked.value);
      }
      let error = '';
      for (const ingredient of updated) {
        const result = await store.save(ingredient);
        if (!result.ok) error = result.error;
      }
      notify(error || format(b.reviewPricesSaved, { count: updated.length }), !!error);
      return true;
    },
    [store, notify, getIngredientName, b]
  );

  const actions = useMemo<IngredientEditorActions>(
    () => ({
      addIngredient: () => setEditing(NEW_INGREDIENT),
      editIngredient: setEditing,
      savePrices,
      ingredients,
    }),
    [savePrices, ingredients]
  );

  return (
    <IngredientEditorContext.Provider value={actions}>
      {children}
      {editing && (
        <IngredientEditorModal
          ingredient={editing}
          catalog={ingredients}
          onClose={() => setEditing(null)}
          onSave={async (ingredient) => {
            setEditing(null);
            const { id: _new, ...data } = ingredient;
            const saved = ingredient.id ? ingredient : catalogAdmin.createIngredient(data);
            const result = await store.save(saved);
            notify(result.ok ? b.reviewSaved : result.error, !result.ok);
            if (result.ok || result.local) navigate(backofficePath(BACKOFFICE_PAGES.ingredients, saved.id));
          }}
        />
      )}
    </IngredientEditorContext.Provider>
  );
}

export function useIngredientEditor(): IngredientEditorActions {
  const actions = useContext(IngredientEditorContext);
  if (!actions) throw new Error('useIngredientEditor must be used inside IngredientEditorProvider');
  return actions;
}
