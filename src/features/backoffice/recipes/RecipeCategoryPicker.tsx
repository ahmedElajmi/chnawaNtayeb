import { useCategoryNames } from '@/shared/i18n/useCategoryNames';
import { useBackofficeText } from '../i18n/useBackofficeText';

/**
 * Managed categories of a recipe, as chips in tree order (sub-categories indented). Ticking a
 * sub-category is enough: being in "Chorba" puts the recipe in "Ramadan" too.
 */
export function RecipeCategoryPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const b = useBackofficeText();
  const { tree, name } = useCategoryNames('recipe');
  const chosen = new Set(value);
  const toggle = (id: string) => onChange(chosen.has(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <fieldset className="p-3 rounded-xl bg-card border border-line space-y-2">
      <legend className="px-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">{b.recipeCategories}</legend>
      {tree.ordered.length === 0 ? (
        <p className="text-[11px] text-ink-muted">{b.recipeNoCategories}</p>
      ) : (
        <>
          <p className="text-[10px] text-ink-muted">{b.recipeCategoriesHint}</p>
          <div className="flex flex-wrap gap-1.5">
            {tree.ordered.map((node) => {
              const id = node.category.id;
              const on = chosen.has(id);
              // Implied by a ticked sub-category
              const implied = !on && value.some((x) => tree.byId.get(x)?.path.includes(id));
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(id)}
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition ${
                    on
                      ? 'bg-brand text-on-brand border-brand'
                      : implied
                        ? 'bg-brand/10 text-brand-text border-brand/40'
                        : 'bg-card border-line text-ink hover:border-brand'
                  }`}
                >
                  {node.depth > 1 && <span className="opacity-60">{'›'.repeat(node.depth - 1)} </span>}
                  {node.category.icon && <span aria-hidden>{node.category.icon} </span>}
                  {name(id)}
                </button>
              );
            })}
          </div>
        </>
      )}
    </fieldset>
  );
}
