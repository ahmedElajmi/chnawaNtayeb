import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { categoryUsage } from '@/core/categories';
import { useCatalog } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useCategoryNames } from '@/shared/i18n/useCategoryNames';
import type { RecipeFilters } from '../recipeFilters';

/**
 * Recipes by category: the families as cards when no category is open; once one is open, the path
 * back ("All › Occasions › Ramadan") and its sub-categories. Only categories holding published
 * recipes are shown, with counts taken on the whole catalog.
 */
export function RecipeCategoryBrowser({
  filters,
  setFilters,
}: {
  filters: RecipeFilters;
  setFilters: (patch: Partial<RecipeFilters>) => void;
}) {
  const { t } = useLanguage();
  const { recipes } = useCatalog();
  const { tree, name } = useCategoryNames('recipe');
  const usage = useMemo(
    () =>
      categoryUsage(
        tree,
        recipes.filter((r) => r.is_published !== false).map((r) => r.category_ids ?? [])
      ),
    [tree, recipes]
  );
  const open = filters.category ? tree.byId.get(filters.category) : undefined;
  const shown = (open ? open.children : tree.roots).filter((n) => (usage.get(n.category.id)?.total ?? 0) > 0);
  if (!open && shown.length === 0) return null;
  const choose = (category?: string) => setFilters({ category });

  return (
    <section className="space-y-2" aria-label={t.categoriesTitle}>
      {open ? (
        <nav className="flex flex-wrap items-center gap-1 text-xs font-semibold" aria-label={t.categoriesTitle}>
          <button type="button" onClick={() => choose()} className="text-ink-muted hover:text-brand-text">
            {t.allCategoriesCrumb}
          </button>
          {open.path.map((id) => (
            <span key={id} className="inline-flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-ink-muted rtl:rotate-180" />
              {id === open.category.id ? (
                <span className="text-ink" aria-current="page">
                  {name(id)}
                </span>
              ) : (
                <button type="button" onClick={() => choose(id)} className="text-ink-muted hover:text-brand-text">
                  {name(id)}
                </button>
              )}
            </span>
          ))}
        </nav>
      ) : (
        <h2 className="text-sm font-extrabold text-ink">{t.categoriesTitle}</h2>
      )}
      {shown.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {shown.map((n) => (
            <button
              key={n.category.id}
              type="button"
              onClick={() => choose(n.category.id)}
              className={`shrink-0 inline-flex items-center gap-2 rounded-2xl bg-card border border-line hover:border-brand transition ${
                open ? 'px-3 py-1.5 text-xs' : 'px-4 py-3 text-sm'
              }`}
            >
              {n.category.icon && <span aria-hidden>{n.category.icon}</span>}
              <span className="font-bold text-ink">{name(n.category.id)}</span>
              <span className="text-[11px] text-ink-muted tabular-nums">{usage.get(n.category.id)?.total ?? 0}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
