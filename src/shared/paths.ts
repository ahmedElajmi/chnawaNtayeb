/**
 * Public addresses of the app (one per screen). Shared by the client router and the
 * server (server/seo.ts renders /, /recettes and /recette/<slug> for search engines).
 */
export const PATHS = {
  home: '/',
  fridge: '/frigo',
  recipes: '/recettes',
  suggestions: '/suggestions',
  recipe: '/recette/:slug',
  planner: '/semaine',
  grocery: '/courses',
  patron: '/patron',
} as const;

/** The two recipe list screens: the whole catalog and the suggestions for the fridge. */
export type RecipeListPath = typeof PATHS.recipes | typeof PATHS.suggestions;

export function isRecipeListPath(pathname: string): pathname is RecipeListPath {
  return pathname === PATHS.recipes || pathname === PATHS.suggestions;
}

export function recipePath(slug: string): string {
  return `/recette/${slug}`;
}
