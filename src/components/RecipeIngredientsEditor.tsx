import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Ingredient, IngredientRole, RecipeIngredient } from '../types';
import { getRole } from '../services/ingredientRoles';

const ROLE_LABELS: Record<IngredientRole, string> = {
  key: 'Clé (fait le plat)',
  secondary: 'Secondaire',
  staple: 'Placard (sel, épices…)',
};

interface RecipeIngredientsEditorProps {
  items: RecipeIngredient[];
  catalog: Ingredient[];
  onChange: (items: RecipeIngredient[]) => void;
}

/** Ingredient list of a recipe, with the role used by the "Lawajli 3la makla" matching. */
export const RecipeIngredientsEditor: React.FC<RecipeIngredientsEditorProps> = ({ items, catalog, onChange }) => {
  const sortedCatalog = [...catalog].sort((a, b) => a.name_fr.localeCompare(b.name_fr, 'fr'));
  const update = (index: number, patch: Partial<RecipeIngredient>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const addRow = () => {
    const used = new Set(items.map((i) => i.ingredient_id));
    const first = sortedCatalog.find((c) => !used.has(c.id)) ?? sortedCatalog[0];
    if (!first) return;
    onChange([...items, { ingredient_id: first.id, quantity_base: 1, unit: first.unit_default, role: getRole({ ingredient_id: first.id, quantity_base: 1, unit: '' }, catalog) }]);
  };

  const keyCount = items.filter((i) => !i.is_optional && getRole(i, catalog) === 'key').length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Ingrédients ({items.length})</label>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-text hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>
      {keyCount === 0 && (
        <p className="text-[11px] text-amber-700 dark:text-amber-300">
          Aucun ingrédient « clé » : la recette sera proposée dès qu'un seul ingrédient correspond. Marque au moins
          l'ingrédient principal comme clé.
        </p>
      )}
      <div className="space-y-1.5">
        {items.map((item, index) => {
          const role = getRole(item, catalog);
          return (
            <div
              key={`${item.ingredient_id}-${index}`}
              className="grid grid-cols-[minmax(0,1fr)_64px_72px] sm:grid-cols-[minmax(0,1fr)_64px_72px_150px_auto_auto] gap-1.5 items-center p-1.5 rounded-lg bg-card border border-line"
            >
              <select
                value={item.ingredient_id}
                onChange={(e) => update(index, { ingredient_id: e.target.value, role: undefined })}
                aria-label="Ingrédient"
                className="w-full min-w-0 px-2 py-1.5 text-xs rounded-md bg-surface border border-line text-ink"
              >
                {!catalog.some((c) => c.id === item.ingredient_id) && (
                  <option value={item.ingredient_id}>{item.ingredient_id}</option>
                )}
                {sortedCatalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_fr}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step="any"
                value={item.quantity_base}
                onChange={(e) => update(index, { quantity_base: parseFloat(e.target.value) || 0 })}
                aria-label="Quantité"
                className="w-full min-w-0 px-2 py-1.5 text-xs rounded-md bg-surface border border-line text-ink"
              />
              <input
                type="text"
                value={item.unit}
                maxLength={20}
                onChange={(e) => update(index, { unit: e.target.value })}
                aria-label="Unité"
                className="w-full min-w-0 px-2 py-1.5 text-xs rounded-md bg-surface border border-line text-ink"
              />
              <select
                value={role}
                onChange={(e) => update(index, { role: e.target.value as IngredientRole })}
                aria-label="Rôle dans la recette"
                className={`w-full min-w-0 col-span-2 sm:col-span-1 px-2 py-1.5 text-xs rounded-md border text-ink ${
                  role === 'key' ? 'bg-accent/10 border-accent/40 font-bold' : 'bg-surface border-line'
                }`}
              >
                {(Object.keys(ROLE_LABELS) as IngredientRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-1 text-[11px] text-ink-muted whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={!!item.is_optional}
                  onChange={(e) => update(index, { is_optional: e.target.checked || undefined })}
                  className="accent-brand"
                />
                Optionnel
              </label>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                aria-label="Retirer l'ingrédient"
                className="justify-self-end p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
