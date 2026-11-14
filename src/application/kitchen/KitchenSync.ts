import type { UserPreferences } from '@/core/preferences';
import type {
  KitchenSyncGateway,
  KitchenSyncLedger,
  PreferencesRepository,
  RemoteKitchenDocument,
  RemoteKitchenSections,
} from '../ports';
import { Store } from '../store';
import type { KitchenStore } from './KitchenStore';

/**
 * Sync of the personal kitchen data (fridge, favorites, pantry, weekly menu, shopping
 * list, food preferences) between this device and the account's document on the server.
 *
 * Local-first: the device always writes and renders from its own copy; the sync is an
 * invisible background. Cost ceiling (by design):
 *  - pushes are debounced 2 s (a burst of changes = one request) and flushed when the
 *    page goes to the background;
 *  - pulls happen at start-up, on sign-in and when the page becomes visible again, at
 *    most once a minute (a user switching tabs all day cannot burn database reads);
 *  - a push that failed stays pending and is retried on the next trigger only — no retry
 *    loop, and nothing is lost (the local copy always holds the data).
 *
 * Conflicts are resolved per section: favorites, fridge and pantry merge as unions
 * (nothing is ever lost between two devices); menu, list and preferences take the
 * newest write. The server enforces the same rule, so any push order converges.
 */

export interface KitchenSyncState {
  /** A pull or a push is in flight */
  syncing: boolean;
  /** Sections changed here and not confirmed by the server (0 = everything is on the cloud) */
  pending: number;
  /** Last confirmed pull (ms since epoch; null = never pulled) */
  lastPullAt: number | null;
  /** The last pull or push failed (kept pending; retried on the next trigger) */
  failed: boolean;
}

const PUSH_DEBOUNCE_MS = 2000;
const PULL_MIN_INTERVAL_MS = 60_000;

/** Sections merged as sets on adoption (a newer remote adds, it never removes). */
const SET_SECTIONS = ['favorites', 'fridge', 'pantry'] as const;

export interface KitchenSyncDeps {
  gateway: KitchenSyncGateway;
  kitchen: KitchenStore;
  preferences: PreferencesRepository;
  ledger: KitchenSyncLedger;
  /** uid of the signed-in client/employee account, null otherwise (guests never sync) */
  owner: () => string | null;
  now: () => number;
}

export class KitchenSync extends Store<KitchenSyncState> {
  private pushTimer: number | undefined;
  private lastPull = 0;
  private lastScope: string | null = null;
  /** True while applying data that came from the server: no push is scheduled for it */
  private applying = false;
  private onVisibility: () => void;
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly deps: KitchenSyncDeps) {
    super({ syncing: false, pending: 0, lastPullAt: null, failed: false });
    this.onVisibility = () => this.handleVisibility();
  }

  /** Follows the kitchen store and installs the page lifecycle. Called once at start-up. */
  start(): void {
    this.lastScope = this.deps.owner();
    this.unsubscribe = this.deps.kitchen.subscribe(() => this.onKitchenChanged());
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', this.onVisibility);
    this.updatePending();
    // Catch-up: sections pending from a previous run (crash, offline flush) go first
    void this.recover();
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pagehide', this.onVisibility);
    if (this.pushTimer !== undefined) {
      window.clearTimeout(this.pushTimer);
      this.pushTimer = undefined;
    }
  }

  /** Called on every sign-in / sign-out: reloads the state of the new scope and pulls the cloud. */
  onAccountChanged(): void {
    const scope = this.deps.owner();
    if (scope === this.lastScope) return;
    this.lastScope = scope;
    if (this.pushTimer !== undefined) {
      window.clearTimeout(this.pushTimer);
      this.pushTimer = undefined;
    }
    this.applying = true;
    this.deps.kitchen.reload();
    this.applying = false;
    this.lastPull = 0;
    this.updatePending();
    if (scope) void this.pullNow();
  }

  /** The preferences are saved outside the kitchen store; the container forwards their saves here. */
  notifyPreferencesChanged(): void {
    if (this.applying) return;
    this.schedulePush();
  }

  /** True when this device holds kitchen data (drives the account invitation). */
  hasLocalData(): boolean {
    return this.deps.ledger.hasData();
  }

  // --- internals ---

  private onKitchenChanged(): void {
    this.updatePending();
    if (this.applying) return;
    this.schedulePush();
  }

  private updatePending(): void {
    const pending = this.deps.ledger.pending().length + (this.preferencesPending() ? 1 : 0);
    if (this.getState().pending !== pending) this.setState({ pending });
  }

  private preferencesPending(): boolean {
    const changed = this.deps.ledger.preferencesChangedAt();
    if (changed === null) return false;
    return changed > (this.deps.ledger.preferencesSyncedAt() ?? 0);
  }

  private schedulePush(): void {
    if (!this.deps.owner() || this.pushTimer !== undefined) return;
    this.pushTimer = window.setTimeout(() => {
      this.pushTimer = undefined;
      void this.pushNow();
    }, PUSH_DEBOUNCE_MS);
  }

  /** Pushes what is pending, then adopts what the server kept (a newer section wins over ours). */
  private async pushNow(): Promise<void> {
    if (!this.deps.owner()) return;
    const pending = this.deps.ledger.pending();
    const preferencesPending = this.preferencesPending();
    const sections = this.pendingSections(pending, preferencesPending);
    if (!sections) {
      this.updatePending();
      return;
    }
    this.setState({ syncing: true });
    try {
      const doc = await this.deps.gateway.push(sections);
      this.deps.ledger.confirm(pending);
      if (preferencesPending) this.deps.ledger.confirmPreferences(this.deps.now());
      this.applyRemote(doc);
      this.setState({ syncing: false, failed: false });
    } catch {
      // Kept pending: retried on the next trigger (visibility, next change, next start)
      this.setState({ syncing: false, failed: true });
    }
    this.updatePending();
  }

  private pendingSections(pending: string[], preferencesPending: boolean): RemoteKitchenSections | null {
    const state = this.deps.kitchen.getState();
    const times = this.deps.ledger.sectionTimes();
    const now = this.deps.now();
    const sections: RemoteKitchenSections = {};
    const take = (name: keyof RemoteKitchenDocument, value: unknown) => {
      if (pending.includes(name)) sections[name] = { value, updatedAt: times[name] ?? now } as never;
    };
    take('favorites', state.favorites);
    take('fridge', state.fridge);
    take('pantry', state.pantry);
    take('weeklyPlan', state.weeklyPlan);
    take('groceryList', state.groceryList);
    take('groceryMeta', { note: state.groceryNote, spent_tnd: state.grocerySpent });
    if (preferencesPending) {
      // The pantry has its own section: it never travels inside the preferences
      const { pantryStaples: _pantry, ...preferences } = this.deps.preferences.load();
      sections.preferences = { value: preferences as UserPreferences, updatedAt: now };
    }
    return Object.keys(sections).length ? sections : null;
  }

  private async pullNow(): Promise<void> {
    if (!this.deps.owner()) return;
    if (this.lastPull !== 0 && this.deps.now() - this.lastPull < PULL_MIN_INTERVAL_MS) return;
    this.lastPull = this.deps.now();
    this.setState({ syncing: true });
    try {
      const doc = await this.deps.gateway.pull();
      if (doc) this.applyRemote(doc);
      this.setState({ syncing: false, failed: false, lastPullAt: this.lastPull });
    } catch {
      this.setState({ syncing: false, failed: true });
    }
  }

  private async recover(): Promise<void> {
    if (!this.deps.owner()) return;
    if (this.deps.ledger.pending().length || this.preferencesPending()) await this.pushNow();
    await this.pullNow();
  }

  /** Applies a document coming from the server: unions for sets, newest write for the rest. */
  private applyRemote(doc: RemoteKitchenDocument): void {
    this.applying = true;
    // Saves applied from the server are not changes made here: the ledger must not
    // mark them pending, or every device would echo its pull back to the server.
    const resume = this.deps.ledger.suspend();
    try {
      const times = this.deps.ledger.sectionTimes();
      const newer = (name: keyof RemoteKitchenDocument) => (doc[name]?.updatedAt ?? 0) > (times[name] ?? 0);
      if (doc.favorites && newer('favorites')) this.deps.kitchen.mergeFavorites(doc.favorites.value);
      if (doc.fridge && newer('fridge')) this.deps.kitchen.mergeFridge(doc.fridge.value);
      if (doc.pantry && newer('pantry')) this.deps.kitchen.mergePantry(doc.pantry.value);
      if (doc.weeklyPlan && newer('weeklyPlan')) this.deps.kitchen.setWeeklyPlan(doc.weeklyPlan.value);
      if (doc.groceryList && newer('groceryList')) this.deps.kitchen.setGroceryList(doc.groceryList.value);
      if (doc.groceryMeta && newer('groceryMeta')) {
        this.deps.kitchen.setGroceryMeta(doc.groceryMeta.value.note ?? '', doc.groceryMeta.value.spent_tnd ?? null);
      }
      if (doc.preferences && newer('preferences')) {
        const { pantryStaples: _pantry, ...preferences } = doc.preferences.value;
        this.deps.preferences.save(preferences as Partial<UserPreferences>, doc.preferences.updatedAt);
      }
      for (const name of [...SET_SECTIONS, 'weeklyPlan', 'groceryList', 'groceryMeta', 'preferences'] as const) {
        if (doc[name]) this.deps.ledger.setSectionTime(name, doc[name]!.updatedAt);
      }
    } finally {
      resume();
      this.applying = false;
    }
    this.updatePending();
  }

  private handleVisibility(): void {
    if (!this.deps.owner()) return;
    if (document.visibilityState === 'hidden') {
      // The page goes to sleep: send what is waiting now (nothing is lost on a tab close)
      if (this.pushTimer !== undefined) {
        window.clearTimeout(this.pushTimer);
        this.pushTimer = undefined;
        void this.pushNow();
      }
      return;
    }
    // Back on the page: pick up what the other devices changed (at most once a minute)
    if (this.deps.now() - this.lastPull >= PULL_MIN_INTERVAL_MS) void this.pullNow();
  }
}
