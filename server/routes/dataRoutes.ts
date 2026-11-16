import express from 'express';
import rateLimit from 'express-rate-limit';
import type { DataStore, WriteOp } from '../storage/types';
import { collectionSpec } from '../storage/collections';
import { computeChanges } from '../storage/gateway';
import { contractEmployeeRights, createIdentityResolver, type IdentityResolver } from '../storage/identity';
import { raiseWatermark } from '../storage/watermark';
import { DocumentValidationError } from '../storage/validation';
import type { BackofficeAuthConfig } from '../backofficeAuth';

/** Body of the batched change feed: the client's newest revision per collection. */
interface ChangesBody {
  rev?: Record<string, unknown>;
}

/**
 * The data endpoints the whole client talks to (visitors read, proved editors write):
 * the batched change feed, single-document reads, batch writes and a field query.
 * Server-only collections (users, auth, settings, version histories) never pass here.
 */
export function dataRoutes(
  backofficeAuthConfig: BackofficeAuthConfig,
  store: DataStore | null,
  /** Bound identity resolver; the default reads the employee rights over the contract */
  resolver?: IdentityResolver
): express.Router {
  const resolveIdentity = resolver ?? createIdentityResolver(backofficeAuthConfig, contractEmployeeRights(store));
  const router = express.Router();

  // Idle polls cost nothing server-side (the watermark shortcut): a generous read limit
  const pollLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });
  // Writes cost a database write each: per-IP floor to absorb any abuse
  const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });
  // A batch write moves many documents at once (catalog import): few calls, many docs
  const batchLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });

  const unavailable = (res: express.Response) => res.status(503).json({ ok: false, error: 'storage_unavailable' });
  const forbidden = (res: express.Response) => res.status(403).json({ ok: false, error: 'forbidden' });
  /** The storage layer refused the write before touching the provider: a 400, not a crash. */
  const invalid = (res: express.Response, error: unknown) => {
    if (error instanceof DocumentValidationError) {
      return res
        .status(400)
        .json({ ok: false, error: error.code === 'invalid_id' ? 'invalid_id' : 'invalid_document' });
    }
    throw error;
  };

  /** Writes through the endpoints are refused for server-only collections. */
  const writable = (name: string, canManage: boolean) => {
    const spec = collectionSpec(name);
    if (!spec) return null;
    if (spec.write === 'server') return null;
    if (spec.write === 'manager' && !canManage) return null;
    return spec;
  };

  router.post('/api/data/changes', pollLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req);
    const body = (req.body ?? {}) as ChangesBody;
    // Cursor negotiation: a plain number is the legacy shape (strict revision); a structured
    // { revision, id? } object is the composite cursor — the client only sends it after a
    // response carried one, so an old server never receives a shape it would ignore.
    const rev: Record<string, number | { revision: number; id?: string }> = {};
    for (const [name, value] of Object.entries(body.rev ?? {})) {
      if (typeof value === 'number' && value >= 0) rev[name] = value;
      else if (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { revision?: unknown }).revision === 'number' &&
        (value as { revision: number }).revision >= 0 &&
        ((value as { id?: unknown }).id === undefined ||
          (typeof (value as { id?: unknown }).id === 'string' && (value as { id: string }).id.length <= 1500))
      ) {
        const cursor = value as { revision: number; id?: string };
        rev[name] =
          cursor.id !== undefined ? { revision: cursor.revision, id: cursor.id } : { revision: cursor.revision };
      }
    }
    const data = await computeChanges(rev, { read: identity.canManage ? 'admin' : 'public' }, store);
    res.json({ ok: true, data });
  });

  // One equality query (e.g. the published versions of an item): proved managers only.
  // Declared before /:name/:id so that "where" is never read as an id.
  router.get('/api/data/:name/where', async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req);
    if (!identity.canManage) return forbidden(res);
    const spec = collectionSpec(req.params.name ?? '');
    if (!spec || spec.read === 'server') return res.status(404).json({ ok: false, error: 'unknown_collection' });
    const field = String(req.query.field ?? '');
    const value = String(req.query.value ?? '');
    if (!/^[a-zA-Z0-9_]{1,64}$/.test(field) || !/^[\w:.-]{1,128}$/.test(value)) {
      return res.status(400).json({ ok: false, error: 'invalid_query' });
    }
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '100'), 10) || 100, 1), 300);
    const items = await store.findWhere(spec.name, field, value, limit);
    return res.json({ ok: true, items });
  });

  // True when the collection holds nothing yet (an import seeds only an empty base).
  router.get('/api/data/:name/empty', async (req, res) => {
    if (!store) return unavailable(res);
    const spec = collectionSpec(req.params.name ?? '');
    if (!spec || spec.read === 'server') return res.status(404).json({ ok: false, error: 'unknown_collection' });
    const identity = await resolveIdentity(req);
    if (spec.read !== 'public' && !identity.canManage) return forbidden(res);
    const delta = await store.changes(spec.name, 0, 1);
    return res.json({ ok: true, empty: delta.items.length === 0 && delta.removedIds.length === 0 });
  });

  // One document by id: a public collection is readable by anyone, an admin one only by
  // proved managers — except an employee reading their own team record.
  router.get('/api/data/:name/:id', async (req, res) => {
    if (!store) return unavailable(res);
    const spec = collectionSpec(req.params.name ?? '');
    if (!spec) return res.status(404).json({ ok: false, error: 'unknown_collection' });
    const identity = await resolveIdentity(req);
    const id = req.params.id ?? '';
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return res.status(400).json({ ok: false, error: 'invalid_id' });
    const ownTeamRecord = spec.name === 'admins' && identity.canPublish;
    if (spec.read !== 'public' && !identity.canManage && !ownTeamRecord) return forbidden(res);
    const doc = await store.get(spec.name, id);
    return doc && doc.deleted !== true
      ? res.json({ ok: true, doc })
      : res.status(404).json({ ok: false, error: 'unknown' });
  });

  router.put('/api/data/:name/:id', writeLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req);
    if (!identity.canPublish) return forbidden(res);
    const spec = writable(req.params.name ?? '', identity.canManage);
    if (!spec) return res.status(404).json({ ok: false, error: 'unknown_collection' });
    const id = req.params.id ?? '';
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return res.status(400).json({ ok: false, error: 'invalid_id' });
    const parsed = spec.parse((req.body ?? {}).doc);
    if (!parsed) return res.status(400).json({ ok: false, error: 'invalid_document' });
    try {
      const revision = await store.put(spec.name, id, parsed);
      raiseWatermark(spec.name, revision);
      return res.json({ ok: true, revision });
    } catch (error) {
      return invalid(res, error);
    }
  });

  router.delete('/api/data/:name/:id', writeLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req);
    if (!identity.canPublish) return forbidden(res);
    const spec = writable(req.params.name ?? '', identity.canManage);
    if (!spec) return res.status(404).json({ ok: false, error: 'unknown_collection' });
    const id = req.params.id ?? '';
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return res.status(400).json({ ok: false, error: 'invalid_id' });
    try {
      const revision = await store.remove(spec.name, id);
      raiseWatermark(spec.name, revision);
      return res.json({ ok: true, revision });
    } catch (error) {
      return invalid(res, error);
    }
  });

  // Many documents at once (catalog import): complete writes, chunked by the client
  router.post('/api/data/:name', batchLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req);
    if (!identity.canPublish) return forbidden(res);
    const spec = writable(req.params.name ?? '', identity.canManage);
    if (!spec) return res.status(404).json({ ok: false, error: 'unknown_collection' });
    const docs = Array.isArray((req.body ?? {}).docs) ? ((req.body as { docs: unknown[] }).docs as unknown[]) : [];
    if (!docs.length || docs.length > 200) return res.status(400).json({ ok: false, error: 'invalid_batch' });
    const ops: WriteOp[] = [];
    for (const raw of docs) {
      const d = (raw ?? {}) as Record<string, unknown>;
      const id = typeof d.id === 'string' ? d.id : '';
      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return res.status(400).json({ ok: false, error: 'invalid_id' });
      const parsed = spec.parse(d);
      if (!parsed) return res.status(400).json({ ok: false, error: 'invalid_document' });
      ops.push({ name: spec.name, id, doc: parsed });
    }
    let revision = 0;
    for (const op of ops) {
      revision = await store.put(op.name, op.id, op.doc);
    }
    raiseWatermark(spec.name, revision);
    return res.json({ ok: true, revision, written: ops.length });
  });

  // Makes the collection exactly `docs`: the others become deletion markers (same as before).
  router.post('/api/data/:name/replace', batchLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req);
    if (!identity.canPublish) return forbidden(res);
    const spec = writable(req.params.name ?? '', identity.canManage);
    if (!spec) return res.status(404).json({ ok: false, error: 'unknown_collection' });
    const docs = Array.isArray((req.body ?? {}).docs) ? ((req.body as { docs: unknown[] }).docs as unknown[]) : [];
    if (docs.length > 500) return res.status(400).json({ ok: false, error: 'invalid_batch' });
    const ops: WriteOp[] = [];
    const keep = new Set<string>();
    for (const raw of docs) {
      const d = (raw ?? {}) as Record<string, unknown>;
      const id = typeof d.id === 'string' ? d.id : '';
      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return res.status(400).json({ ok: false, error: 'invalid_id' });
      const parsed = spec.parse(d);
      if (!parsed) return res.status(400).json({ ok: false, error: 'invalid_document' });
      keep.add(id);
      ops.push({ name: spec.name, id, doc: parsed });
    }
    for (const id of await store.ids(spec.name)) {
      if (!keep.has(id)) ops.push({ name: spec.name, id, doc: { deleted: true } });
    }
    let revision = 0;
    for (const op of ops) {
      revision = await store.put(op.name, op.id, op.doc);
    }
    raiseWatermark(spec.name, revision);
    return res.json({ ok: true, revision, written: ops.length, removed: ops.length - keep.size });
  });

  return router;
}
