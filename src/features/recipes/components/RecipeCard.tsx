import React from 'react';
import { Clock, Heart, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { MatchingResult } from '@/core/matching';
import { Ingredient } from '@/core/catalog';
import { formatPriceRange } from '@/shared/i18n/formatPrice';
import { getRecipeCost } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { RecipeBadges } from '@/features/recipes/components/RecipeBadges';
import { parseYouTubeId } from '@/core/shared';
import { recipePath } from '@/shared/paths';

interface RecipeCardProps {
  result: MatchingResult;
  isFavorite: boolean;
  onToggleFavorite: (recipeId: string) => void;
  onSelectRecipe: (recipeId: string) => void;
  allIngredients: Ingredient[];
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  result,
  isFavorite,
  onToggleFavorite,
  onSelectRecipe,
  allIngredients,
}) => {
  const { recipe, score, tier, missing_ingredients, missing_key, substitutions, missing_cost } = result;
  const cost = getRecipeCost(recipe, allIngredients);
  const { t, language, getRecipeName, getIngredientName } = useLanguage();

  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
  const name = getRecipeName(recipe);
  // Derja name as a subtitle only when the title is in another language and says something else
  const derjaName = recipe.name_derja?.trim() ?? '';
  const derjaSubtitle = language !== 'derja' && derjaName !== name ? derjaName : '';

  const nameOf = (id: string) => {
    const ing = allIngredients.find((i) => i.id === id);
    return ing ? getIngredientName(ing) : '';
  };
  const keySet = new Set(missing_key);
  // Key ingredients are listed first (missing_ingredients is already ordered key → secondary)
  const missingList = missing_ingredients.slice(0, 3).map((id) => ({ id, name: nameOf(id), isKey: keySet.has(id) }));
  const firstSubstitution = substitutions[0];

  return (
    <div
      onClick={() => onSelectRecipe(recipe.id)}
      className="theme-card group relative flex flex-col bg-card rounded-2xl border border-line overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer text-left"
    >
      {/* Recipe Photo with Gradient Scrim and Fallback */}
      <div className="recipe-media relative aspect-4/3 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        {/* Fallback shown when the recipe has no photo yet or the photo cannot load */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-accent/15 to-highlight/20 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <img src="/mark.png" alt="" width={94} height={40} className="h-10 w-auto opacity-80" />
        </div>
        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={name}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {/* Video available */}
        {parseYouTubeId(recipe.video_url) && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold shadow-sm">
            <Play className="w-3 h-3 fill-current" />
            {t.videoBadge}
          </span>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(recipe.id);
          }}
          aria-label={isFavorite ? t.removeFromFavorites : t.addToFavorites}
          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-600 dark:text-slate-200 hover:text-rose-500 dark:hover:text-rose-400 shadow-sm transition active:scale-90"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'stroke-[2px]'}`} />
        </button>

        {/* Match Tier Badge */}
        <div className="absolute bottom-2.5 left-2.5">
          {tier === 'ready' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand text-on-brand text-[11px] font-bold shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.readyBadge}</span>
            </span>
          )}
          {tier === 'almost' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent text-on-accent text-[11px] font-bold shadow-md">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>
                {t.missingCountBadge.replace('{n}', String(missing_ingredients.length))}
                {missing_cost.max > 0 &&
                  ` · ${t.groceryCost.replace('{n}', formatPriceRange(missing_cost, t.currency))}`}
              </span>
            </span>
          )}
          {tier === 'ideas' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
              {missing_key.length > 0 ? `${t.missingKeyLabel} · ${score}%` : t.mealIdea}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <RecipeBadges recipe={recipe} className="mb-1.5" />
          {/* Unboxed Metadata (NO PILLS) */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{t.minutesValue.replace('{n}', String(totalTime))}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-bold text-accent-text">{formatPriceRange(cost, t.currency)}</span>
            <span aria-hidden="true">·</span>
            <span>{t.servingsShort.replace('{n}', String(recipe.base_servings))}</span>
          </div>

          {/* Dish Name */}
          <h3 className="font-display text-base font-bold text-ink leading-snug line-clamp-1 group-hover:text-brand-text transition-colors">
            {/* Real link for search engines; the click still opens the recipe in the app */}
            <a href={recipePath(recipe.slug)} onClick={(e) => e.preventDefault()} className="outline-none">
              {name}
            </a>
          </h3>

          {/* Derja subtitle when viewing in French or Arabic */}
          {derjaSubtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 italic">{derjaSubtitle}</p>
          )}
        </div>

        {/* Why this suggestion: what is missing (key ingredients highlighted) and substitutions used */}
        {(tier === 'almost' || (tier === 'ideas' && missing_ingredients.length > 0 && result.fridge_used > 0)) && (
          <p className="mt-2 text-[11px] text-accent-text font-medium line-clamp-2 bg-accent/10 px-2 py-1 rounded-md">
            {t.missingLabel} :{' '}
            {missingList.map((m, i) => (
              <React.Fragment key={m.id}>
                {i > 0 && ', '}
                <span className={m.isKey ? 'font-extrabold underline decoration-dotted' : ''}>{m.name}</span>
              </React.Fragment>
            ))}
            {missing_ingredients.length > missingList.length && ` +${missing_ingredients.length - missingList.length}`}
          </p>
        )}
        {firstSubstitution && tier !== 'ideas' && (
          <p className="mt-1.5 text-[11px] text-ink-muted line-clamp-1">
            ↺ {t.withSubstitute} {nameOf(firstSubstitution.substitute_id)} {t.insteadOf}{' '}
            {nameOf(firstSubstitution.ingredient_id)}
          </p>
        )}
      </div>
    </div>
  );
};
