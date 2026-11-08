import React from 'react';
import { Leaf, Zap } from 'lucide-react';
import { Recipe, isExpress, normalizeCategory } from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';

interface RecipeBadgesProps {
  recipe: Recipe;
  size?: 'sm' | 'md';
  className?: string;
}

/** Course (Entrée / Plat / Dessert), Healthy and Express labels of a recipe. */
export const RecipeBadges: React.FC<RecipeBadgesProps> = ({ recipe, size = 'sm', className = '' }) => {
  const { t } = useLanguage();
  const course = normalizeCategory(recipe.category);
  const courseLabel = course === 'entree' ? t.courseEntree : course === 'dessert' ? t.courseDessert : t.courseMain;
  const pill = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs';

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      <span
        className={`${pill} rounded-md font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200`}
      >
        {courseLabel}
      </span>
      {recipe.is_healthy && (
        <span
          className={`${pill} inline-flex items-center gap-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300`}
        >
          <Leaf className="w-3 h-3" />
          {t.healthyLabel}
        </span>
      )}
      {isExpress(recipe) && (
        <span className={`${pill} inline-flex items-center gap-0.5 rounded-md font-bold bg-highlight/15 text-ink`}>
          <Zap className="w-3 h-3 text-highlight" />
          {t.expressLabel}
        </span>
      )}
    </div>
  );
};
