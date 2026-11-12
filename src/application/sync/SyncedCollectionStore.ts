import { applyChanges, isDeletionMarker, latestRevision, type CollectionChanges, type Versioned } from '@/core/sync';
import type { LocalCollectionCache, RemoteChanges, SharedCollectionSource } from '../ports';
import { Store } from '../store';

export interface SyncedCollectionState<T> {
  items: T[];
  /** True once the device copy was read (or found missing) */
  loaded: boolean;
  /** True once the database answered (or was found unreachable) */
  synced: boolean;
}

export interface SyncedCollectionDeps<T extends Versioned> {
  source: SharedCollectionSource;
  cache: LocalCollectionCache<T>;
  /** Domain reading of raw entries (validation + migration): invalid ones are left out */
  read: (raw: readonly unknown[]) => T[];
  /** Built-in content, used until the database has answered for the first time */
  builtIn: () => T[];
  now: () => number;
  /**
   * A device copy older than this is read again in full instead of incrementally
   * (covers deletion markers purged from the database meanwhile).
   */
  fullRefreshAfterMs: number;
}

const NOOP = () => {};

/**
 * One shared collection (recipes, ingredients...), kept in sync with the database:
 * the device copy is shown first, then only the changes since its newest revision are
 * fetched, then every later change arrives live. Generic: every shared collection uses it.
 */
export class SyncedCollectionStore<T extends Versioned> extends Store<SyncedCollectionState<T>> {
  private revision: number | null = null;
  private stopFollowing: () => void = NOOP;
  private started = false;
  /** Writes to the device copy, chained so they apply in order */
  private saving: Promise<void> = Promise.resolve();

  constructor(private readonly deps: SyncedCollectionDeps<T>) {
    super({ items: deps.builtIn(), loaded: false, synced: false });
  }

  /** Reads the device copy, then follows the database. Returns the function that stops following. */
  start(): () => void {
    if (!this.started) {
      this.started = true;
      void this.loadThenFollow();
    }
    return () => this.stop();
  }

  /** Reads the whole collection again from the database (admin "reload from the cloud"). */
  refreshAll(): void {
    this.stopFollowing();
    this.revision = null;
    this.follow(null);
  }

  stop(): void {
    this.stopFollowing();
    this.stopFollowing = NOOP;
    this.started = false;
  }

  /** Change made on this device (admin edit), shown at once; the database confirms it later. */
  putLocal(item: T): void {
    this.applyLocal({ items: [item], removedIds: [] });
  }

  removeLocal(id: string): void {
    this.applyLocal({ items: [], removedIds: [id] });
  }

  /** Replaces the whole collection on this device (backup restored, reset to built-in). */
  replaceLocal(items: T[]): void {
    this.setState({ items });
    this.persist(() => this.deps.cache.replace({ items, revision: this.revision, savedAt: this.deps.now() }));
  }

  private applyLocal(changes: CollectionChanges<T>): void {
    this.setState((s) => ({ items: applyChanges(s.items, changes) }));
    this.persist(() => this.deps.cache.update(changes, { revision: this.revision, savedAt: this.deps.now() }));
  }

  private async loadThenFollow(): Promise<void> {
    const copy = await this.deps.cache.load().catch(() => null);
    if (!this.started) return;
    if (copy) {
      const items = this.deps.read(copy.items);
      const fresh = this.deps.now() - copy.savedAt < this.deps.fullRefreshAfterMs;
      this.revision = fresh ? copy.revision : null;
      // An empty copy is not a catalog: keep the built-in content until the database answers
      this.setState(items.length ? { items, loaded: true } : { loaded: true });
    } else this.setState({ loaded: true });
    this.follow(this.revision);
  }

  private follow(since: number | null): void {
    this.stopFollowing = this.deps.source.follow(
      since,
      (changes) => this.receive(changes),
      () => this.setState({ synced: true })
    );
  }

  private receive(raw: RemoteChanges): void {
    const markers = raw.items.filter(isDeletionMarker);
    const items = this.deps.read(raw.items.filter((x) => !isDeletionMarker(x)));
    this.revision = latestRevision([...items, ...markers], this.revision ?? 0);
    const meta = { revision: this.revision, savedAt: this.deps.now() };

    if (raw.complete) {
      // An empty database is not a catalog: keep what is shown (built-in content)
      if (items.length === 0) {
        this.setState({ synced: true });
        return;
      }
      this.setState({ items, synced: true });
      this.persist(() => this.deps.cache.replace({ items, ...meta }));
      return;
    }
    const changes: CollectionChanges<T> = { items, removedIds: [...raw.removedIds, ...markers.map((m) => m.id)] };
    this.setState((s) => ({ items: applyChanges(s.items, changes), synced: true }));
    if (changes.items.length || changes.removedIds.length) this.persist(() => this.deps.cache.update(changes, meta));
  }

  private persist(write: () => Promise<void>): void {
    // The device copy is only a convenience: a failed write must never break the screen
    this.saving = this.saving.then(write).catch(() => {});
  }

  /** Resolves once pending writes to the device copy are done (tests, before closing). */
  flush(): Promise<void> {
    return this.saving;
  }
}
