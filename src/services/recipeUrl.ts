/**
 * Public addresses of the app, also rendered by the server for search engines (server/seo.ts):
 *   /recettes          the recipe list
 *   /recette/<slug>    one recipe
 */

export type InitialRoute = { kind: 'recipe'; slug: string } | { kind: 'recipes' } | null;

export function parseRoute(pathname: string): InitialRoute {
  const m = pathname.match(/^\/recette\/([a-z0-9-]+)\/?$/);
  if (m) return { kind: 'recipe', slug: m[1] };
  if (/^\/recettes\/?$/.test(pathname)) return { kind: 'recipes' };
  return null;
}

export function recipeUrl(slug: string): string {
  return `/recette/${slug}`;
}

/**
 * Reads the address the app was opened with, then puts "/" in that first history entry.
 * The back-button guard (hooks/useBackNavigation) is pushed on top of it afterwards, and the
 * recipe address is only shown while the recipe is open, so going back never lands on a
 * "/recette/..." address with the recipe closed.
 */
let initialRoute: InitialRoute | undefined;

export function takeInitialRoute(): InitialRoute {
  if (typeof window === 'undefined') return null;
  // Idempotent: React may call state initializers twice (StrictMode)
  if (initialRoute !== undefined) return initialRoute;
  initialRoute = parseRoute(window.location.pathname);
  if (initialRoute) window.history.replaceState(window.history.state, '', '/' + window.location.search);
  return initialRoute;
}

/** Shows the open recipe's address (and title) without adding a history entry. */
export function showRecipeAddress(slug: string | null, title: string | null, defaultTitle: string): void {
  const target = slug ? recipeUrl(slug) : '/';
  if (window.location.pathname === '/patron') return; // the backoffice keeps its own address
  if (window.location.pathname !== target) {
    window.history.replaceState(window.history.state, '', target + window.location.search);
  }
  document.title = title ?? defaultTitle;
}
