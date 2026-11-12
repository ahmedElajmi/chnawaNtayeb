import { useState } from 'react';
import { Copy, Eye, EyeOff, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { Recipe } from '@/core/catalog';
import { normalizeText, parseYouTubeId } from '@/core/shared';
import { useLanguage } from '@/app/providers/LanguageContext';
import { getRecipeCost, useCatalog } from '@/app/ContainerContext';
import { formatPriceRange } from '@/shared/i18n/formatPrice';
import { usePagedList } from '@/shared/hooks/usePagedList';
import { ShowMore } from '@/shared/ui/ShowMore';
import { RecipeBadges } from '@/features/recipes/components/RecipeBadges';
import type { CatalogAdminActions } from '../useCatalogAdmin';

interface RecipesTabProps {
  recipes: Recipe[];
  admin: CatalogAdminActions;
  onAddRecipe: () => void;
  onEditRecipe: (recipe: Recipe) => void;
  /** Opens the editor on a copy of the recipe (new, unpublished) */
  onDuplicateRecipe: (recipe: Recipe) => void;
}

export function RecipesTab({ recipes, admin, onAddRecipe, onEditRecipe, onDuplicateRecipe }: RecipesTabProps) {
  const { t, getRecipeName, getSecondaryName } = useLanguage();
  const { ingredients } = useCatalog();
  const [search, setSearch] = useState('');
  const q = normalizeText(search.trim());
  const filtered = q
    ? recipes.filter((r) => [r.name_fr, r.name_derja, r.name_ar].some((n) => normalizeText(n).includes(q)))
    : recipes;
  const page = usePagedList(filtered, q);

  const togglePublish = (recipe: Recipe) => {
    const updated = { ...recipe, is_published: !recipe.is_published };
    admin.saveRecipe(
      updated,
      `Recette "${getRecipeName(recipe)}" ${updated.is_published ? 'publiée' : 'passée en brouillon'}`
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une recette par nom..."
            aria-label="Rechercher une recette"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
          />
        </div>
        <button
          onClick={onAddRecipe}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-bold hover:bg-brand-strong transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.boAddRecipe}</span>
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700/80 rounded-2xl bg-card border border-line overflow-hidden shadow-xs">
        {page.visible.map((r) => (
          <div
            key={r.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
                {r.image_url ? (
                  <img
                    src={r.image_url}
                    alt={getRecipeName(r)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <img src="/mark.png" alt="" className="w-full h-full object-contain p-1.5 opacity-70" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink">{getRecipeName(r)}</span>
                  {getSecondaryName(r) && (
                    <span className="text-xs text-accent-text font-semibold">({getSecondaryName(r)})</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <RecipeBadges recipe={r} />
                  {parseYouTubeId(r.video_url) && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                      ▶ Vidéo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>{r.prep_time_minutes + r.cook_time_minutes} min</span>
                  <span>·</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatPriceRange(getRecipeCost(r, ingredients), 'DT')}
                  </span>
                  <span>·</span>
                  <span className="capitalize">{r.cuisine_type}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => togglePublish(r)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  r.is_published
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                {r.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{r.is_published ? 'En ligne' : 'Brouillon'}</span>
              </button>
              <button
                onClick={() => onEditRecipe(r)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                title={t.boEditRecipe}
                aria-label={t.boEditRecipe}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDuplicateRecipe(r)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                title="Dupliquer : nouvelle recette à partir de celle-ci"
                aria-label={`Dupliquer ${getRecipeName(r)}`}
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => admin.deleteRecipe(r)}
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500"
                title={t.boDeleteRecipe}
                aria-label={t.boDeleteRecipe}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <ShowMore
        list={page}
        progressLabel={(shown, total) => `${shown} recette(s) affichée(s) sur ${total}`}
        buttonLabel="Afficher plus"
      />
    </div>
  );
}
