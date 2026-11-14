import { fetchChanges, type ChangesPayload } from './dataApi';

/**
 * One shared poller for every followed collection: a single POST /api/data/changes per tick
 * carries all the revisions the device knows, and the server answers only the late ones
 * (the watermark makes an up-to-date client cost zero database reads). Ticks: every minute
 * by default (configurable in the backoffice, served by /api/settings/polling) while the
 * tab is visible, on window focus, and right after a write of this device.
 */

export const DEFAULT_POLL_INTERVAL_MS = 60 * 1000;

interface Followed {
  /** Newest revision the device applied for this collection (0 = never read) */
  revision: number;
  /** True until the first full read (since === null) is fully delivered */
  initialFullPending: boolean;
  /** True when the first full read needed several pages (the merge already rebuilt it all) */
  sawMore: boolean;
  onChanges: (changes: { items: unknown[]; removedIds: string[]; revision: number; complete: boolean }) => void;
  onError: () => void;
}

export class DataPoller {
  private followed = new Map<string, Followed>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private intervalMs = DEFAULT_POLL_INTERVAL_MS;
  private busy = false;
  /** A refresh asked while a tick runs: one more poll happens right after (never lost). */
  private queued = false;

  /** Applies the interval configured in the backoffice (the next ticks use it). */
  setIntervalMs(ms: number): void {
    if (!Number.isFinite(ms) || ms < 5_000 || ms > 15 * 60_000) return;
    this.intervalMs = ms;
    if (this.timer) {
      this.stopTimer();
      this.ensureTimer();
    }
  }

  /** Registers a collection (a re-follow with `since: null` reads everything again). */
  follow(name: string, since: number | null, onChanges: Followed['onChanges'], onError: Followed['onError']): void {
    this.followed.set(name, {
      revision: since ?? 0,
      initialFullPending: since === null,
      sawMore: false,
      onChanges,
      onError,
    });
    this.ensureTimer();
    // A first follow answers at once: the screen does not wait a minute for its data
    void this.tick();
  }

  stop(name: string): void {
    this.followed.delete(name);
    if (!this.followed.size) this.stopTimer();
  }

  /** Polls right away (after a write, on focus, on tab visible). */
  refresh(): void {
    if (this.followed.size) void this.tick();
  }

  /** Re-checks the visibility listeners: called once from the container at startup. */
  static installLifecycle(poller: DataPoller): () => void {
    const onVisible = () => {
      if (document.visibilityState === 'visible') poller.refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }

  private ensureTimer(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') void this.tick();
    }, this.intervalMs);
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    if (!this.followed.size || this.busy) {
      if (this.busy) this.queued = true; // the running tick polls again right after
      return;
    }
    this.busy = true;
    try {
      do {
        this.queued = false;
        await this.poll();
      } while (this.queued && this.followed.size);
    } finally {
      this.busy = false;
    }
  }

  private async poll(): Promise<void> {
    if (!this.followed.size) return;
    const rev: Record<string, number> = {};
    for (const [name, f] of this.followed) rev[name] = f.revision;
    const deltas = await fetchChanges(rev);
    if (!deltas) {
      // Offline or server asleep: the device copy keeps serving, the next tick retries
      for (const f of this.followed.values()) f.onError();
      return;
    }
    for (const [name, delta] of Object.entries(deltas)) {
      const f = this.followed.get(name);
      if (!f) continue;
      this.deliver(name, f, delta);
    }
    // A collection the server skipped (watermark says it is up to date, or it is empty) has
    // nothing more to give: the pending first full read ends right here.
    for (const [name, f] of this.followed) {
      if (f.initialFullPending && !deltas[name]) {
        f.initialFullPending = false;
        f.onChanges({ items: [], removedIds: [], revision: f.revision, complete: true });
      }
    }
    // A bounded answer (big catalog, first read) is caught up immediately, page by page
    const late = [...this.followed.keys()].filter((name) => deltas[name]?.more);
    if (late.length) await this.poll();
  }

  private deliver(name: string, f: Followed, delta: ChangesPayload): void {
    const untouched = delta.revision <= f.revision && delta.items.length === 0 && delta.removedIds.length === 0;
    if (untouched && !f.initialFullPending) return;
    // `complete` replaces the whole collection: only a single-page first read may claim it.
    // A multi-page first read arrives as merges (its deletion markers rebuild the exact state).
    if (delta.more === true) f.sawMore = true;
    const complete = f.initialFullPending && delta.more !== true && !f.sawMore;
    if (delta.more !== true) f.initialFullPending = false;
    if (delta.revision > f.revision) f.revision = delta.revision;
    f.onChanges({ items: delta.items, removedIds: delta.removedIds, revision: delta.revision, complete });
  }
}

/** The one poller of the page (collections register in the container). */
export const dataPoller = new DataPoller();
