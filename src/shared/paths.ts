/**
 * Public addresses of the app (one per screen). Shared by the client router and the
 * server (server/seo.ts renders every public address for robots: add a new one to its SCREENS table).
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

/**
 * Pages of the backoffice, under /patron (one address per page, so back and reload keep it).
 * The routes themselves are declared by the backoffice section registry.
 */
export const PATRON_PAGES = {
  home: '',
  recipes: 'recettes',
  ingredients: 'ingredients',
  engine: 'moteur',
  appearance: 'apparence',
  data: 'donnees',
} as const;

/** Sub-pages of /patron/moteur. */
export const ENGINE_PAGES = {
  simulator: 'simulateur',
  scenarios: 'scenarios',
  boosts: 'mises-en-avant',
  substitutions: 'remplacements',
  tuning: 'reglages',
  history: 'historique',
} as const;

export type PatronPage = (typeof PATRON_PAGES)[keyof typeof PATRON_PAGES];

/** Address of a backoffice page (and sub-page): patronPath('moteur', 'scenarios') = /patron/moteur/scenarios. */
export function patronPath(page: PatronPage = PATRON_PAGES.home, subPage?: string): string {
  return [PATHS.patron, page, subPage].filter(Boolean).join('/');
}

export function isPatronPath(pathname: string): boolean {
  return pathname === PATHS.patron || pathname.startsWith(`${PATHS.patron}/`);
}

/** The two recipe list screens: the whole catalog and the suggestions for the fridge. */
export type RecipeListPath = typeof PATHS.recipes | typeof PATHS.suggestions;

export function isRecipeListPath(pathname: string): pathname is RecipeListPath {
  return pathname === PATHS.recipes || pathname === PATHS.suggestions;
}

export function recipePath(slug: string): string {
  return `/recette/${slug}`;
}
