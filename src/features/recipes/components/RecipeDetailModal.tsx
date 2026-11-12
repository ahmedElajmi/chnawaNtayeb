import React, { useState } from 'react';
import {
  X,
  Clock,
  Coins,
  Users,
  Heart,
  Share2,
  CheckCircle2,
  Circle,
  Lightbulb,
  ShoppingBag,
  ChefHat,
} from 'lucide-react';
import { Recipe, Ingredient } from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';
import { scaleIngredients, analyzeRecipe, type MatchingConfig } from '@/core/matching';
import { RecipeBadges } from '@/features/recipes/components/RecipeBadges';
import { RecipeVideo } from '@/features/recipes/components/RecipeVideo';
import { ModalShell } from '@/shared/ui/ModalShell';
import { IngredientThumb } from '@/shared/ui/IngredientThumb';
import { formatPriceRange } from '@/shared/i18n/formatPrice';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (recipeId: string) => void;
  allIngredients: Ingredient[];
  selectedFridgeIds: string[];
  pantryIds: string[];
  onAddMissingToGrocery: (missingIngs: { name: string; quantity: number; unit: string }[]) => void;
  /** Engine settings, so the recipe screen agrees with the suggestions */
  matchingConfig?: MatchingConfig;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  allIngredients,
  selectedFridgeIds,
  pantryIds,
  onAddMissingToGrocery,
  matchingConfig,
}) => {
  const { t, language, getRecipeName, getRecipeDesc, getIngredientName, getStepText, getChefTip } = useLanguage();
  const [servings, setServings] = useState<number>(recipe?.base_servings || 4);
  const [addedGroceryToast, setAddedGroceryToast] = useState(false);

  if (!isOpen || !recipe) return null;

  const scaledList = scaleIngredients(recipe, servings);
  const name = getRecipeName(recipe);
  const desc = getRecipeDesc(recipe);
  const tip = getChefTip(recipe.chef_tip);
  // Names in the other languages, shown once under the title (never the title again)
  const otherNames = [language !== 'derja' && recipe.name_derja, language !== 'ar' && recipe.name_ar]
    .filter((n): n is string => !!n && !!n.trim() && n.trim() !== name)
    .join(' · ');

  // Same analysis as the suggestions (fridge + pantry + substitutes + ingredient roles)
  const analysis = analyzeRecipe(recipe, selectedFridgeIds, {
    pantryIds,
    catalog: allIngredients,
    config: matchingConfig,
  });
  const missingKeySet = new Set(analysis.missingKey);
  const missingStapleSet = new Set(analysis.missingStaples);
  const substituteOf = new Map(analysis.substitutions.map((s) => [s.ingredient_id, s.substitute_id]));
  const matchedSet = new Set(analysis.matched);

  type Row = {
    ing: Ingredient | undefined;
    quantity: number;
    unit: string;
    isKey: boolean;
    substitute?: Ingredient;
    optional?: boolean;
  };
  const availableItems: Row[] = [];
  const missingItems: Row[] = []; // to buy
  const stapleItems: Row[] = []; // pantry items not ticked: just a reminder

  scaledList.forEach((item) => {
    const ing = allIngredients.find((i) => i.id === item.ingredient_id);
    const subId = substituteOf.get(item.ingredient_id);
    const row: Row = {
      ing,
      quantity: item.quantity,
      unit: item.unit,
      isKey: missingKeySet.has(item.ingredient_id),
      substitute: subId ? allIngredients.find((i) => i.id === subId) : undefined,
      optional: item.is_optional,
    };
    if (matchedSet.has(item.ingredient_id)) availableItems.push(row);
    else if (missingStapleSet.has(item.ingredient_id)) stapleItems.push(row);
    else if (!item.is_optional) missingItems.push(row);
  });

  const handleShareWhatsApp = () => {
    const ingList = scaledList
      .map((item) => {
        const ing = allIngredients.find((i) => i.id === item.ingredient_id);
        const ingName = ing ? getIngredientName(ing) : item.ingredient_id;
        return `• ${item.quantity} ${item.unit} ${ingName}`;
      })
      .join('\n');

    const tipBlock = tip ? `💡 *Astuce Tounsiya :*\n${tip}\n\n` : '';
    const message = `🇹🇳 *Recette Chnowa Ntayeb : ${name}*${otherNames ? ` (${otherNames})` : ''}\n⏱ Temps : ${
      recipe.prep_time_minutes + recipe.cook_time_minutes
    } min | 💰 Budget : ~${recipe.estimated_cost_tnd} DT | 👥 ${servings} personnes\n\n🛒 *Ingrédients :*\n${ingList}\n\n${tipBlock}👩‍🍳 Recette Chnowa Ntayeb, by Chef Souhed\n📱 Découvre plus d'idées repas sur Chnowa Ntayeb !`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleAddMissing = () => {
    const toAdd = missingItems.map((item) => ({
      name: item.ing ? getIngredientName(item.ing) : 'Ingrédient',
      quantity: item.quantity,
      unit: item.unit,
    }));
    onAddMissingToGrocery(toAdd);
    setAddedGroceryToast(true);
    setTimeout(() => setAddedGroceryToast(false), 3000);
  };

  return (
    <ModalShell mobile="full" onDismiss={onClose}>
      <div className="w-full max-w-2xl bg-surface sm:rounded-3xl border border-line shadow-2xl overflow-hidden h-dvh sm:h-auto sm:max-h-[92vh] flex flex-col text-ink">
        {/* Header Photo & Controls */}
        <div className="relative aspect-16/9 max-h-[38vh] w-full bg-slate-900 shrink-0">
          <div className="absolute inset-0 flex items-start justify-center pt-16 bg-gradient-to-br from-brand-strong via-brand to-accent">
            <img src="/mark.png" alt="" width={188} height={80} className="h-20 w-auto opacity-90" />
          </div>
          {recipe.image_url && (
            <img
              src={recipe.image_url}
              alt={name}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" />

          {/* Close & Action buttons */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(recipe.id)}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="p-2 rounded-full bg-[#25D366] text-white hover:brightness-110 shadow-md transition"
                title="Partager sur WhatsApp"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Title on Photo */}
          <div className="absolute bottom-4 left-4 right-4">
            <RecipeBadges recipe={recipe} size="md" className="mb-2" />
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white leading-tight">{name}</h2>
            {otherNames && <p className="text-xs sm:text-sm text-amber-200 font-semibold mt-0.5">{otherNames}</p>}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-6">
          {/* Key Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-card border border-line text-center">
            <div className="flex flex-col items-center justify-center p-1">
              <Clock className="w-4 h-4 text-brand-text mb-1" />
              <span className="text-[11px] text-slate-400">{t.totalTime}</span>
              <span className="text-sm font-bold text-ink">
                {recipe.prep_time_minutes + recipe.cook_time_minutes} min
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-1 border-x border-slate-100 dark:border-slate-700">
              <Coins className="w-4 h-4 text-accent-text mb-1" />
              <span className="text-[11px] text-slate-400">{t.costEstimate}</span>
              <span className="text-sm font-bold text-accent-text">{recipe.estimated_cost_tnd.toFixed(1)} DT</span>
            </div>

            <div className="flex flex-col items-center justify-center p-1">
              <Users className="w-4 h-4 text-highlight mb-1" />
              <span className="text-[11px] text-slate-400">{t.servings}</span>
              {/* Serving Scalar Controls */}
              <div className="inline-flex items-center gap-1.5 mt-0.5">
                <button
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-200"
                >
                  -
                </button>
                <span className="text-sm font-bold text-ink w-4">{servings}</span>
                <button
                  onClick={() => setServings((s) => Math.min(12, s + 1))}
                  className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          {desc && <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{desc}</p>}

          {/* Ingredients Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                {t.ingredientsTitle} ({scaledList.length})
              </h3>
              {missingItems.length > 0 && (
                <button
                  onClick={handleAddMissing}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-text hover:underline"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Ajouter manquants aux courses</span>
                </button>
              )}
            </div>

            {addedGroceryToast && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Les ingrédients manquants ont été ajoutés à votre liste de courses !</span>
              </div>
            )}

            {/* Available Ingredients */}
            {availableItems.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-brand-text flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {t.availableIngredients} ({availableItems.length})
                  </span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {availableItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-1.5 pe-2.5 rounded-xl bg-brand/10 border border-brand/20 text-xs"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {item.ing && <IngredientThumb ingredient={item.substitute ?? item.ing} size="sm" />}
                        <span className="font-medium text-slate-800 dark:text-slate-200 min-w-0">
                          {item.ing ? getIngredientName(item.ing) : ''}
                          {item.substitute && (
                            <span className="block text-[10px] font-normal text-ink-muted">
                              → avec {getIngredientName(item.substitute)} à la place
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="font-bold text-brand-text shrink-0">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Ingredients */}
            {missingItems.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-xs font-semibold text-accent-text flex items-center gap-1.5">
                  <Circle className="w-3.5 h-3.5" />
                  <span>
                    {t.missingIngredients} ({missingItems.length})
                  </span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {missingItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-1.5 pe-2.5 rounded-xl bg-accent/10 border border-accent/20 text-xs"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {item.ing && <IngredientThumb ingredient={item.ing} size="sm" />}
                        <span className="font-medium text-slate-800 dark:text-slate-200 min-w-0">
                          {item.ing ? getIngredientName(item.ing) : ''}
                          {item.isKey && (
                            <span className="ms-1.5 px-1.5 py-0.5 rounded bg-accent text-on-accent text-[9px] font-bold uppercase">
                              clé
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="font-bold text-accent-text shrink-0">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
                {analysis.missingCost.max > 0 && (
                  <p className="text-[11px] text-ink-muted">
                    {t.groceryCost.replace('{n}', formatPriceRange(analysis.missingCost, t.currency))}
                  </p>
                )}
              </div>
            )}

            {/* Pantry reminders (never block the recipe) */}
            {stapleItems.length > 0 && (
              <p className="pt-1 text-[11px] text-ink-muted">
                Pense aussi à :{' '}
                {stapleItems
                  .map((s) => (s.ing ? getIngredientName(s.ing) : ''))
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>

          {/* How-to video (YouTube), only when the recipe has one */}
          <RecipeVideo key={recipe.id} url={recipe.video_url} title={name} />

          {/* Cooking Steps */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-brand-text" />
              <span>{t.stepsTitle}</span>
            </h3>

            <div className="space-y-3">
              {recipe.steps.map((step) => {
                const instruction = getStepText(step);
                return (
                  <div
                    key={step.step_number}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-slate-200/80 dark:border-slate-700/80"
                  >
                    <div className="w-6 h-6 rounded-full bg-brand text-on-brand flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {step.step_number}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                      {instruction}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Astuce Tounsiya */}
          {tip && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1">
                  {t.chefTipTitle}
                </h4>
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 italic">« {tip} »</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer WhatsApp Button */}
        <div className="p-4 border-t border-line bg-card flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-3 px-4 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:brightness-105 active:scale-98 transition flex items-center justify-center gap-2 shadow-md"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.shareWhatsApp}</span>
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
