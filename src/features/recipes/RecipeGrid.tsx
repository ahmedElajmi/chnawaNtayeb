import type { MatchingResult } from '@/core/matching';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';
import { useCatalog, useKitchen } from '@/app/ContainerContext';
import { useOpenRecipe } from './hooks';
import { useLanguage } from '@/app/providers/LanguageContext';
import { usePagedList } from '@/shared/hooks/usePagedList';
import { ShowMore } from '@/shared/ui/ShowMore';

/** Grid of recipe cards, wired to favorites and to the recipe page. */
export function RecipeGrid({ results, resetKey = '' }: { results: MatchingResult[]; resetKey?: string }) {
  const { ingredients } = useCatalog();
  const { favorites, kitchen } = useKitchen();
  const { t } = useLanguage();
  const openRecipe = useOpenRecipe();
  // Thousands of recipes: only the first pages are rendered (counters use the whole list)
  const page = usePagedList(results, resetKey);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {page.visible.map((res) => (
          <RecipeCard
            key={res.recipe.id}
            result={res}
            isFavorite={favorites.includes(res.recipe.id)}
            onToggleFavorite={(id) => kitchen.toggleFavorite(id)}
            onSelectRecipe={openRecipe}
            allIngredients={ingredients}
          />
        ))}
      </div>
      <ShowMore
        list={page}
        progressLabel={(shown, total) =>
          t.listProgress.replace('{shown}', String(shown)).replace('{total}', String(total))
        }
        buttonLabel={t.listShowMore}
      />
    </>
  );
}
