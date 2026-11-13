import { lazy, Suspense } from 'react';
import { matchPath, Navigate, Route, Routes, useLocation, type Location, useParams } from 'react-router';
import { LEGACY_PATHS, LEGACY_RECIPE_PREFIX, PATHS } from '@/shared/paths';
import { HomePage } from '@/features/home/HomePage';
import { FridgePage } from '@/features/fridge/FridgePage';
import { RecipesPage } from '@/features/recipes/RecipesPage';
import { SuggestionsPage } from '@/features/suggestions/SuggestionsPage';
import { RecipeDetailRoute } from '@/features/recipes/RecipeDetailRoute';
import type { RecipeOverlayState } from '@/features/recipes/hooks';
import { PlannerPage } from '@/features/planner/PlannerPage';
import { GroceryPage } from '@/features/grocery/GroceryPage';
import { AppLayout } from './AppLayout';

// The backoffice (and its editors) is only downloaded by the admin
const BackofficePage = lazy(() => import('@/features/backoffice/BackofficePage'));

/**
 * One address per screen. A recipe (/recette/<slug>) is shown on top of the screen
 * it was opened from, or on top of the recipe list when its address is opened directly.
 */
/** Old French recipe address: navigates to its English replacement, slug kept. */
function LegacyRecipeRedirect() {
  const { slug } = useParams();
  return <Navigate to={PATHS.recipe.replace(':slug', slug ?? '')} replace />;
}

export function AppRoutes() {
  const location = useLocation();
  const recipeMatch = matchPath(PATHS.recipe, location.pathname);
  const background = (location.state as RecipeOverlayState | null)?.background;
  const pageLocation: Location | string = recipeMatch ? (background ?? PATHS.recipes) : location;

  // Old secret address of the backoffice
  if (location.hash === '#patron') return <Navigate to={PATHS.patron} replace />; // old bookmark

  return (
    <>
      <Routes location={pageLocation}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path={PATHS.fridge} element={<FridgePage />} />
          <Route path={PATHS.recipes} element={<RecipesPage />} />
          <Route path={PATHS.suggestions} element={<SuggestionsPage />} />
          <Route path={PATHS.planner} element={<PlannerPage />} />
          <Route path={PATHS.grocery} element={<GroceryPage />} />
          <Route
            path={`${PATHS.patron}/*`}
            element={
              <Suspense fallback={null}>
                <BackofficePage />
              </Suspense>
            }
          />
          {/* Addresses of the French era: navigate to their English replacement */}
          {Object.entries(LEGACY_PATHS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          <Route path={`${LEGACY_RECIPE_PREFIX}/:slug`} element={<LegacyRecipeRedirect />} />
          <Route path="*" element={<Navigate to={PATHS.home} replace />} />
        </Route>
      </Routes>
      {recipeMatch?.params.slug && <RecipeDetailRoute slug={recipeMatch.params.slug} />}
    </>
  );
}
