import express from 'express';
import rateLimit from 'express-rate-limit';
import { withoutUndefined } from '../../src/core/shared';
import { parseStoredIngredient, parseStoredRecipe } from '../../src/core/catalog';
import { resolveUserProfile, type AccountSummary } from '../../src/core/accounts';
import { parsePublishedVersion, parseWorkCopy, type ReviewKind } from '../../src/core/review';
import type { DataStore, WriteOp } from '../storage/types';
import { resolveIdentity } from '../storage/identity';
import { raiseWatermark } from '../storage/watermark';
import type { BackofficeAuthConfig } from '../backofficeAuth';
import { clampPollLimit, clampPollingSeconds, type RuntimeLimits } from '../appConfig';

/**
 * The privileged data operations the generic /api/data endpoints cannot express:
 * the atomic workflow writes (a publication lands with its version or not at all),
 * the active settings documents, the themes read and the accounts directory.
 * Every route answers to a proved manager (or a publisher for the workspace edits).
 */

const KINDS: Record<
  ReviewKind,
  {
    publicName: string;
    versionsName: string;
    workspaceName: string;
    parseItem: (raw: unknown) => Record<string, unknown> | null;
  }
> = {
  recipe: {
    publicName: 'recipes',
    versionsName: 'recipes_versions',
    workspaceName: 'recipes_workspace',
    parseItem: (raw) => parseStoredRecipe(raw) as Record<string, unknown> | null,
  },
  ingredient: {
    publicName: 'ingredients',
    versionsName: 'ingredients_versions',
    workspaceName: 'ingredients_workspace',
    parseItem: (raw) => parseStoredIngredient(raw) as Record<string, unknown> | null,
  },
};

/** Stored shape of a work copy: no id, no database revision, content without its own revision. */
function storedCopy(raw: Record<string, unknown>): Record<string, unknown> | null {
  const copy = raw as Record<string, unknown> & { content?: Record<string, unknown> };
  if (!copy.content || typeof copy.content !== 'object') return null;
  const { revision: _revision, ...content } = copy.content;
  const { id: _id, revision: _docRevision, ...rest } = copy;
  return withoutUndefined({ ...rest, content: withoutUndefined(content) });
}

function summarize(raw: Record<string, unknown>): AccountSummary | null {
  const profile = resolveUserProfile(raw);
  if (!profile) return null;
  return {
    uid: profile.uid,
    type: profile.type,
    email: profile.email,
    displayName: profile.displayName,
    phone: profile.phone,
    isAnonymous: profile.isAnonymous,
    lastLogin: profile.lastLogin,
  };
}

export function adminDataRoutes(
  backofficeAuthConfig: BackofficeAuthConfig,
  store: DataStore | null,
  runtime: RuntimeLimits
): express.Router {
  const router = express.Router();

  const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });

  const unavailable = (res: express.Response) => res.status(503).json({ ok: false, error: 'storage_unavailable' });
  const forbidden = (res: express.Response) => res.status(403).json({ ok: false, error: 'forbidden' });
  const bad = (res: express.Response, error: string) => res.status(400).json({ ok: false, error });

  // A publication writes several documents: a few of these calls are enough
  const commitLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });

  /** Guard on the work copy the change starts from (two editors never overwrite each other). */
  const copyGuard = (workspace: string, copyId: unknown, expected: unknown) => ({
    name: workspace,
    id: typeof copyId === 'string' ? copyId : '',
    field: 'written_at',
    expected: typeof expected === 'number' ? expected : null,
  });

  // ---------------------------------------------------------------- themes (one read, two shapes)
  router.get('/api/themes', async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, backofficeAuthConfig);
    const all = await store.changes('themes', 0, 300);
    const items = identity.canManage ? all.items : all.items.filter((d) => d.is_published === true);
    return res.json({ ok: true, items });
  });

  // ------------------------------------------------------- active settings (matching, review)
  const SETTINGS_DOCS = ['matching', 'review'] as const;
  type SettingsDoc = (typeof SETTINGS_DOCS)[number];

  // The "Synchronisation des appareils" settings: the polling interval and the abuse ceiling
  // (per IP per minute) the server enforces. Read by managers (the backoffice card), written
  // by the super admin. There is NO public endpoint: visitors receive the interval injected
  // in the served page; the ceiling is server-side and never client-set.
  router.get('/admin/api/settings/polling', async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, backofficeAuthConfig);
    if (!identity.canManage) return forbidden(res);
    const stored = await store.get('settings', 'polling');
    const exists = stored && stored.deleted !== true;
    return res.json({
      ok: true,
      interval_seconds: exists ? clampPollingSeconds(stored?.interval_seconds) : undefined,
      poll_requests_per_minute: exists ? clampPollLimit(stored?.poll_limit_per_minute) : undefined,
    });
  });

  router.put('/admin/api/settings/polling', writeLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, backofficeAuthConfig);
    if (!identity.owner) return forbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const hasInterval = typeof body.interval_seconds === 'number';
    const hasLimit = typeof body.poll_limit_per_minute === 'number';
    if (!hasInterval && !hasLimit) return bad(res, 'invalid_settings');
    if (hasInterval && clampPollingSeconds(body.interval_seconds) !== Math.round(body.interval_seconds as number)) {
      return bad(res, 'invalid_interval');
    }
    if (hasLimit && clampPollLimit(body.poll_limit_per_minute) !== Math.round(body.poll_limit_per_minute as number)) {
      return bad(res, 'invalid_limit');
    }
    const previous = await store.get('settings', 'polling');
    const document = {
      interval_seconds: hasInterval
        ? clampPollingSeconds(body.interval_seconds)
        : clampPollingSeconds(previous?.interval_seconds),
      poll_limit_per_minute: hasLimit
        ? clampPollLimit(body.poll_limit_per_minute)
        : clampPollLimit(previous?.poll_limit_per_minute),
      updated_at: new Date().toISOString(),
    };
    await store.put('settings', 'polling', document);
    // The limiter enforces the new ceiling on the very next request (no restart, no wait)
    runtime.pollRequestsPerMinute = document.poll_limit_per_minute;
    return res.json({
      ok: true,
      interval_seconds: document.interval_seconds,
      poll_requests_per_minute: document.poll_limit_per_minute,
    });
  });

  router.get('/api/settings/:doc', async (req, res) => {
    if (!store) return unavailable(res);
    const doc = req.params.doc as SettingsDoc;
    if (!SETTINGS_DOCS.includes(doc)) return res.status(404).json({ ok: false, error: 'unknown' });
    // matching drives the suggestions of every visitor; review is a backoffice concern
    if (doc === 'review') {
      const identity = await resolveIdentity(req, backofficeAuthConfig);
      if (!identity.canManage) return forbidden(res);
    }
    const stored = await store.get('settings', doc);
    return stored && stored.deleted !== true
      ? res.json({ ok: true, doc: stored, revision: stored.revision ?? 0 })
      : res.json({ ok: true, doc: null, revision: 0 });
  });

  router.post('/admin/api/settings/publish', commitLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, backofficeAuthConfig);
    if (!identity.canManage) return forbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const doc = body.doc as SettingsDoc;
    if (!SETTINGS_DOCS.includes(doc)) return bad(res, 'invalid_doc');
    if (!body.config || typeof body.config !== 'object') return bad(res, 'invalid_config');
    const current = await store.get('settings', doc);
    const currentVersion = typeof current?.version === 'number' && current.deleted !== true ? current.version : null;
    // The client says which version it publishes from: two managers never overwrite each other
    const expected = typeof body.expected_version === 'number' ? body.expected_version : null;
    if (currentVersion !== expected) return res.json({ ok: false, conflict: true });
    const next = (currentVersion ?? 0) + 1;
    const data = {
      version: next,
      config: JSON.parse(JSON.stringify(body.config)) as unknown,
      updated_at: new Date().toISOString(),
      note: typeof body.note === 'string' ? body.note.slice(0, 200) : '',
    };
    const versions = doc === 'matching' ? 'matching_settings_versions' : 'review_settings_versions';
    const result = await store.commit([
      { name: 'settings', id: doc, doc: data },
      { name: versions, id: `v${next}`, doc: data },
    ]);
    if (!result.ok) return res.json({ ok: false, conflict: true });
    raiseWatermark(versions, result.revision);
    return res.json({ ok: true, version: next });
  });

  // ------------------------------------------------------------- workflow (atomic writes)
  const kindOf = (raw: unknown): ReviewKind | null => (raw === 'recipe' || raw === 'ingredient' ? raw : null);

  router.post('/admin/api/workspace/save', writeLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, backofficeAuthConfig);
    if (!identity.canPublish) return forbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const kind = kindOf(body.kind);
    if (!kind) return bad(res, 'invalid_kind');
    const spec = KINDS[kind];
    const parsed = parseWorkCopy(kind, body.copy);
    if (!parsed || typeof parsed.written_at !== 'number') return bad(res, 'invalid_copy');
    const doc = storedCopy(parsed as unknown as Record<string, unknown>);
    if (!doc) return bad(res, 'invalid_copy');
    const result = await store.commit(
      [{ name: spec.workspaceName, id: parsed.id, doc }],
      copyGuard(spec.workspaceName, parsed.id, body.expected)
    );
    if (!result.ok) return res.json({ ok: false, conflict: true });
    raiseWatermark(spec.workspaceName, result.revision);
    return res.json({ ok: true, revision: result.revision });
  });

  router.post('/admin/api/workspace/import', writeLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, backofficeAuthConfig);
    if (!identity.canPublish) return forbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const kind = kindOf(body.kind);
    if (!kind) return bad(res, 'invalid_kind');
    const spec = KINDS[kind];
    const copies = Array.isArray(body.copies) ? (body.copies as unknown[]) : [];
    if (!copies.length || copies.length > 200) return bad(res, 'invalid_batch');
    const ops: WriteOp[] = [];
    for (const raw of copies) {
      const parsed = parseWorkCopy(kind, raw);
      if (!parsed) continue;
      // Only genuinely fresh copies are imported: an existing one (or deleted) is kept as is
      const existing = await store.get(spec.workspaceName, parsed.id);
      if (existing && existing.deleted !== true) continue;
      const doc = storedCopy(parsed as unknown as Record<string, unknown>);
      if (!doc) return bad(res, 'invalid_copy');
      ops.push({ name: spec.workspaceName, id: parsed.id, doc });
    }
    let revision = 0;
    for (const op of ops) {
      revision = await store.put(op.name, op.id, op.doc);
    }
    raiseWatermark(spec.workspaceName, revision);
    return res.json({ ok: true, revision, imported: ops.length });
  });

  router.post('/admin/api/workspace/publish', commitLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, backofficeAuthConfig);
    if (!identity.canPublish) return forbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const kind = kindOf(body.kind);
    if (!kind) return bad(res, 'invalid_kind');
    const spec = KINDS[kind];
    const parsedCopy = parseWorkCopy(kind, body.copy);
    const version = parsePublishedVersion(kind, body.version);
    if (!parsedCopy || typeof parsedCopy.written_at !== 'number' || !version) return bad(res, 'invalid_copy');
    const itemRaw = (body.item ?? {}) as Record<string, unknown>;
    const itemId = typeof itemRaw.id === 'string' ? itemRaw.id : '';
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(itemId) || itemId !== version.item_id) return bad(res, 'invalid_item');
    const parsedItem = spec.parseItem(itemRaw);
    const copy = storedCopy(parsedCopy as unknown as Record<string, unknown>);
    if (!parsedItem || !copy) return bad(res, 'invalid_item');
    const { id: _vId, revision: _vRevision, ...versionDoc } = version as unknown as Record<string, unknown>;
    const result = await store.commit(
      [
        { name: spec.publicName, id: itemId, doc: parsedItem },
        { name: spec.workspaceName, id: parsedCopy.id, doc: copy },
        { name: spec.versionsName, id: version.id, doc: withoutUndefined(versionDoc) },
      ],
      copyGuard(spec.workspaceName, parsedCopy.id, body.expected)
    );
    if (!result.ok) return res.json({ ok: false, conflict: true });
    raiseWatermark(spec.publicName, result.revision);
    raiseWatermark(spec.versionsName, result.revision);
    return res.json({ ok: true, revision: result.revision });
  });

  router.post('/admin/api/workspace/unpublish', commitLimiter, async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, backofficeAuthConfig);
    if (!identity.canPublish) return forbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const kind = kindOf(body.kind);
    if (!kind) return bad(res, 'invalid_kind');
    const spec = KINDS[kind];
    const parsedCopy = parseWorkCopy(kind, body.copy);
    if (!parsedCopy) return bad(res, 'invalid_copy');
    const copy = storedCopy(parsedCopy as unknown as Record<string, unknown>);
    if (!copy) return bad(res, 'invalid_copy');
    const result = await store.commit(
      [
        { name: spec.publicName, id: parsedCopy.id, doc: { deleted: true } },
        { name: spec.workspaceName, id: parsedCopy.id, doc: copy },
      ],
      copyGuard(spec.workspaceName, parsedCopy.id, body.expected)
    );
    if (!result.ok) return res.json({ ok: false, conflict: true });
    raiseWatermark(spec.publicName, result.revision);
    return res.json({ ok: true, revision: result.revision });
  });

  // ------------------------------------------------------------- accounts directory (manager)
  router.get('/admin/api/accounts', async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, backofficeAuthConfig);
    if (!identity.canManage) return forbidden(res);
    const type = String(req.query.type ?? 'all');
    const search = String(req.query.search ?? '')
      .trim()
      .toLowerCase();
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '25'), 10) || 25, 1), 100);
    const cursor = typeof req.query.cursor === 'string' && req.query.cursor ? req.query.cursor : null;
    // With a search the type filter is dropped (same behaviour as before, no index pairing)
    const page = await store.page('users', {
      where: !search && type !== 'all' ? { field: 'type', value: type } : null,
      prefix: search ? { field: 'email', value: search } : null,
      after: cursor,
      limit,
    });
    return res.json({
      ok: true,
      items: page.items.map(summarize).filter((v): v is AccountSummary => v !== null),
      total: page.total,
      nextCursor: page.nextCursor,
    });
  });

  /** The account behind an e-mail (linking a member to the account they sign in with). */
  router.get('/admin/api/accounts/lookup', async (req, res) => {
    if (!store) return unavailable(res);
    const identity = await resolveIdentity(req, backofficeAuthConfig);
    if (!identity.canManage) return forbidden(res);
    const email = String(req.query.email ?? '')
      .trim()
      .toLowerCase();
    if (!email) return bad(res, 'invalid_email');
    const found = await store.findFirst('users', 'email', email);
    return found
      ? res.json({ ok: true, account: { uid: found.id ?? found.uid, email } })
      : res.json({ ok: true, account: null });
  });

  return router;
}
