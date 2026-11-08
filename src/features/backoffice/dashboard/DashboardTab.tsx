import { Coins, Download, Plus } from 'lucide-react';
import { getUsedIngredientIds, type Ingredient, type Recipe } from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';

interface DashboardTabProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onAddRecipe: () => void;
  onOpenIngredients: () => void;
  onDownloadBackup: () => void;
}

function Kpi({
  label,
  value,
  valueClass,
  note,
  noteClass = 'text-slate-500',
}: {
  label: string;
  value: string | number;
  valueClass: string;
  note: string;
  noteClass?: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-card border border-line shadow-xs">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <p className={`text-2xl sm:text-3xl font-extrabold mt-1 ${valueClass}`}>{value}</p>
      <p className={`text-xs mt-1 ${noteClass}`}>{note}</p>
    </div>
  );
}

const SECONDARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100 text-xs sm:text-sm font-semibold hover:border-slate-400 transition';

export function DashboardTab({
  recipes,
  ingredients,
  onAddRecipe,
  onOpenIngredients,
  onDownloadBackup,
}: DashboardTabProps) {
  const { t } = useLanguage();
  const usedIds = getUsedIngredientIds(recipes);
  const unused = ingredients.filter((i) => !usedIds.has(i.id)).length;
  const total = recipes.length;
  const published = recipes.filter((r) => r.is_published).length;
  const avgCost = total > 0 ? (recipes.reduce((acc, r) => acc + r.estimated_cost_tnd, 0) / total).toFixed(1) : '0';
  const avgTime =
    total > 0 ? Math.round(recipes.reduce((acc, r) => acc + r.prep_time_minutes + r.cook_time_minutes, 0) / total) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi
          label={t.boTotalRecipes}
          value={total}
          valueClass="text-ink"
          note={`${published} publiées · ${total - published} brouillons`}
          noteClass="text-emerald-600 font-medium"
        />
        <Kpi
          label="Ingrédients répertoriés"
          value={ingredients.length}
          valueClass="text-brand-text"
          note={unused > 0 ? `${unused} sans aucune recette` : 'Tous utilisés par une recette'}
          noteClass={unused > 0 ? 'text-amber-600 font-semibold' : 'text-slate-500'}
        />
        <Kpi
          label={t.boAvgCost}
          value={`${avgCost} DT`}
          valueClass="text-accent-text"
          note="Par repas pour 4 personnes"
        />
        <Kpi label="Temps moyen" value={`${avgTime} min`} valueClass="text-highlight" note="Préparation & cuisson" />
      </div>

      <div className="p-5 rounded-2xl bg-card border border-line space-y-3">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Actions rapides</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onAddRecipe}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-bold hover:bg-brand-strong transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t.boAddRecipe}</span>
          </button>
          <button onClick={onOpenIngredients} className={SECONDARY_BUTTON}>
            <Coins className="w-4 h-4 text-accent-text" />
            <span>Mettre à jour les prix du marché (DT)</span>
          </button>
          <button onClick={onDownloadBackup} className={SECONDARY_BUTTON}>
            <Download className="w-4 h-4 text-blue-500" />
            <span>Télécharger une sauvegarde</span>
          </button>
        </div>
      </div>
    </div>
  );
}
