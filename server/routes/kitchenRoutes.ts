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
 */

const KITCHEN = 'kitchen';

/** Sections are capped so no account can grow an unbounded document. */
const MAX = { sets: 300, pantry: 100, grocery: 500, planDays: 14 } as const;

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

export function kitchenRoutes(adminConfig: BackofficeAuthConfig, store: DataStore | null): express.Router {
  const router = express.Router();

  // Legitimate sync stays far below this ceiling (a debounced push every couple of seconds
  // at the very worst); it only stops an abusive client from burning database reads.
  const syncLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });

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

  return router;
}
