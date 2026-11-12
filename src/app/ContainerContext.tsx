import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { Store } from '@/application';
import { recipeCostRange, type Ingredient, type PriceRange, type Recipe } from '@/core/catalog';
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

export const useKitchen = () => {
  const { kitchen } = useContainer();
  return { ...useStore(kitchen), kitchen };
};

export const useMatchingSettings = () => {
  const { matchingSettings } = useContainer();
  return { ...useStore(matchingSettings), matchingSettings };
};

export const useMatchingScenarios = () => {
  const { matchingScenarios } = useContainer();
  return { ...useStore(matchingScenarios), matchingScenarios };
};

export const usePatron = () => {
  const { patron } = useContainer();
  return { ...useStore(patron), patron };
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
