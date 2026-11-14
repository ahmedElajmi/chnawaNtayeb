import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { ReviewStore, SearchKind, Store } from '@/application';
import type { ReviewKind } from '@/core/review';
import { enabledCountries } from '@/core/accounts';
import type { CategoryKind } from '@/core/categories';
import { recipeCostRange, type Ingredient, type PriceRange, type Recipe } from '@/core/catalog';
import { useLanguage } from './providers/LanguageContext';
import type { Container } from './container';

const ContainerContext = createContext<Container | null>(null);

export function ContainerProvider({ container, children }: { container: Container; children: ReactNode }) {
  return <ContainerContext.Provider value={container}>{children}</ContainerContext.Provider>;
}

/** Application services (stores), injected at the root so tests can provide fakes. */
export function useContainer(): Container {
  const container = useContext(ContainerContext);
  if (!container) throw new Error('useContainer must be used inside <ContainerProvider>');
  return container;
}

/** Subscribes a component to a store; it re-renders when the store state changes. */
export function useStore<S extends object>(store: Store<S>): S {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/** Shortcuts for the stores used by most screens. */
export const useCatalog = () => {
  const { catalog } = useContainer();
  return { ...useStore(catalog), catalog };
};

/** Managed categories of recipes or ingredients (list and tree), with their store for edits. */
export const useCategories = (kind: CategoryKind) => {
  const { categories } = useContainer();
  const store = categories[kind];
  return { ...useStore(store), store };
};

/**
 * Search results for a query (`id → relevance`), following catalog changes. `undefined` while there is
 * no query or no answer yet: the lists then keep their simple filtering.
 */
export function useSearchMatches(kind: SearchKind, query: string): ReadonlyMap<string, number> | undefined {
  const { search } = useContainer();
  const { revision } = useStore(search);
  const [answer, setAnswer] = useState<{ query: string; matches: ReadonlyMap<string, number> | null } | null>(null);
  const active = query.trim();
  useEffect(() => {
    if (!active) return;
    let current = true;
    search.search(kind, active).then((matches) => {
      if (current) setAnswer({ query: active, matches });
    });
    return () => {
      current = false;
    };
  }, [search, kind, active, revision]);
  return active && answer?.query === active && answer.matches ? answer.matches : undefined;
}

export const useKitchen = () => {
  const { kitchen } = useContainer();
  return { ...useStore(kitchen), kitchen };
};

export const useMatchingSettings = () => {
  const { matchingSettings } = useContainer();
  return { ...useStore(matchingSettings), matchingSettings };
};

/** Validation workflow of one kind of content (work copies and where each one stands). */
export const useReview = <K extends ReviewKind>(kind: K) => {
  const { review } = useContainer();
  const store = (kind === 'recipe' ? review.recipes : review.ingredients) as unknown as ReviewStore<K>;
  return { ...useStore(store), store };
};

/** The team (members and the member record of the signed-in account). */
export const useTeam = () => {
  const { team } = useContainer();
  return { ...useStore(team), team };
};

/** Countries users may pick (phone dial codes, address regions), in display-name order. */
export const useCountries = () => {
  const { countries } = useContainer();
  const { countries: list } = useStore(countries);
  const { language } = useLanguage();
  return { countries: list, enabled: enabledCountries(list, language), countriesStore: countries };
};

/** Profile of the signed-in account (name, phone, address, preferred language). */
export const useAccountProfile = () => {
  const { accountProfile } = useContainer();
  return { ...useStore(accountProfile), accountProfileStore: accountProfile };
};

/** Backoffice directory of every account (paged, searchable). */
export const useAccountDirectory = () => {
  const { accountDirectory } = useContainer();
  return useStore(accountDirectory);
};

/** Workflows and roles of the team. */
export const useReviewSettings = () => {
  const { review } = useContainer();
  return { ...useStore(review.settings), reviewSettings: review.settings };
};

export const useMatchingScenarios = () => {
  const { matchingScenarios } = useContainer();
  return { ...useStore(matchingScenarios), matchingScenarios };
};

export const useBackofficeSession = () => {
  const { backofficeSession } = useContainer();
  return { ...useStore(backofficeSession), backofficeSessionStore: backofficeSession };
};

// Recipe costs: computed once per version of a recipe and of the ingredient list, never at
// every render (lists may hold thousands of recipes). Keyed by object identity: a recipe or
// the ingredient list changes identity when it changes, so the cache follows live updates.
const costsByIngredientList = new WeakMap<
  Ingredient[],
  { byId: Map<string, Ingredient>; costs: WeakMap<Recipe, PriceRange> }
>();

function costCacheFor(ingredients: Ingredient[]) {
  let entry = costsByIngredientList.get(ingredients);
  if (!entry) {
    entry = { byId: new Map(ingredients.map((i) => [i.id, i])), costs: new WeakMap() };
    costsByIngredientList.set(ingredients, entry);
  }
  return entry;
}

/** Cost range of a recipe (from the ingredient price ranges), cached. */
export function getRecipeCost(recipe: Recipe, ingredients: Ingredient[]): PriceRange {
  const entry = costCacheFor(ingredients);
  let cost = entry.costs.get(recipe);
  if (!cost) {
    cost = recipeCostRange(recipe, entry.byId);
    entry.costs.set(recipe, cost);
  }
  return cost;
}

/** Cost range of a recipe for the screens, following live catalog updates. */
export function useRecipeCost(recipe: Recipe): PriceRange {
  const { ingredients } = useCatalog();
  return getRecipeCost(recipe, ingredients);
}
