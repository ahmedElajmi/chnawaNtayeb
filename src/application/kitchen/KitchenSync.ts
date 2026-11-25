import type { UserPreferences } from '@/core/preferences';
import { SET_SECTIONS, isStaleDevice } from '@/core/kitchen';
import type {
  HostLifecycle,
  KitchenSyncGateway,
  KitchenSyncLedger,
  PreferencesRepository,
  RemoteKitchenDocument,
  RemoteKitchenSections,
  UnsyncedOfflineChanges,
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
 * Conflicts are resolved per section: favorites, fridge and pantry merge as element sets
 * (adds and deletions both propagate, through per-element versions — @/core/kitchen); menu,
 * list and preferences take the newest write. The server enforces the same rule, so any push
 * order converges. A device that has not synced within the tombstone retention resets itself
 * and re-adopts the server document — its stale pushes could resurrect purged deletions.
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
  /** The server signaled a protocol reconciliation on the LAST pull (client-side marker,
   * idempotent — never a device registry, a durable proof, nor a server-side state). */
  reconciliationRequired: boolean;
  /** True once this device archived offline changes it could not push (lot F1 D3, P1: a
   * device stale beyond the reset margin never pushes before its reset — the refused
   * changes are archived locally instead, never silently lost, never re-emitted and
   * never presented as synced). Reset when the account changes. */
  offlineChangesArchived: boolean;
}

const PUSH_DEBOUNCE_MS = 2000;
const PULL_MIN_INTERVAL_MS = 60_000;

export interface KitchenSyncDeps {
  gateway: KitchenSyncGateway;
  kitchen: KitchenStore;
  preferences: PreferencesRepository;
  ledger: KitchenSyncLedger;
  /** uid of the signed-in client/employee account, null otherwise (guests never sync) */
  owner: () => string | null;
  now: () => number;
  /** Timers and page-visibility notifications, injected (browser adapter wired in the container) */
  host: HostLifecycle;
}

export class KitchenSync extends Store<KitchenSyncState> {
  private cancelPush: (() => void) | null = null;
  private lastPull = 0;
  private lastScope: string | null = null;
  /** True while applying data that came from the server: no push is scheduled for it */
  private applying = false;
  private unsubscribeVisibility: (() => void) | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly deps: KitchenSyncDeps) {
    super({
      syncing: false,
      pending: 0,
      lastPullAt: null,
      failed: false,
      reconciliationRequired: false,
      offlineChangesArchived: false,
    });
  }

  /** Follows the kitchen store and installs the page lifecycle. Called once at start-up. */
  start(): void {
    this.lastScope = this.deps.owner();
    this.unsubscribe = this.deps.kitchen.subscribe(() => this.onKitchenChanged());
    this.unsubscribeVisibility = this.deps.host.subscribeVisibility(
      () => this.handleHidden(),
      () => this.handleVisible()
    );
    this.updatePending();
    // Lot F1 D3 (P1): the archive signal is restored from the persisted archive of this
    // scope — a reload (or a return to an old scope) re-shows what was not synced, without
    // any new synchronization and without re-emitting anything.
    this.setState({ offlineChangesArchived: this.deps.ledger.unsyncedArchive() !== null });
    // Catch-up: sections pending from a previous run (crash, offline flush) go first
    void this.recover();
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.unsubscribeVisibility?.();
    this.unsubscribeVisibility = null;
    this.cancelScheduledPush();
  }

  /** Called on every sign-in / sign-out: reloads the state of the new scope and pulls the cloud. */
  onAccountChanged(): void {
    const scope = this.deps.owner();
    if (scope === this.lastScope) return;
    this.lastScope = scope;
    this.cancelScheduledPush();
    this.applying = true;
    this.deps.kitchen.reload();
    this.applying = false;
    this.lastPull = 0;
    this.updatePending();
    // The new scope's own archive signal is restored from its persisted archive (the old
    // scope's archive is never deleted — it stays available locally, and coming back to
    // that scope restores its signal again).
    this.setState({
      syncing: false,
      offlineChangesArchived: this.deps.ledger.unsyncedArchive() !== null,
    });
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
    if (!this.deps.owner() || this.cancelPush) return;
    this.cancelPush = this.deps.host.defer(() => {
      this.cancelPush = null;
      void this.pushNow();
    }, PUSH_DEBOUNCE_MS);
  }

  /** Cancels the armed push, if any (page stop, account switch). The pending sections stay
   * pending: the next trigger (change, visibility, restart) sends them. */
  private cancelScheduledPush(): void {
    this.cancelPush?.();
    this.cancelPush = null;
  }

  /** Pushes what is pending, then adopts what the server kept (a newer section wins over ours). */
  private async pushNow(): Promise<void> {
    const uid = this.deps.owner();
    if (!uid) return;
    // Lot F1 D3 (chef decision AR-2, option P1): a device stale beyond the reset margin
    // never pushes its pending offline changes — an old deletion could resurrect a tombstone
    // the server already purged. The changes stay pending (never silently dropped) until
    // the recovery pull resets the state: the reset archives them first.
    if (this.stale()) {
      this.updatePending();
      return;
    }
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
      // The account may have changed while the request was in flight: the ledger now reads
      // the new account's document, so confirming or applying here would mix two accounts
      if (this.deps.owner() !== uid) return;
      this.deps.ledger.confirm(pending);
      if (preferencesPending) this.deps.ledger.confirmPreferences(this.deps.now());
      this.applyRemote(doc, uid);
      this.deps.ledger.recordSynced(this.deps.now());
      this.setState({ syncing: false, failed: false });
    } catch {
      if (this.deps.owner() !== uid) return;
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
      // A section time of 0 means "never written": the current clock is used instead (the
      // server refuses a section stamped 0, and a real write is not "never")
      if (pending.includes(name)) sections[name] = { value, updatedAt: times[name] || now } as never;
    };
    // The set sections travel as element sets (added/removed versions): the deletion of one
    // element propagates to the other devices instead of coming back from them
    if (pending.includes('favorites')) take('favorites', this.deps.kitchen.elementSet('favorites'));
    if (pending.includes('fridge')) take('fridge', this.deps.kitchen.elementSet('fridge'));
    if (pending.includes('pantry')) take('pantry', this.deps.kitchen.elementSet('pantry'));
    // Lot F1: the stock of entries travels as its own section (one canonical envelope per
    // entry id): additions AND deletions travel, and the server enforces the same merge.
    if (pending.includes('stock')) take('stock', this.deps.kitchen.stock());
    take('weeklyPlan', state.weeklyPlan);
    take('groceryLists', { lists: state.groceryLists, activeId: state.activeGroceryListId });
    if (preferencesPending) {
      // The pantry has its own section: it never travels inside the preferences
      const { pantryStaples: _pantry, ...preferences } = this.deps.preferences.load();
      sections.preferences = { value: preferences as UserPreferences, updatedAt: now };
    }
    return Object.keys(sections).length ? sections : null;
  }

  private async pullNow(): Promise<void> {
    const uid = this.deps.owner();
    if (!uid) return;
    if (this.lastPull !== 0 && this.deps.now() - this.lastPull < PULL_MIN_INTERVAL_MS) return;
    this.lastPull = this.deps.now();
    this.setState({ syncing: true });
    try {
      const { doc, reconciliationRequired } = await this.deps.gateway.pull();
      // The account may have changed while the request was in flight: this response belongs
      // to the old account and must not be written into the new account's local document
      if (this.deps.owner() !== uid) return;
      // A device that has not synced for longer than the tombstone retention resets itself:
      // its stale pushes could resurrect elements whose tombstone the server already purged.
      // The reset happens only once the fresh document is here (a failed pull wipes nothing)
      // and the merge below adopts it over the emptied state. Lot F1 D3 (P1): the refused
      // offline changes are archived BEFORE the wipe. The AR-2 guarantee is absolute: if the
      // archive could not be PERSISTED, the reset is ABORTED — the local state stays intact
      // and the device stays stale (a later pull retries the whole sequence).
      const lastSync = this.deps.ledger.lastSyncedAt();
      if (isStaleDevice(lastSync, this.deps.now())) {
        if (!this.archiveRefusedPending()) {
          this.setState({ syncing: false, failed: true });
          return;
        }
        this.deps.kitchen.resetLocal();
      }
      if (doc) this.applyRemote(doc, uid);
      this.deps.ledger.recordSynced(this.deps.now());
      // The signal is a per-pull marker, recorded idempotently; a pull without signal means
      // the protocol mismatch is resolved (updated client) — never a server-side proof
      this.setState({ syncing: false, failed: false, lastPullAt: this.lastPull, reconciliationRequired });
    } catch {
      if (this.deps.owner() !== uid) return;
      this.setState({ syncing: false, failed: true });
    }
  }

  private async recover(): Promise<void> {
    if (!this.deps.owner()) return;
    // Lot F1 D3 (P1): a stale device goes straight to the pull — the reset happens there,
    // and the refused offline changes are archived before the wipe (never pushed first).
    if (this.stale()) {
      await this.pullNow();
      return;
    }
    if (this.deps.ledger.pending().length || this.preferencesPending()) await this.pushNow();
    await this.pullNow();
  }

  /** The single staleness test (core rule, D3): a device whose last successful exchange is
   *  older than the reset margin. */
  private stale(): boolean {
    return isStaleDevice(this.deps.ledger.lastSyncedAt(), this.deps.now());
  }

  /** Archives the pending offline changes of a stale device right BEFORE the reset wipes
   *  the local state: the snapshot is the exact payload the device would have pushed
   *  (same shape as a sync push). Persisted in its own storage key — it survives the wipe,
   *  is never re-emitted automatically and is never presented as synced; the interface can
   *  read it (and discard it once the user has acted on it). Returns TRUE when the state
   *  is safe to wipe: either there was nothing pending (nothing would be lost) or the
   *  archive was confirmed persisted by the ledger. Returns FALSE when there WERE pending
   *  changes and the persistence FAILED — the caller must abort the wipe (AR-2: no silent
   *  loss), and the signal flag is NOT raised (nothing was actually archived). */
  private archiveRefusedPending(): boolean {
    const sections = this.pendingSections(this.deps.ledger.pending(), this.preferencesPending());
    if (!sections) return true; // a device in sync with no change loses nothing
    const snapshot: UnsyncedOfflineChanges = { archivedAt: this.deps.now(), sections };
    const persisted = this.deps.ledger.archiveUnsyncedChanges(snapshot);
    if (!persisted) return false;
    this.setState({ offlineChangesArchived: true });
    return true;
  }

  /** The archived offline changes of this scope, for the interface (lot F1 D3, P1). */
  unsyncedArchive(): UnsyncedOfflineChanges | null {
    return this.deps.ledger.unsyncedArchive();
  }

  /** Discards the archived offline changes once the user has acted on them (interface). */
  discardUnsyncedArchive(): void {
    this.deps.ledger.discardUnsyncedArchive();
    this.setState({ offlineChangesArchived: false });
  }

  /** Applies a document coming from the server: element sets for the set sections (adds and
   * deletions both travel), newest write for the rest. */
  private applyRemote(doc: RemoteKitchenDocument, uid: string): void {
    // Defense in depth: a caller that kept a stale response must not write into the
    // local document of whatever account is signed in now
    if (this.deps.owner() !== uid) return;
    this.applying = true;
    // Saves applied from the server are not changes made here: the ledger must not
    // mark them pending, or every device would echo its pull back to the server.
    const resume = this.deps.ledger.suspend();
    try {
      const times = this.deps.ledger.sectionTimes();
      const newer = (name: keyof RemoteKitchenDocument) => (doc[name]?.updatedAt ?? 0) > (times[name] ?? 0);
      // Lot F1: the server's stock section may carry OTHER devices' envelopes inside OUR own
      // section time (concurrent pushes land under one timestamp): the stock is adopted when
      // it is NOT OLDER than what we hold — the envelope merge is idempotent, so adopting our
      // own echo costs nothing and a device that pushed stale data still converges.
      const notOlder = (name: keyof RemoteKitchenDocument) => (doc[name]?.updatedAt ?? 0) >= (times[name] ?? 0);
      if (doc.favorites && newer('favorites')) this.deps.kitchen.mergeElementSet('favorites', doc.favorites.value);
      if (doc.fridge && newer('fridge')) this.deps.kitchen.mergeElementSet('fridge', doc.fridge.value);
      if (doc.pantry && newer('pantry')) this.deps.kitchen.mergeElementSet('pantry', doc.pantry.value);
      // Lot F1: the stock of entries travels as its own section; the envelopes reconcile by
      // HLC version (a deletion travels with its tombstone, an enriched entry is never
      // impoverished) and the visible lists are re-derived from the merged stock.
      if (doc.stock && notOlder('stock')) this.deps.kitchen.mergeStock(doc.stock.value);
      if (doc.weeklyPlan && newer('weeklyPlan')) this.deps.kitchen.setWeeklyPlan(doc.weeklyPlan.value);
      if (doc.groceryLists && newer('groceryLists')) {
        // The named lists travel as one section (newest write wins); a server document that
        // still holds only the legacy groceryList/groceryMeta sections has none here: the
        // local lists stay (they will be pushed up by the migration).
        this.deps.kitchen.setGroceryLists(doc.groceryLists.value.lists, doc.groceryLists.value.activeId);
      }
      if (doc.preferences && newer('preferences')) {
        const { pantryStaples: _pantry, ...preferences } = doc.preferences.value;
        this.deps.preferences.save(preferences as Partial<UserPreferences>, doc.preferences.updatedAt);
      }
      for (const name of [...SET_SECTIONS, 'stock', 'weeklyPlan', 'groceryLists', 'preferences'] as const) {
        if (doc[name]) this.deps.ledger.setSectionTime(name, doc[name]!.updatedAt);
      }
    } finally {
      resume();
      this.applying = false;
    }
    this.updatePending();
  }

  /** The page goes to the background or is parked in the back/forward cache: send what is
   * waiting now (nothing is lost on a tab close or a page swap). */
  private handleHidden(): void {
    if (!this.deps.owner() || !this.cancelPush) return;
    this.cancelScheduledPush();
    void this.pushNow();
  }

  /** Back on the page: pick up what the other devices changed (at most once a minute). */
  private handleVisible(): void {
    if (!this.deps.owner()) return;
    if (this.deps.now() - this.lastPull >= PULL_MIN_INTERVAL_MS) void this.pullNow();
  }
}
