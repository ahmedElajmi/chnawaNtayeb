export type Listener = () => void;

/**
 * Minimal observable state container, independent of any UI framework.
 * React reads it through `useStore` (useSyncExternalStore); another framework
 * would only need its own small binding around `subscribe` / `getState`.
 */
export abstract class Store<S extends object> {
  private listeners = new Set<Listener>();

  protected constructor(private state: S) {}

  readonly getState = (): S => this.state;

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  protected setState(patch: Partial<S> | ((state: S) => Partial<S>)): void {
    const next = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = { ...this.state, ...next };
    this.listeners.forEach((listener) => listener());
  }
}
