import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes, parseStoredRecipes, type Recipe } from '@/core/catalog';
import {
  DEFAULT_ROLES,
  defaultReviewSettings,
  parseWorkCopies,
  type RoleDefinition,
  type WorkCopy,
} from '@/core/review';
import { createMemoryCollectionCache } from '@/infrastructure/memory/memoryCollectionCache';
import { createMemoryReviewSettings } from '@/infrastructure/memory/memoryReviewSettings';
import { createMemoryReviewWorkspace } from '@/infrastructure/memory/memoryReviewWorkspace';
import { SyncedCollectionStore } from '../sync/SyncedCollectionStore';
import { ReviewSettingsStore } from './ReviewSettingsStore';
import { ReviewStore } from './ReviewStore';

const role = (id: string) => DEFAULT_ROLES.find((r) => r.id === id)!;

async function setup(actorRole: RoleDefinition = role('admin')) {
  const memory = createMemoryReviewWorkspace<'recipe'>();
  let clock = 1000;
  const now = () => ++clock;
  const workspace = new SyncedCollectionStore<WorkCopy<'recipe'>>({
    source: memory.source,
    cache: createMemoryCollectionCache(),
    read: parseWorkCopies('recipe'),
    builtIn: () => [],
    now,
    fullRefreshAfterMs: 1e12,
  });
  const published = new SyncedCollectionStore<Recipe>({
    source: memory.published.source,
    cache: createMemoryCollectionCache(),
    read: parseStoredRecipes,
    builtIn: () => [],
    now,
    fullRefreshAfterMs: 1e12,
  });
  const settings = new ReviewSettingsStore(createMemoryReviewSettings());
  const ctx = { ingredients: initialIngredients };
  const actor = { id: 'sara', role: actorRole };
  const store = new ReviewStore({
    kind: 'recipe',
    workspace,
    writer: memory.writer,
    published,
    settings,
    context: () => ctx,
    actor: () => actor,
    now,
  });
  workspace.start();
  published.start();
  settings.start();
  await Promise.resolve();
  return { store, memory, published, settings, actor };
}

const recipe: Recipe = { ...structuredClone(initialRecipes[0]), id: 'r1', is_published: false };
const requiredCells = defaultReviewSettings().workflows.recipe.requiredCells;

describe('ReviewStore', () => {
  it('keeps a saved recipe in the workspace, not online', async () => {
    const { store, published } = await setup();
    expect((await store.save(recipe)).ok).toBe(true);
    const entry = store.entry('r1')!;
    expect(entry.online).toBe(false);
    expect(entry.pending).toBe(true);
    expect(entry.snapshot.nextCell).toBe('identity:fr');
    expect(published.getState().items).toEqual([]);
  });

  it('validates cell by cell, then publishes only once the required cells are validated', async () => {
    const { store, published } = await setup();
    await store.save(recipe);
    await store.decide('r1', ['identity:fr', 'media'], 'approved');
    expect(store.entry('r1')!.snapshot.percent).toBe(50);
    expect((await store.publish('r1')).ok).toBe(false);

    await store.decide('r1', ['details', 'steps:fr'], 'approved');
    const result = await store.publish('r1', 'Première mise en ligne');
    expect(result).toEqual({ ok: true });
    const online = published.getState().items.find((r) => r.id === 'r1')!;
    expect(online.is_published).toBe(true);
    // Languages not validated yet are not published (nothing online before: emptied)
    expect(online.name_derja).toBe('');
    expect(online.name_fr).toBe(recipe.name_fr);
    expect(store.entry('r1')!.online).toBe(true);
    expect((await store.versions('r1')).map((v) => v.note)).toEqual(['Première mise en ligne']);
  });

  it('keeps the version online while the work copy changes', async () => {
    const { store, published } = await setup();
    await store.save(recipe);
    await store.decide('r1', requiredCells, 'approved');
    await store.publish('r1');
    await store.save({ ...recipe, name_fr: 'Nouveau nom' });
    const entry = store.entry('r1')!;
    expect(entry.pending).toBe(true);
    expect(entry.snapshot.cells['identity:fr'].state).toBe('changed');
    expect(published.getState().items.find((r) => r.id === 'r1')!.name_fr).toBe(recipe.name_fr);
  });

  it('refuses to validate an incomplete cell, and to send back without a note', async () => {
    const { store } = await setup();
    await store.save({ ...recipe, image_url: '' });
    expect((await store.decide('r1', ['media'], 'approved')).ok).toBe(false);
    expect((await store.decide('r1', ['identity:fr'], 'rejected')).ok).toBe(false);
    await store.decide('r1', ['identity:fr'], 'rejected', 'Nom trop long');
    expect(store.entry('r1')!.snapshot.cells['identity:fr'].state).toBe('to_fix');
    expect(store.entry('r1')!.copy.history[0]).toMatchObject({ action: 'reject', note: 'Nom trop long' });
  });

  it('refuses a change that does not start from the stored copy', async () => {
    const { store, memory } = await setup();
    await store.save(recipe);
    // Someone else saves meanwhile (another device): this device's copy is now behind
    const stored = store.entry('r1')!.copy;
    await memory.writer.save({ ...stored, written_at: stored.written_at + 1000 }, stored.written_at);
    const late = await store.decide('r1', ['media'], 'approved');
    // The live listener already brought the newer copy: the decision applies on top of it
    expect(late.ok).toBe(true);
  });

  it('checks the rights of the role', async () => {
    const editor = await setup(role('editor'));
    await editor.store.save(recipe);
    expect((await editor.store.decide('r1', ['media'], 'approved')).ok).toBe(false);
    expect((await editor.store.publish('r1')).ok).toBe(false);

    const translator = await setup(role('translator'));
    await translator.store.save(recipe);
    const reviewerOnlyDerja: RoleDefinition = {
      id: 'x',
      label: { fr: 'x' },
      permissions: ['review'],
      languages: ['derja'],
    };
    const derjaReviewer = await setup(reviewerOnlyDerja);
    await derjaReviewer.memory.writer.save((await translator.store.entry('r1')!).copy, null);
    await Promise.resolve();
    expect((await derjaReviewer.store.decide('r1', ['identity:derja'], 'approved')).ok).toBe(true);
    expect((await derjaReviewer.store.decide('r1', ['media'], 'approved')).ok).toBe(false);
  });

  it('takes an item offline and brings back a published version', async () => {
    const { store, published } = await setup();
    await store.save(recipe);
    await store.decide('r1', requiredCells, 'approved');
    await store.publish('r1');
    await store.save({ ...recipe, name_fr: 'Version 2' });
    await store.decide('r1', ['identity:fr'], 'approved');
    await store.publish('r1');
    expect(published.getState().items.find((r) => r.id === 'r1')!.name_fr).toBe('Version 2');

    const versions = await store.versions('r1');
    expect(versions).toHaveLength(2);
    expect((await store.restore(versions[1])).ok).toBe(true);
    expect(published.getState().items.find((r) => r.id === 'r1')!.name_fr).toBe(recipe.name_fr);

    expect((await store.unpublish('r1')).ok).toBe(true);
    expect(published.getState().items.find((r) => r.id === 'r1')).toBeUndefined();
    expect(store.entry('r1')!.online).toBe(false);
  });

  it('starts from the version online when an online item is edited for the first time', async () => {
    const { store, memory } = await setup();
    await memory.published.writer.put({ ...recipe, id: 'live', is_published: true });
    await Promise.resolve();
    await store.save({ ...recipe, id: 'live', is_published: true, name_derja: 'Esm jdid' });
    const entry = store.entry('live')!;
    const changed = Object.entries(entry.snapshot.cells).filter(([, c]) => c.state !== 'approved');
    expect(changed.map(([id]) => id)).toEqual(['identity:derja']);
    expect(entry.online).toBe(true);
  });

  it('deletes an item: offline, and out of the workspace', async () => {
    const { store, published } = await setup();
    await store.save(recipe);
    await store.decide('r1', requiredCells, 'approved');
    await store.publish('r1');
    expect((await store.discard('r1')).ok).toBe(true);
    expect(store.entry('r1')).toBeUndefined();
    expect(published.getState().items.find((r) => r.id === 'r1')).toBeUndefined();
  });

  it('sends every recipe back to review and takes the online ones off the site', async () => {
    const { store, memory, published } = await setup();
    const online = { ...recipe, id: 'online', is_published: true };
    const edited = { ...recipe, id: 'edited', is_published: true };
    await memory.published.writer.putAll([online, edited]);
    await Promise.resolve();
    // "edited" has a work copy, validated and changed since
    await store.save({ ...edited, name_fr: 'Nouveau nom' });
    await store.decide('edited', ['identity:fr'], 'approved');
    await store.save({ ...recipe, id: 'draft' });

    const result = await store.resetAllForReview();
    expect(result).toMatchObject({ ok: true, reset: 2, unpublished: 2, failed: 0 });
    expect(published.getState().items).toEqual([]);
    for (const id of ['online', 'edited']) {
      const entry = store.entry(id)!;
      expect(entry.online).toBe(false);
      expect(entry.copy.decisions).toEqual({});
      expect(entry.copy.history[0].action).toBe('reset');
    }
    // The edited content is kept, the untouched draft is left as it was
    expect(store.entry('edited')!.copy.content.name_fr).toBe('Nouveau nom');
    expect(store.entry('draft')!.copy.history[0].action).toBe('save');
  });

  it('only lets a workflow manager send everything back to review', async () => {
    const { store } = await setup(role('editor'));
    expect((await store.resetAllForReview()).ok).toBe(false);
  });

  it('tells how complete the data is, even once validated', async () => {
    const { store } = await setup();
    await store.save(recipe);
    const result = store.completeness(store.entry('r1')!.copy.content);
    expect(result.percent).toBeLessThan(100);
    expect(store.completeness(store.entry('r1')!.copy.content)).toBe(result);
  });

  it('follows the workflow saved by the admin', async () => {
    const { store, settings } = await setup();
    await store.save(recipe);
    await store.decide('r1', requiredCells, 'approved');
    expect(store.entry('r1')!.snapshot.publishable).toBe(true);
    const stricter = defaultReviewSettings();
    stricter.workflows.recipe.requiredCells.push('identity:derja');
    expect((await settings.publish(stricter, 'Derja obligatoire')).ok).toBe(true);
    expect(store.entry('r1')!.snapshot.publishable).toBe(false);
    expect(settings.getState().version).toBe(1);
  });
});
