import { BookOpen, Refrigerator } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '@/app/providers/LanguageContext';
import { PATHS, type RecipeListPath } from '@/shared/paths';
import { useRecipesHref } from '../filterMemory';

interface RecipeListTabsProps {
  active: RecipeListPath;
  catalogCount: number;
  /** Null when the fridge is empty: the tab invites to fill it instead of showing a count */
  suggestionsCount: number | null;
}

/** Switch between the whole catalog and the fridge suggestions, keeping the filters. */
export function RecipeListTabs({ active, catalogCount, suggestionsCount }: RecipeListTabsProps) {
  const { t } = useLanguage();
  const catalogHref = useRecipesHref(PATHS.recipes);
  const suggestionsHref = useRecipesHref(PATHS.suggestions);

  const tabs = [
    { path: PATHS.recipes, to: catalogHref(), label: t.recipesAllTab, count: catalogCount, icon: BookOpen },
    {
      path: PATHS.suggestions,
      to: suggestionsHref(),
      label: t.recipesSuggestionsTab,
      count: suggestionsCount,
      icon: Refrigerator,
    },
  ] as const;

  return (
    <nav className="flex gap-1 p-1 rounded-2xl bg-card border border-line shadow-xs" aria-label={t.navRecipes}>
      {tabs.map(({ path, to, label, count, icon: Icon }) => {
        const isActive = path === active;
        return (
          <Link
            key={path}
            to={to}
            replace
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              isActive ? 'bg-brand text-on-brand shadow-xs' : 'text-ink-muted hover:bg-surface'
            }`}
          >
            <Icon className="hidden min-[360px]:block w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
            {count === null ? (
              <span
                className={`hidden min-[400px]:inline truncate font-medium ${isActive ? 'opacity-90' : 'opacity-70'}`}
              >
                · {t.fillFridgeHint}
              </span>
            ) : (
              <span className={`shrink-0 ${isActive ? 'opacity-90' : 'opacity-70'}`}>({count})</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
