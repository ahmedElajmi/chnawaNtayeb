import betterSqlite3 from 'better-sqlite3';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import knex, { type Knex } from 'knex';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { emailReservationId, resolveUserProfile } from '../../src/core/accounts';
import { createRelationalPilot, ensurePilotSchema, PILOT_COLLECTIONS } from './relationalPilot';

/**
 * The relational pilot proves the DataStore semantics over genuinely relational tables
 * (typed columns, keys, constraints — no JSON column standing in for the models). The full
 * generic contract suite stays on the memory and generic-SQL stores; the pilot adds its own
 * battery over the identity collections with realistic documents, plus the fidelity checks
 * specific to a relational representation (round-trips through the domain parsers, FK and
 * unique constraints, relation rewriting, atomic rollback including the counters).
 */

let db: Knex;
let driver: betterSqlite3.Database;
let file = '';

beforeAll(async () => {
  file = path.join(tmpdir(), `chnawa-pilot-test-${process.pid}-${Date.now()}.db`);
  driver = betterSqlite3(file);
  driver.pragma('foreign_keys = ON'); // the relational integrity is part of what the pilot proves
  db = knex({
    client: 'better-sqlite3',
    connection: { filename: file },
    pool: {
      min: 0,
      max: 1,
      afterCreate: (conn: betterSqlite3.Database, done: (e: unknown, c: unknown) => void) => {
        conn.pragma('foreign_keys = ON');
        done(null, conn);
      },
    },
  });
  await ensurePilotSchema(db);
});

afterAll(async () => {
  await db.destroy();
  driver.close();
  rmSync(file, { force: true });
});

const wipe = () => {
  for (const t of [
    'pilot_user_favorites',
    'pilot_user_saved_fridge',
    'pilot_email_index',
    'pilot_auth',
    'pilot_users',
  ]) {
    driver.prepare(`DELETE FROM ${t}`).run();
  }
};

const store = () => createRelationalPilot(db);

describe('relational pilot (identity domain, typed columns)', () => {
  it('serves only the identity collections and refuses others loudly', async () => {
    expect(PILOT_COLLECTIONS.sort()).toEqual(['auth', 'email_index', 'users']);
    await expect(store().put('recipes', 'r1', { name_fr: 'x' })).rejects.toThrow('the relational pilot only serves');
    // An unmapped field inside a served collection stays a loud column error
    await expect(store().put('users', 'u1', { noSuchField: 1 })).rejects.toThrow('no mapped column');
  });

  it('round-trips a profile through the relational columns and the domain parser', async () => {
    wipe();
    const doc = {
      uid: 'u1',
      type: 'client',
      email: 'a@b.co',
      displayName: 'Souhed',
      phone: '+21620123456',
      preferredLanguage: 'fr',
      isAnonymous: false,
      lastLogin: '2025-01-01T00:00:00.000Z',
      favorites: ['r2', 'r1'],
      savedFridge: ['i1'],
      address: { line: '12 rue', region: 'tunis', city: 'Tunis', postalCode: '1000', country: 'TN' },
    };
    await store().put('users', 'u1', doc);
    const read = (await store().get('users', 'u1'))!;
    const parsed = resolveUserProfile({ ...read });
    expect(parsed).toMatchObject({
      uid: 'u1',
      type: 'client',
      email: 'a@b.co',
      displayName: 'Souhed',
      phone: '+21620123456',
      address: { line: '12 rue', city: 'Tunis', country: 'TN' },
      favorites: ['r2', 'r1'], // list order preserved by the liaison tables
      savedFridge: ['i1'],
    });
    // Rewriting the document whole: a shorter list clears the removed relations
    await store().put('users', 'u1', { ...doc, favorites: ['r1'] });
    expect((await store().get('users', 'u1'))!.favorites).toEqual(['r1']);
    // An absent address clears the address columns (whole overwrite, never a partial merge)
    await store().put('users', 'u1', { uid: 'u1', type: 'client', isAnonymous: false });
    const bare = (await store().get('users', 'u1'))!;
    expect(bare.email).toBeUndefined();
    expect(bare.address).toBeUndefined();
    expect(bare.favorites).toBeUndefined();
    expect(bare.isAnonymous).toBe(false);
  });

  it('stores a profile without e-mail (anonymous) with a NULL column, no invented rule', async () => {
    wipe();
    await store().put('users', 'anon', { uid: 'anon', type: 'client', isAnonymous: true });
    const read = (await store().get('users', 'anon'))!;
    expect(read.email).toBeUndefined();
    expect(resolveUserProfile(read)?.isAnonymous).toBe(true);
    // The empty list and the absent list come back alike (both mean "no rows")
    await store().put('users', 'anon', { uid: 'anon', type: 'client', isAnonymous: true, favorites: [] });
    expect((await store().get('users', 'anon'))!.favorites).toBeUndefined();
  });

  it('reserves an e-mail on its technical id, the address column deriving from it', async () => {
    wipe();
    const id = emailReservationId('a@b.co');
    expect(Buffer.from(id, 'base64url').toString('utf8')).toBe('a@b.co'); // reversible
    const done = await store().commit(
      [
        { name: 'users', id: 'u1', doc: { uid: 'u1', type: 'client', email: 'a@b.co', isAnonymous: false } },
        { name: 'auth', id: 'u1', doc: { password_phc: '$argon2id$phc', failed_attempts: 0, locked_until: null } },
        { name: 'email_index', id, doc: { uid: 'u1', taken: 1 } },
      ],
      { name: 'email_index', id, field: 'taken', expected: null }
    );
    expect(done.ok).toBe(true);
    // A second reservation of the same address: the guard fails, nothing is written
    const second = await store().commit([{ name: 'email_index', id, doc: { uid: 'u2', taken: 1 } }], {
      name: 'email_index',
      id,
      field: 'taken',
      expected: null,
    });
    expect(second).toEqual({ ok: false, conflict: true });
    expect(await store().get('email_index', id)).toMatchObject({ uid: 'u1', taken: 1 });
  });

  it('rolls a failed commit back completely: documents, relations and counters untouched', async () => {
    wipe();
    await store().put('users', 'u1', { uid: 'u1', type: 'client', isAnonymous: false, favorites: ['r1'] });
    const before = await store().maxRevision('users');
    // The auth write violates the foreign key (no such user): the whole batch aborts
    await expect(
      store().commit([
        { name: 'users', id: 'u2', doc: { uid: 'u2', type: 'client', isAnonymous: false } },
        { name: 'auth', id: 'ghost', doc: { password_phc: 'x', failed_attempts: 0 } },
      ])
    ).rejects.toThrow();
    expect(await store().get('users', 'u2')).toBeNull(); // no partial document
    expect(await store().maxRevision('users')).toBe(before); // the counter did not advance
    expect((await store().get('users', 'u1'))!.favorites).toEqual(['r1']); // relations intact
  });

  it('preserves the password PHC byte for byte when another part of auth changes', async () => {
    wipe();
    // The auth row references its user (foreign key): the parent row comes first
    await store().put('users', 'u1', { uid: 'u1', type: 'client', isAnonymous: false });
    await store().put('auth', 'u1', { password_phc: '$argon2id$v=19$m=65536', failed_attempts: 0, locked_until: null });
    await store().put('auth', 'u1', { password_phc: '$argon2id$v=19$m=65536', failed_attempts: 2, locked_until: 5000 });
    const auth = (await store().get('auth', 'u1'))!;
    expect(auth.password_phc).toBe('$argon2id$v=19$m=65536'); // params kept inside the PHC string
    expect(auth.failed_attempts).toBe(2);
    expect(auth.locked_until).toBe(5000);
  });

  it('pages and queries the users directory over the typed columns', async () => {
    wipe();
    await store().put('users', 'u1', { uid: 'u1', type: 'client', email: 'a@b.co', isAnonymous: false });
    await store().put('users', 'u2', { uid: 'u2', type: 'client', email: 'b@b.co', isAnonymous: false });
    await store().put('users', 'u3', { uid: 'u3', type: 'employee', email: 'c@b.co', isAnonymous: false });
    const clients = await store().page('users', { where: { field: 'type', value: 'client' }, limit: 10 });
    expect(clients.total).toBe(2);
    expect(clients.items.map((d) => d.id).sort()).toEqual(['u1', 'u2']);
    const search = await store().page('users', { prefix: { field: 'email', value: 'b' }, limit: 10 });
    expect(search.items.map((d) => d.id)).toEqual(['u2']);
    expect(await store().findFirst('users', 'email', 'a@b.co')).toMatchObject({ id: 'u1' });
  });

  it('publishes the change feed with the composite cursor over the relational tables', async () => {
    wipe();
    const first = await store().put('users', 'u1', { uid: 'u1', type: 'client', isAnonymous: false });
    const done = await store().commit([
      { name: 'users', id: 'u2', doc: { uid: 'u2', type: 'client', isAnonymous: false } },
      { name: 'users', id: 'u3', doc: { uid: 'u3', type: 'client', isAnonymous: false, favorites: ['r1'] } },
    ]);
    // The commit's tie set is delivered whole, in contract order, with the exact resume position
    const page = await store().changes('users', first, 1);
    expect(page.items.map((d) => d.id)).toEqual(['u2', 'u3']); // soft limit: the tie set stays whole
    expect(done.ok).toBe(true);
    const doneRevision = done.ok ? done.revision : 0;
    expect(page.cursor).toEqual({ revision: doneRevision, id: 'u3' });
    expect(page.more).toBe(false);
    expect((page.items[1] as { favorites?: string[] }).favorites).toEqual(['r1']);
    const rest = await store().changes('users', page.cursor!, 10);
    expect(rest.items).toHaveLength(0);
    expect(rest.more).toBe(false);
  });

  it('tombstones keep the relations intact and show up in the feed', async () => {
    wipe();
    await store().put('users', 'u1', { uid: 'u1', type: 'client', isAnonymous: false, favorites: ['r1'] });
    const revision = await store().remove('users', 'u1');
    expect(await store().get('users', 'u1')).toBeNull();
    const feed = await store().changes('users', 0, 10);
    expect(feed.removedIds).toEqual(['u1']);
    expect(feed.revision).toBe(revision);
    // The pilot refuses anything outside the common id guarantee, like every backend:
    // a slash, the reserved `.`/`..`, and the reserved `__.*__` pattern. A leading dot is
    // legal (`.hidden` and `a.b` are accepted ids) — the reserved pattern is `__.*__`.
    await expect(store().put('users', 'a/b', { uid: 'x', type: 'client', isAnonymous: false })).rejects.toThrow();
    await expect(
      store().put('users', '__internal__', { uid: 'x', type: 'client', isAnonymous: false })
    ).rejects.toThrow();
    await expect(store().put('users', '..', { uid: 'x', type: 'client', isAnonymous: false })).rejects.toThrow();
    // …and a legal id starting with a dot stays accepted
    const hidden = await store().put('users', '.hidden', { uid: 'x', type: 'client', isAnonymous: false });
    expect(hidden).toBeGreaterThan(0);
  });

  it('transacts a read-merge-write over a relational document', async () => {
    wipe();
    await store().put('users', 'u1', { uid: 'u1', type: 'client', isAnonymous: false });
    await store().transact('users', 'u1', (current) => ({
      next: { ...(current as Record<string, unknown>), displayName: 'Souhed' },
      result: null,
    }));
    expect(await store().get('users', 'u1')).toMatchObject({ displayName: 'Souhed', uid: 'u1' });
    // Returning the current reference writes nothing (no revision bump)
    const before = (await store().get('users', 'u1'))!.revision as number;
    await store().transact('users', 'u1', (current) => ({ next: current, result: null }));
    expect((await store().get('users', 'u1'))!.revision).toBe(before);
  });

  it('refuses unmapped and non-JSON-safe documents before any write', async () => {
    wipe();
    await expect(store().put('users', 'u1', { uid: 'u1', isAnonymous: false, mystery: 1 })).rejects.toThrow(
      'no mapped column'
    );
    await expect(store().put('users', 'u1', { uid: 'u1', isAnonymous: false, phone: new Date() })).rejects.toThrow();
    expect(await store().maxRevision('users')).toBe(0); // nothing was written
  });
});
