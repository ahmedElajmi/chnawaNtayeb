/**
 * Public addresses of the app (one per screen). Shared by the client router and the
 * server (server/seo.ts renders /, /recettes and /recette/<slug> for search engines).
 */
export const PATHS = {
  home: '/',
  fridge: '/frigo',
  recipes: '/recettes',
  recipe: '/recette/:slug',
  planner: '/semaine',
  grocery: '/courses',
  patron: '/patron',
} as const;

export function recipePath(slug: string): string {
  return `/recette/${slug}`;
}
