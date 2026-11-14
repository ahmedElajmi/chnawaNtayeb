/**
 * Public addresses of the app (one per screen). Shared by the client router and the
 * server (server/seo.ts renders every public address for robots: add a new one to its SCREENS table).
 */
export const PATHS = {
  home: '/',
  fridge: '/fridge',
  recipes: '/recipes',
  suggestions: '/suggestions',
  recipe: '/recipe/:slug',
  planner: '/planner',
  grocery: '/grocery',
  backoffice: '/admin',
} as const;

/**
 * Public addresses before the English rename. The server answers them with a permanent
 * redirect (SEO transfer) and the router navigates to the new address; one entry per
 * renamed page — a path is NEVER written in full anywhere else (paths.ts + this map only).
 */
export const LEGACY_PATHS: Readonly<Record<string, string>> = {
  '/frigo': PATHS.fridge,
  '/recettes': PATHS.recipes,
  '/semaine': PATHS.planner,
  '/courses': PATHS.grocery,
};

/** Prefix of the recipe addresses of the French era (redirected with their slug). */
export const LEGACY_RECIPE_PREFIX = '/recette';

/**
 * Pages of the backoffice, under /admin (one address per page, so back and reload keep it).
 * The routes themselves are declared by the backoffice section registry.
 */
export const BACKOFFICE_PAGES = {
  home: '',
  review: 'a-valider',
  recipes: 'recettes',
  ingredients: 'ingredients',
  engine: 'moteur',
  appearance: 'apparence',
  data: 'donnees',
  workflows: 'workflows',
  categories: 'categories',
  team: 'equipe',
  clients: 'clients',
  security: 'securite',
} as const;

/** Sub-pages of /admin/categories (one tree per kind of content). */
export const CATEGORY_PAGES = {
  recipes: 'recettes',
  ingredients: 'ingredients',
} as const;

/** Sub-pages of /admin/clients. */
export const CLIENTS_PAGES = {
  directory: 'accounts',
  countries: 'countries',
} as const;

/** Sub-pages of /admin/workflows. */
export const WORKFLOW_PAGES = {
  steps: 'steps',
  roles: 'roles',
} as const;

/** Filter of a backoffice list given in its address (`?filtre=to_fix`), so the home page can link to it. */
export const LIST_FILTER_PARAM = 'filtre';

/** Sub-pages of /admin/moteur. */
export const ENGINE_PAGES = {
  simulator: 'simulateur',
  scenarios: 'scenarios',
  boosts: 'mises-en-avant',
  substitutions: 'remplacements',
  tuning: 'reglages',
  history: 'historique',
} as const;

export type BackofficePageId = (typeof BACKOFFICE_PAGES)[keyof typeof BACKOFFICE_PAGES];

/** Address of a backoffice page (and sub-page): backofficePath('engine', 'scenarios') = /admin/engine/scenarios. */
export function backofficePath(page: BackofficePageId = BACKOFFICE_PAGES.home, subPage?: string): string {
  return [PATHS.backoffice, page, subPage].filter(Boolean).join('/');
}

export function isBackofficePath(pathname: string): boolean {
  return pathname === PATHS.backoffice || pathname.startsWith(`${PATHS.backoffice}/`);
}

/** The two recipe list screens: the whole catalog and the suggestions for the fridge. */
export type RecipeListPath = typeof PATHS.recipes | typeof PATHS.suggestions;

export function isRecipeListPath(pathname: string): pathname is RecipeListPath {
  return pathname === PATHS.recipes || pathname === PATHS.suggestions;
}

export function recipePath(slug: string): string {
  return PATHS.recipe.replace(':slug', slug);
}
