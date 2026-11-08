import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { Store } from '@/application';
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

export const usePatron = () => {
  const { patron } = useContainer();
  return { ...useStore(patron), patron };
};
