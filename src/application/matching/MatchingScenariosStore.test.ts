import { describe, expect, it } from 'vitest';
import type { MatchingScenario } from '@/core/matching';
import type { MatchingScenarioRepository } from '../ports';
import { MatchingScenariosStore } from './MatchingScenariosStore';

const scenario = (id: string, title = id): MatchingScenario => ({
  id,
  title,
  fridge: ['ing_oeuf'],
  checks: [{ kind: 'noCourse', course: 'dessert' }],
});

function fakeRepo(initial: unknown[] | 'offline' = []) {
  let rows: unknown[] = initial === 'offline' ? [] : [...initial];
  const repo: MatchingScenarioRepository = {
    list: async () => (initial === 'offline' ? null : [...rows]),
    save: async (s) => {
      const i = rows.findIndex((r) => (r as MatchingScenario).id === s.id);
      rows = i >= 0 ? rows.map((r, k) => (k === i ? s : r)) : [...rows, s];
      return { ok: true };
    },
    remove: async (id) => {
      rows = rows.filter((r) => (r as MatchingScenario).id !== id);
      return { ok: true };
    },
    replaceAll: async (list) => {
      rows = [...list];
      return { ok: true };
    },
  };
  return { repo, rows: () => rows };
}

const deps = { randomSuffix: () => 'abc', now: () => '2026-11-08T10:00:00.000Z' };

describe('MatchingScenariosStore', () => {
  it('loads the scenarios from the database and ignores invalid ones', async () => {
    const { repo } = fakeRepo([scenario('a'), { id: 'broken' }, scenario('b')]);
    const store = new MatchingScenariosStore(repo, deps);
    await store.load();
    expect(store.getState()).toMatchObject({ status: 'ready' });
    expect(store.getState().scenarios.map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('reports an unreachable database', async () => {
    const store = new MatchingScenariosStore(fakeRepo('offline').repo, deps);
    await store.load();
    expect(store.getState().status).toBe('error');
  });

  it('adds, updates and removes a scenario', async () => {
    const { repo, rows } = fakeRepo([scenario('a')]);
    const store = new MatchingScenariosStore(repo, deps);
    await store.load();

    expect(await store.save(scenario('b'))).toEqual({ ok: true });
    expect(await store.save({ ...scenario('a'), title: 'Nouveau titre' })).toEqual({ ok: true });
    expect(store.getState().scenarios.map((s) => s.title)).toEqual(['Nouveau titre', 'b']);

    await store.remove('a');
    expect(store.getState().scenarios.map((s) => s.id)).toEqual(['b']);
    expect(rows()).toHaveLength(1);
  });

  it('refuses an incomplete scenario without writing it', async () => {
    const { repo, rows } = fakeRepo();
    const store = new MatchingScenariosStore(repo, deps);
    const result = await store.save({ ...scenario('a'), fridge: [] });
    expect(result.ok).toBe(false);
    expect(rows()).toHaveLength(0);
  });

  it('builds a unique id from the title', async () => {
    const { repo } = fakeRepo([scenario('pates-seules-abc')]);
    let n = 0;
    const store = new MatchingScenariosStore(repo, { ...deps, randomSuffix: () => (n++ === 0 ? 'abc' : 'xyz') });
    await store.load();
    expect(store.newId('Pâtes seules')).toBe('pates-seules-xyz');
  });

  it('export then import gives the same list (restore replaces the database)', async () => {
    const { repo, rows } = fakeRepo([scenario('a'), scenario('b')]);
    const store = new MatchingScenariosStore(repo, deps);
    await store.load();
    const dump = store.exportJson();

    await store.remove('a');
    expect(await store.importJson(dump)).toEqual({ ok: true, count: 2, skipped: 0 });
    expect(store.getState().scenarios.map((s) => s.id)).toEqual(['a', 'b']);
    expect(rows()).toHaveLength(2);

    const withIncomplete = JSON.stringify({ scenarios: [scenario('c'), { ...scenario('d'), fridge: [] }] });
    expect(await store.importJson(withIncomplete)).toEqual({ ok: true, count: 1, skipped: 1 });
    expect((await store.importJson('{ "config": {} }')).ok).toBe(false);
    expect((await store.importJson('not json')).ok).toBe(false);
  });
});
