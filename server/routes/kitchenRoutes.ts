import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  ELEMENT_SET_LIMITS,
  EMPTY_ELEMENT_SET,
  mergeElementSets,
  parseElementSet,
  parseTombstoneRetentionMs,
  purgeTombstones,
  SET_SECTIONS,
  TOMBSTONE_RETENTION_MS,
  wrapLegacyList,
  type ElementSet,
} from '../../src/core/kitchen';
import type { DataStore, WriteOp } from '../storage/types';
import type { BackofficeAuthConfig } from '../backofficeAuth';
import { verifyUserSessionToken } from '../auth/sessions';

/**
 * Personal kitchen data of one account (favorites, fridge, pantry, weekly menu, shopping
 * list, food preferences): one document per uid in the server-only `kitchen` collection.
 *
 * Guests never sync (their uid is ephemeral); clients and employees authenticate with
 * their session token. The write happens inside one transaction (`DataStore.transact`):
 * the merge runs over the stored state as it is at commit time, so two devices pushing at
 * once can never overwrite what they did not see. The three set sections (favorites, fridge,
 * pantry) merge element by element (@/core/kitchen): adds and deletions both travel through
 * per-element versions, and a deleted element never comes back from a device that still held
 * it. The tombstones (the `removed` entries) are dropped once older than the retention
 * window (`KITCHEN_TOMBSTONE_RETENTION_MS`, default 90 days, 0 = never purge) — a device
 * that has not synced within that window resets itself, so the purge stays safe.
 * The other sections keep newest-write-wins. One push = one read + one write, nothing more.
 *
 * The same session rules guard the archived grocery-run snapshots (`kitchen_history`
 * collection, one document per uid + entry id, capped per uid).
 */

const KITCHEN = 'kitchen';
const KITCHEN_HISTORY = 'kitchen_history';
const KITCHEN_HISTORY_INDEX = 'kitchen_history_index';

/** Sections are capped so no account can grow an unbounded document. The set-section caps
 * come from the shared core limits (`added` is the visible list cap). */
const MAX = {
  sets: ELEMENT_SET_LIMITS.added,
  grocery: 500,
  planDays: 14,
  lists: 20,
  listName: 80,
  listId: 100,
  note: 300,
} as const;

/**
 * Archived grocery-run snapshots: capped per account so no one can grow an unbounded
 * collection; the entry size itself stays bounded through the item count and the
 * comment / number field caps.
 */
const HISTORY = { entries: 50, items: 500, id: 100, comment: 300 } as const;

export interface KitchenSectionPayload {
  value: unknown;
  updated_at: number;
}

const asPlan = (raw: unknown): unknown[] | null =>
  Array.isArray(raw) && raw.length <= MAX.planDays && raw.every((d) => d && typeof d === 'object') ? raw : null;

const asGrocery = (raw: unknown): unknown[] | null =>
  Array.isArray(raw) && raw.length <= MAX.grocery && raw.every((i) => i && typeof i === 'object') ? raw : null;

const asPreferences = (raw: unknown): Record<string, unknown> | null =>
  raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;

/** Grocery metadata (legacy section, kept for one transition release): a free note and an
 *  optional spent amount (null = nothing spent yet). */
const asGroceryMeta = (raw: unknown): Record<string, unknown> | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const meta = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (meta.note !== undefined) {
    if (typeof meta.note !== 'string' || meta.note.length > MAX.note) return null;
    out.note = meta.note;
  }
  if (meta.spent_tnd !== undefined) {
    if (meta.spent_tnd !== null && (typeof meta.spent_tnd !== 'number' || !Number.isFinite(meta.spent_tnd))) {
      return null;
    }
    out.spent_tnd = meta.spent_tnd;
  }
  return out;
};

/**
 * The named shopping lists of the account, with the active one. Each list is capped like a
 * whole legacy list (500 items), its name is a trimmed non-empty string of at most 80
 * characters, its note is capped like the legacy groceryMeta note, and its spend is a finite
 * number or null. `activeId` must reference one of the lists.
 */
const asGroceryLists = (raw: unknown): { lists: Record<string, unknown>[]; activeId: string } | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const payload = raw as Record<string, unknown>;
  if (!Array.isArray(payload.lists) || payload.lists.length === 0 || payload.lists.length > MAX.lists) return null;
  const lists: Record<string, unknown>[] = [];
  for (const entry of payload.lists) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const list = entry as Record<string, unknown>;
    if (typeof list.id !== 'string' || list.id.length === 0 || list.id.length > MAX.listId) return null;
    if (typeof list.name !== 'string' || list.name.trim() === '' || list.name.trim().length > MAX.listName) {
      return null;
    }
    const items = asGrocery(list.items);
    if (items === null) return null;
    const validated: Record<string, unknown> = { id: list.id, name: list.name.trim(), items };
    if (list.note !== undefined) {
      if (typeof list.note !== 'string' || list.note.length > MAX.note) return null;
      validated.note = list.note;
    }
    if (list.spent_tnd !== undefined) {
      if (list.spent_tnd !== null && (typeof list.spent_tnd !== 'number' || !Number.isFinite(list.spent_tnd))) {
        return null;
      }
      validated.spent_tnd = list.spent_tnd;
    }
    lists.push(validated);
  }
  if (typeof payload.activeId !== 'string' || !lists.some((list) => list.id === payload.activeId)) return null;
  return { lists, activeId: payload.activeId };
};

/** Validates one section the client sent; null when malformed (refused, never stored). */
function readSection(name: string, raw: unknown): KitchenSectionPayload | null {
  const section = raw as { value?: unknown; updated_at?: unknown } | null;
  if (!section || typeof section !== 'object') return null;
  const updatedAt = section.updated_at;
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt) || updatedAt <= 0) return null;
  const value = section.value;
  let validated: unknown;
  switch (name) {
    case 'favorites':
    case 'fridge':
    case 'pantry':
      // The set sections travel as element sets (added/removed versions per id); the plain
      // id lists written before that shape existed are wrapped on the fly (migration).
      validated = Array.isArray(value) ? wrapLegacyList(value, updatedAt) : parseElementSet(value);
      break;
    case 'weeklyPlan':
      validated = asPlan(value);
      break;
    case 'groceryList':
      // Legacy single list, accepted for one transition release (ignored by the current client)
      validated = asGrocery(value);
      break;
    case 'groceryLists':
      validated = asGroceryLists(value);
      break;
    case 'preferences':
      validated = asPreferences(value);
      break;
    case 'groceryMeta':
      // Legacy metadata of the single list, accepted for one transition release
      validated = asGroceryMeta(value);
      break;
    default:
      return null;
  }
  if (validated === null) return null;
  return { value: validated, updated_at: updatedAt };
}

/** Per-section merge inside the transaction: element by element for the set sections (adds and
 * deletions both travel; tombstones beyond the retention are dropped), newest-write-wins for
 * the rest. Order-independent: two pushes in any order converge to the same document. */
function mergeSections(
  stored: Record<string, KitchenSectionPayload> | undefined,
  incoming: Record<string, KitchenSectionPayload>,
  retentionMs: number,
  now: number
): Record<string, KitchenSectionPayload> {
  const merged: Record<string, KitchenSectionPayload> = { ...stored };
  for (const [name, section] of Object.entries(incoming)) {
    const current = merged[name];
    if ((SET_SECTIONS as readonly string[]).includes(name)) {
      const storedSet = current ? readStoredSet(current.value, current.updated_at) : EMPTY_ELEMENT_SET;
      merged[name] = {
        value: purgeTombstones(mergeElementSets(storedSet, section.value as ElementSet), retentionMs, now),
        updated_at: Math.max(current?.updated_at ?? 0, section.updated_at),
      };
    } else if (!current || section.updated_at > (current.updated_at ?? 0)) {
      merged[name] = section;
    }
  }
  return merged;
}

/** A stored set section read back: element set through the core parser, legacy list wrapped. */
function readStoredSet(value: unknown, updatedAt: number): ElementSet {
  const parsed = Array.isArray(value) ? wrapLegacyList(value, updatedAt) : parseElementSet(value);
  return parsed ?? EMPTY_ELEMENT_SET;
}

/** ISO 8601 shapes the client actually sends (date + time, optional fraction and zone). */
const ISO_LIKE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

const timestampOf = (archivedAt: string): number => {
  const parsed = Date.parse(archivedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const archivedTimestamp = (doc: Record<string, unknown>): number => timestampOf(String(doc.archived_at ?? ''));

/**
 * Validates one archived grocery-run entry; null when malformed (refused, never stored).
 * The known fields are capped, everything else the client stored stays untouched.
 */
function readHistoryEntry(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const entry = raw as Record<string, unknown>;
  if (typeof entry.id !== 'string' || entry.id.length === 0 || entry.id.length > HISTORY.id) return null;
  if (
    typeof entry.archived_at !== 'string' ||
    !ISO_LIKE.test(entry.archived_at) ||
    Number.isNaN(Date.parse(entry.archived_at))
  ) {
    return null;
  }
  if (!Array.isArray(entry.items) || entry.items.length > HISTORY.items) return null;
  if (!entry.items.every((item) => item && typeof item === 'object' && !Array.isArray(item))) return null;
  if (entry.comment !== undefined && (typeof entry.comment !== 'string' || entry.comment.length > HISTORY.comment)) {
    return null;
  }
  for (const field of ['planned_cost_min', 'planned_cost_max', 'spent_tnd']) {
    const value = entry[field];
    if (value === undefined) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  }
  return { ...entry };
}

/** One entry of the per-account index: the id and the date it was archived (the eviction key). */
interface HistoryIndexEntry {
  id: string;
  archived_at: string;
}

/** The deterministic eviction order: archived_at first, then the id (an exact tie must not
 * depend on the arrival order). The index is stored oldest first. */
const olderFirst = (a: HistoryIndexEntry, b: HistoryIndexEntry): number => {
  const byDate = timestampOf(a.archived_at) - timestampOf(b.archived_at);
  if (byDate !== 0) return byDate;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};

/**
 * Reads the per-account index written by this route only. Null when absent or unreadable:
 * the caller rebuilds it from the stored entries instead of trusting a malformed one. The
 * index carries no authorization — the session check and the entry documents stay the guards.
 */
function readHistoryIndex(raw: unknown): { seq: number; entries: HistoryIndexEntry[] } | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const shape = raw as { seq?: unknown; entries?: unknown };
  if (typeof shape.seq !== 'number' || !Number.isInteger(shape.seq) || shape.seq < 0) return null;
  if (!Array.isArray(shape.entries) || shape.entries.length > HISTORY.entries) return null;
  const entries: HistoryIndexEntry[] = [];
  const seen = new Set<string>();
  for (const item of shape.entries) {
    const e = item as { id?: unknown; archived_at?: unknown };
    if (typeof e.id !== 'string' || e.id.length === 0 || e.id.length > HISTORY.id) return null;
    if (typeof e.archived_at !== 'string' || !ISO_LIKE.test(e.archived_at) || Number.isNaN(Date.parse(e.archived_at))) {
      return null;
    }
    if (seen.has(e.id)) return null;
    seen.add(e.id);
    entries.push({ id: e.id, archived_at: e.archived_at });
  }
  return { seq: shape.seq, entries };
}

/** Drops the wrapper fields the storage layer adds so the client sees its entry back. */
function stripHistoryWrapper(doc: Record<string, unknown>): Record<string, unknown> {
  const entry = { ...doc };
  const entryId = typeof entry.entry_id === 'string' ? entry.entry_id : undefined;
  delete entry.uid;
  delete entry.entry_id;
  delete entry.id; // the storage id (`uid:entry_id`) must not shadow the entry's own id
  delete entry.revision;
  delete entry.deleted;
  if (entryId !== undefined) entry.id = entryId;
  return entry;
}

export function kitchenRoutes(
  adminConfig: BackofficeAuthConfig,
  store: DataStore | null,
  options: { syncLimit?: number } = {}
): express.Router {
  const router = express.Router();

  // Legitimate sync stays far below this ceiling (a debounced push every couple of seconds
  // at the very worst); it only stops an abusive client from burning database reads.
  const syncLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: options.syncLimit ?? 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });

  /** Tombstone retention (ms), from the environment or the 90-day default; 0 = never purge. */
  const parsedRetention = parseTombstoneRetentionMs(process.env.KITCHEN_TOMBSTONE_RETENTION_MS);
  if (process.env.KITCHEN_TOMBSTONE_RETENTION_MS && parsedRetention === null) {
    console.warn(
      `Ignoring invalid KITCHEN_TOMBSTONE_RETENTION_MS (${process.env.KITCHEN_TOMBSTONE_RETENTION_MS}); using the 90-day default`
    );
  }
  const retentionMs = parsedRetention ?? TOMBSTONE_RETENTION_MS;

  const sessionOf = (req: express.Request) => {
    const header = req.headers.authorization;
    const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!adminConfig.ok || !token) return null;
    const session = verifyUserSessionToken(token, adminConfig.secret);
    // Guests keep their kitchen on the device: their uid is ephemeral, there is nothing to sync
    return session && (session.kind === 'client' || session.kind === 'employee') ? session : null;
  };
  const unavailable = (res: express.Response) => res.status(503).json({ ok: false, error: 'storage_unavailable' });

  router.get('/api/kitchen', syncLimiter, async (req, res) => {
    const session = sessionOf(req);
    if (!session) return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    if (!store) return unavailable(res);
    const doc = await store.get(KITCHEN, session.sub);
    return res.json({ ok: true, doc: doc && doc.deleted !== true ? doc : null });
  });

  router.put('/api/kitchen', syncLimiter, async (req, res) => {
    const session = sessionOf(req);
    if (!session) return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    if (!store) return unavailable(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (!body.sections || typeof body.sections !== 'object') {
      return res.status(400).json({ ok: false, error: 'invalid-input' });
    }
    const incoming: Record<string, KitchenSectionPayload> = {};
    for (const [name, raw] of Object.entries(body.sections as Record<string, unknown>)) {
      const section = readSection(name, raw);
      if (!section) return res.status(400).json({ ok: false, error: 'invalid-input' });
      incoming[name] = section;
    }
    // The read-merge-write is one transaction: a concurrent push can never be overwritten by
    // a merge computed from a state it had not seen (the operation is pure, a contended
    // backend re-runs it over the fresh state). `now` is computed once: the re-runs of the
    // operation (a contended backend) must stay reproducible.
    const now = Date.now();
    const updatedAt = new Date().toISOString();
    const sections = await store.transact(KITCHEN, session.sub, (current) => {
      const storedSections = current ? (current.sections as Record<string, KitchenSectionPayload>) : undefined;
      const merged = mergeSections(storedSections, incoming, retentionMs, now);
      return {
        next: { uid: session.sub, sections: merged, updated_at: updatedAt },
        result: merged,
      };
    });
    return res.json({ ok: true, doc: { uid: session.sub, sections } });
  });

  // Archived grocery-run snapshots: one document per uid + entry id, at most HISTORY.entries
  // per account. The per-account index (seq + entry ids and dates, oldest first) is updated in
  // the SAME commit as the entry writes, under the `seq` guard: the read-merge-write is atomic,
  // the cap is exact, and the eviction of the oldest entry (by archived_at, then id) can never
  // drift apart from the index. A contended commit (a concurrent archive) is retried from the
  // fresh index — the operations are rebuilt every attempt, never replayed as-is.
  const historyAttemptLimit = 4;

  /** Reads the account's index, rebuilding it from the stored entries when absent (a legacy
   * account) or unreadable: deterministic (archived_at then id), the HISTORY.entries newest kept
   * and the surplus evicted in the same commit. Guard expectation: null for a fresh index. */
  const historyIndexFor = async (
    uid: string
  ): Promise<{ expected: number | null; seq: number; entries: HistoryIndexEntry[]; surplus: string[] }> => {
    const index = readHistoryIndex(await store!.get(KITCHEN_HISTORY_INDEX, uid));
    if (index) return { expected: index.seq, seq: index.seq, entries: index.entries, surplus: [] };
    const docs = await store!.findWhere(KITCHEN_HISTORY, 'uid', uid, HISTORY.entries * 2);
    const all = docs
      .filter((d) => d.deleted !== true && typeof d.entry_id === 'string')
      .map((d) => ({ id: d.entry_id as string, archived_at: String(d.archived_at ?? '') }))
      .filter((e) => ISO_LIKE.test(e.archived_at) && !Number.isNaN(Date.parse(e.archived_at)))
      .map((e) => ({ id: String(e.id), archived_at: e.archived_at }))
      .sort(olderFirst); // oldest first
    const surplus = all.slice(0, Math.max(0, all.length - HISTORY.entries)).map((e) => e.id);
    return { expected: null, seq: 0, entries: all.slice(Math.max(0, all.length - HISTORY.entries)), surplus };
  };

  router.post('/api/kitchen/history', syncLimiter, async (req, res) => {
    const session = sessionOf(req);
    if (!session) return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    if (!store) return unavailable(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const entry = readHistoryEntry(body.entry);
    if (!entry) return res.status(400).json({ ok: false, error: 'invalid-input' });
    const storageId = `${session.sub}:${entry.id}`;
    for (let attempt = 0; ; attempt++) {
      const { expected, seq, entries, surplus } = await historyIndexFor(session.sub);
      // Re-archiving the same id replaces the entry in place: no duplicate, no eviction
      // (a retry HTTP or a double click converges to the same state).
      const sameId = entries.some((e) => e.id === entry.id);
      const next = [
        ...entries.filter((e) => e.id !== entry.id),
        { id: String(entry.id), archived_at: String(entry.archived_at) },
      ].sort(olderFirst);
      const ops: WriteOp[] = [
        { name: KITCHEN_HISTORY, id: storageId, doc: { uid: session.sub, entry_id: entry.id, ...entry } },
      ];
      if (!sameId && next.length > HISTORY.entries) {
        // The oldest entry (deterministic order) leaves: its deletion marker is part of the
        // same commit as the new entry and the index update — nothing can drift apart.
        const evicted = next.shift()!;
        ops.push({ name: KITCHEN_HISTORY, id: `${session.sub}:${evicted.id}`, doc: { deleted: true } });
      }
      for (const id of surplus) {
        ops.push({ name: KITCHEN_HISTORY, id: `${session.sub}:${id}`, doc: { deleted: true } });
      }
      ops.push({
        name: KITCHEN_HISTORY_INDEX,
        id: session.sub,
        doc: { uid: session.sub, seq: seq + 1, entries: next },
      });
      const result = await store.commit(ops, {
        name: KITCHEN_HISTORY_INDEX,
        id: session.sub,
        field: 'seq',
        expected,
      });
      if (result.ok) return res.json({ ok: true });
      // Another archive committed first: re-read the index and rebuild everything
      if (attempt + 1 >= historyAttemptLimit) return unavailable(res);
      await new Promise((resolve) => setTimeout(resolve, 80 * 2 ** attempt + Math.floor(Math.random() * 80)));
    }
  });

  router.get('/api/kitchen/history', syncLimiter, async (req, res) => {
    const session = sessionOf(req);
    if (!session) return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    if (!store) return unavailable(res);
    // The per-account index travels in the same query (no entry_id): one extra slot, filtered
    const docs = await store.findWhere(KITCHEN_HISTORY, 'uid', session.sub, HISTORY.entries + 1);
    const entries = docs
      .filter((d) => d.deleted !== true && typeof d.entry_id === 'string')
      .sort((a, b) => archivedTimestamp(b) - archivedTimestamp(a))
      .map(stripHistoryWrapper);
    return res.json({ ok: true, entries });
  });

  router.delete('/api/kitchen/history/:id', syncLimiter, async (req, res) => {
    const session = sessionOf(req);
    if (!session) return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    if (!store) return unavailable(res);
    const id = req.params.id;
    if (typeof id !== 'string' || id.length === 0 || id.length > HISTORY.id) {
      return res.status(404).json({ ok: false, error: 'not-found' });
    }
    const storageId = `${session.sub}:${id}`;
    const doc = await store.get(KITCHEN_HISTORY, storageId);
    if (!doc || doc.deleted === true || doc.uid !== session.sub || doc.entry_id !== id) {
      return res.status(404).json({ ok: false, error: 'not-found' });
    }
    for (let attempt = 0; ; attempt++) {
      const { expected, seq, entries, surplus } = await historyIndexFor(session.sub);
      const ops: WriteOp[] = [{ name: KITCHEN_HISTORY, id: storageId, doc: { deleted: true } }];
      for (const evicted of surplus) {
        ops.push({ name: KITCHEN_HISTORY, id: `${session.sub}:${evicted}`, doc: { deleted: true } });
      }
      ops.push({
        name: KITCHEN_HISTORY_INDEX,
        id: session.sub,
        doc: { uid: session.sub, seq: seq + 1, entries: entries.filter((e) => e.id !== id) },
      });
      const result = await store.commit(ops, {
        name: KITCHEN_HISTORY_INDEX,
        id: session.sub,
        field: 'seq',
        expected,
      });
      if (result.ok) return res.json({ ok: true });
      if (attempt + 1 >= historyAttemptLimit) return unavailable(res);
      await new Promise((resolve) => setTimeout(resolve, 80 * 2 ** attempt + Math.floor(Math.random() * 80)));
    }
  });

  return router;
}
