import express from 'express';
import rateLimit from 'express-rate-limit';
import type { DataStore } from '../storage/types';
import { collectionSpec } from '../storage/collections';
import { computeChanges } from '../storage/gateway';
import { resolveIdentity } from '../storage/identity';
import { raiseWatermark } from '../storage/watermark';
import type { SuperAdminConfig } from '../superAdminAuth';

/** Body of the batched change feed: the client's newest revision per collection. */
interface ChangesBody {
  rev?: Record<string, unknown>;
}

/** The change feed: one round trip answers every collection the client follows. */
export function dataRoutes(superAdminConfig: SuperAdminConfig, store: DataStore | null): express.Router {
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

  const unavailable = (res: express.Response) => res.status(503).json({ ok: false, error: 'storage_unavailable' });

  router.post('/api/data/changes', pollLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, superAdminConfig);
    const body = (req.body ?? {}) as ChangesBody;
    const rev: Record<string, number> = {};
    for (const [name, value] of Object.entries(body.rev ?? {})) {
      if (typeof value === 'number' && value >= 0) rev[name] = value;
    }
    const data = await computeChanges(rev, { read: identity.canManage ? 'admin' : 'public' }, store);
    res.json({ ok: true, data });
  });

  router.put('/api/data/:name/:id', writeLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, superAdminConfig);
    const spec = collectionSpec(req.params.name ?? '');
    if (!spec) return res.status(404).json({ ok: false, error: 'unknown_collection' });
    if (!identity.canPublish || (spec.write === 'manager' && !identity.canManage)) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    const id = req.params.id ?? '';
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return res.status(400).json({ ok: false, error: 'invalid_id' });
    const parsed = spec.parse((req.body ?? {}).doc);
    if (!parsed) return res.status(400).json({ ok: false, error: 'invalid_document' });
    const revision = await store.put(spec.name, id, parsed);
    raiseWatermark(spec.name, revision);
    return res.json({ ok: true, revision });
  });

  router.delete('/api/data/:name/:id', writeLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, superAdminConfig);
    const spec = collectionSpec(req.params.name ?? '');
    if (!spec) return res.status(404).json({ ok: false, error: 'unknown_collection' });
    if (!identity.canPublish || (spec.write === 'manager' && !identity.canManage)) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    const id = req.params.id ?? '';
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return res.status(400).json({ ok: false, error: 'invalid_id' });
    const revision = await store.remove(spec.name, id);
    raiseWatermark(spec.name, revision);
    return res.json({ ok: true, revision });
  });

  return router;
}
