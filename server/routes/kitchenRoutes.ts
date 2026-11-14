import express from 'express';
import rateLimit from 'express-rate-limit';
import type { DataStore } from '../storage/types';
import type { BackofficeAuthConfig } from '../backofficeAuth';
import { verifyUserSessionToken } from '../auth/sessions';

/**
 * Personal kitchen data of one account (favorites, fridge, pantry, weekly menu, shopping
 * list, food preferences): one document per uid in the server-only `kitchen` collection.
 *
 * Guests never sync (their uid is ephemeral); clients and employees authenticate with
 * their session token. The write keeps a section only when it is newer than the stored
 * one (newest-write-wins per section): two devices can push in any order without losing
 * the other's changes. One push = one read + one write, nothing more.
 *
 * The same session rules guard the archived grocery-run snapshots (`kitchen_history`
 * collection, one document per uid + entry id, capped per uid).
 */

const KITCHEN = 'kitchen';
const KITCHEN_HISTORY = 'kitchen_history';

/** Sections are capped so no account can grow an unbounded document. */
const MAX = { sets: 300, pantry: 100, grocery: 500, planDays: 14 } as const;

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

const asStringList = (raw: unknown, max: number): string[] | null => {
  if (!Array.isArray(raw) || raw.length > max) return null;
  return raw.every((v) => typeof v === 'string' && v.length <= 200) ? (raw as string[]) : null;
};

const asPlan = (raw: unknown): unknown[] | null =>
  Array.isArray(raw) && raw.length <= MAX.planDays && raw.every((d) => d && typeof d === 'object') ? raw : null;

const asGrocery = (raw: unknown): unknown[] | null =>
  Array.isArray(raw) && raw.length <= MAX.grocery && raw.every((i) => i && typeof i === 'object') ? raw : null;

const asPreferences = (raw: unknown): Record<string, unknown> | null =>
  raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;

/** Grocery metadata: a free note and an optional spent amount (null = nothing spent yet). */
const asGroceryMeta = (raw: unknown): Record<string, unknown> | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const meta = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (meta.note !== undefined) {
    if (typeof meta.note !== 'string' || meta.note.length > 300) return null;
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
      validated = asStringList(value, MAX.sets);
      break;
    case 'fridge':
      validated = asStringList(value, MAX.sets);
      break;
    case 'pantry':
      validated = asStringList(value, MAX.pantry);
      break;
    case 'weeklyPlan':
      validated = asPlan(value);
      break;
    case 'groceryList':
      validated = asGrocery(value);
      break;
    case 'preferences':
      validated = asPreferences(value);
      break;
    case 'groceryMeta':
      validated = asGroceryMeta(value);
      break;
    default:
      return null;
  }
  if (validated === null) return null;
  return { value: validated, updated_at: updatedAt };
}

/** Per-section newest-write-wins merge: the stored section survives when it is newer (ties included). */
function mergeSections(
  stored: Record<string, KitchenSectionPayload> | undefined,
  incoming: Record<string, KitchenSectionPayload>
): Record<string, KitchenSectionPayload> {
  const merged: Record<string, KitchenSectionPayload> = { ...stored };
  for (const [name, section] of Object.entries(incoming)) {
    const current = merged[name];
    if (!current || section.updated_at > (current.updated_at ?? 0)) merged[name] = section;
  }
  return merged;
}

/** ISO 8601 shapes the client actually sends (date + time, optional fraction and zone). */
const ISO_LIKE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

const archivedTimestamp = (doc: Record<string, unknown>): number => {
  const parsed = Date.parse(String(doc.archived_at ?? ''));
  return Number.isNaN(parsed) ? 0 : parsed;
};

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
    const stored = await store.get(KITCHEN, session.sub);
    const storedSections =
      stored && stored.deleted !== true ? (stored.sections as Record<string, KitchenSectionPayload>) : undefined;
    const sections = mergeSections(storedSections, incoming);
    const document = { uid: session.sub, sections, updated_at: new Date().toISOString() };
    await store.put(KITCHEN, session.sub, document);
    return res.json({ ok: true, doc: { uid: session.sub, sections } });
  });

  // Archived grocery-run snapshots: one document per uid + entry id, at most HISTORY.entries
  // per account (the oldest one, by archived_at, goes first when the cap is reached).
  router.post('/api/kitchen/history', syncLimiter, async (req, res) => {
    const session = sessionOf(req);
    if (!session) return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    if (!store) return unavailable(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const entry = readHistoryEntry(body.entry);
    if (!entry) return res.status(400).json({ ok: false, error: 'invalid-input' });
    const existing = await store.findWhere(KITCHEN_HISTORY, 'uid', session.sub, HISTORY.entries);
    if (existing.length >= HISTORY.entries) {
      const oldest = [...existing].sort((a, b) => archivedTimestamp(a) - archivedTimestamp(b))[0];
      if (oldest && typeof oldest.entry_id === 'string') {
        await store.remove(KITCHEN_HISTORY, `${session.sub}:${oldest.entry_id}`);
      }
    }
    await store.put(KITCHEN_HISTORY, `${session.sub}:${entry.id}`, {
      uid: session.sub,
      entry_id: entry.id,
      ...entry,
    });
    return res.json({ ok: true });
  });

  router.get('/api/kitchen/history', syncLimiter, async (req, res) => {
    const session = sessionOf(req);
    if (!session) return res.status(401).json({ ok: false, error: 'invalid-credentials' });
    if (!store) return unavailable(res);
    const docs = await store.findWhere(KITCHEN_HISTORY, 'uid', session.sub, HISTORY.entries);
    const entries = docs
      .filter((d) => d.deleted !== true)
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
    await store.remove(KITCHEN_HISTORY, storageId);
    return res.json({ ok: true });
  });

  return router;
}
