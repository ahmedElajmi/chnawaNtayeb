import {
  canPerform,
  canReviewCell,
  cellHash,
  cellHashes,
  composePublication,
  decideCell,
  hasPendingChanges,
  newWorkCopy,
  parseCellId,
  parsePublishedVersion,
  reviewSnapshot,
  stepOfCell,
  withEvent,
  workCopyFromPublished,
  type PublishedVersion,
  type QueueEntry,
  type ReviewContext,
  type ReviewItems,
  type ReviewKind,
  type ReviewSnapshot,
  type RoleDefinition,
  type WorkCopy,
  type WorkflowDefinition,
} from '@/core/review';
import type { ReviewWorkspaceWriter, WorkspaceWriteResult, WriteResult } from '../ports';
import { Store } from '../store';
import type { SyncedCollectionStore } from '../sync/SyncedCollectionStore';
import type { ReviewSettingsStore } from './ReviewSettingsStore';

/** A work copy with where it stands in its workflow (computed on the device, kept while nothing changes). */
export interface ReviewEntry<K extends ReviewKind> {
  copy: WorkCopy<K>;
  snapshot: ReviewSnapshot;
  /** Something differs from the version online (or nothing is online) */
  pending: boolean;
  online: boolean;
}

export interface ReviewState<K extends ReviewKind> {
  entries: ReviewEntry<K>[];
  workflow: WorkflowDefinition;
  /** True once the workspace answered (or was found unreachable) */
  synced: boolean;
}

export interface ReviewStoreDeps<K extends ReviewKind> {
  kind: K;
  /** Private workspace of this kind, followed like any shared collection */
  workspace: SyncedCollectionStore<WorkCopy<K>>;
  writer: ReviewWorkspaceWriter<K>;
  /** Public collection of this kind (shown at once after a publication) */
  published: SyncedCollectionStore<ReviewItems[K]>;
  settings: ReviewSettingsStore;
  /** What the checks may look at (ingredients known and online) */
  context: () => ReviewContext;
  /** Member acting and their role */
  actor: () => { id: string; role: RoleDefinition };
  now: () => number;
}

const CONFLICT = 'Cet élément a été modifié entre-temps par quelqu’un d’autre : recharge avant de continuer.';
const denied = (what: string): WriteResult => ({ ok: false, error: `Ton rôle ne permet pas de ${what}.` });

/**
 * Validation of one kind of content (recipes, ingredients): the team edits work copies in a private
 * workspace, the reviewer validates them cell by cell, and only validated versions are published.
 * Rights are checked here (roles of the workflow settings) and again by the database rules.
 */
export class ReviewStore<K extends ReviewKind> extends Store<ReviewState<K>> {
  private memo = new Map<
    string,
    { copy: WorkCopy<K>; workflow: WorkflowDefinition; ctx: ReviewContext; entry: ReviewEntry<K> }
  >();
  private publishedIds = new Set<string>();

  constructor(private readonly deps: ReviewStoreDeps<K>) {
    super({ entries: [], workflow: deps.settings.getState().settings.workflows[deps.kind], synced: false });
    const refresh = () => this.refresh();
    deps.workspace.subscribe(refresh);
    deps.settings.subscribe(refresh);
    deps.published.subscribe(refresh);
    this.refresh();
  }

  /** Starts following the workspace (admin only); returns the stop function. */
  start(): () => void {
    return this.deps.workspace.start();
  }

  /** Recomputes where each item stands; an unchanged item keeps its computed entry. */
  refresh(): void {
    const { kind } = this.deps;
    const workflow = this.deps.settings.getState().settings.workflows[kind];
    const ctx = this.deps.context();
    this.publishedIds = new Set(this.deps.published.getState().items.map((i) => i.id));
    const next = new Map<string, typeof this.memo extends Map<string, infer V> ? V : never>();
    const entries: ReviewEntry<K>[] = [];
    for (const copy of this.deps.workspace.getState().items) {
      const cached = this.memo.get(copy.id);
      const online = this.publishedIds.has(copy.id);
      const entry =
        cached &&
        cached.copy === copy &&
        cached.workflow === workflow &&
        cached.ctx === ctx &&
        cached.entry.online === online
          ? cached.entry
          : {
              copy,
              snapshot: reviewSnapshot(kind, copy.content, copy.decisions, workflow, ctx),
              pending: hasPendingChanges(copy),
              online,
            };
      next.set(copy.id, { copy, workflow, ctx, entry });
      entries.push(entry);
    }
    this.memo = next;
    this.setState({ entries, workflow, synced: this.deps.workspace.getState().synced });
  }

  entry(id: string): ReviewEntry<K> | undefined {
    return this.memo.get(id)?.entry;
  }

  /** Items of the review queue (for groupQueue / queueCounts). */
  queue(): QueueEntry[] {
    return this.getState().entries.map(({ copy, snapshot }) => ({
      id: copy.id,
      kind: this.deps.kind,
      snapshot,
      author: copy.updated_by,
      updatedAt: copy.updated_at,
    }));
  }

  /** Saves the content edited by a member: a new work copy, or the existing one with its decisions kept. */
  async save(content: ReviewItems[K]): Promise<WorkspaceWriteResult> {
    const { id: by, role } = this.deps.actor();
    if (!canPerform(role, 'edit')) return denied('modifier ce contenu');
    const at = this.deps.now();
    // An item online without a work copy yet starts from its version online, validated:
    // only what this change touches goes back to review
    const online = this.deps.published.getState().items.find((i) => i.id === content.id);
    const existing =
      this.deps.workspace.getState().items.find((c) => c.id === content.id) ??
      (online ? workCopyFromPublished(this.deps.kind, online, by, at) : undefined);
    const stored = this.deps.workspace.getState().items.some((c) => c.id === content.id);
    const copy: WorkCopy<K> = existing
      ? {
          ...existing,
          content,
          history: withEvent(existing.history, { action: 'save', by, at }),
          updated_by: by,
          updated_at: at,
        }
      : newWorkCopy(this.deps.kind, content, by, at);
    return this.write(copy, stored ? existing!.written_at : null, (c, expected) => this.deps.writer.save(c, expected));
  }

  /** Deletes an item for good: taken offline when it is online, and its work copy removed. */
  async discard(id: string): Promise<WriteResult> {
    const { role } = this.deps.actor();
    if (!canPerform(role, 'publish')) return denied('supprimer');
    const entry = this.entry(id);
    if (entry?.online) {
      const out = await this.unpublish(id);
      if (!out.ok && !out.local) return out;
    }
    const result = await this.deps.writer.remove(id);
    this.deps.workspace.removeLocal(id);
    return result;
  }

  /**
   * Validates (or sends back with a note) cells of an item, tied to what they contain now.
   * A cell that still fails a blocking check cannot be validated.
   */
  async decide(
    id: string,
    cells: string[],
    verdict: 'approved' | 'rejected',
    note?: string
  ): Promise<WorkspaceWriteResult> {
    const entry = this.entry(id);
    if (!entry) return { ok: false, error: 'Élément introuvable dans l’atelier.' };
    const { kind } = this.deps;
    const { id: by, role } = this.deps.actor();
    const workflow = this.getState().workflow;
    const at = this.deps.now();
    let decisions = entry.copy.decisions;
    for (const cellId of cells) {
      const cell = parseCellId(kind, cellId);
      const review = entry.snapshot.cells[cellId];
      if (!cell || !review) return { ok: false, error: `Case inconnue : ${cellId}.` };
      if (!canReviewCell(role, stepOfCell(workflow, cellId), cell)) return denied('valider cette partie');
      if (verdict === 'approved' && review.state === 'incomplete')
        return {
          ok: false,
          error: 'Cette partie n’est pas complète : corrige les points bloquants avant de la valider.',
        };
      if (verdict === 'rejected' && !note?.trim())
        return { ok: false, error: 'Écris une note pour dire quoi corriger.' };
      decisions = decideCell(decisions, cellId, {
        verdict,
        hash: cellHash(kind, entry.copy.content, cell),
        by,
        at,
        note,
      });
    }
    const copy: WorkCopy<K> = {
      ...entry.copy,
      decisions,
      history: withEvent(entry.copy.history, {
        action: verdict === 'approved' ? 'approve' : 'reject',
        by,
        at,
        cells,
        ...(note?.trim() ? { note: note.trim() } : {}),
      }),
    };
    return this.write(copy, entry.copy.written_at, (c, expected) => this.deps.writer.save(c, expected));
  }

  /** Publishes the validated cells of an item (the others keep their version online). */
  async publish(id: string, note = ''): Promise<WorkspaceWriteResult> {
    const { id: by, role } = this.deps.actor();
    if (!canPerform(role, 'publish')) return denied('publier');
    const entry = this.entry(id);
    if (!entry) return { ok: false, error: 'Élément introuvable dans l’atelier.' };
    const online = this.deps.published.getState().items.find((i) => i.id === id) ?? null;
    const composed = composePublication(
      this.deps.kind,
      entry.copy.content,
      online,
      entry.snapshot,
      this.getState().workflow
    );
    if (!composed)
      return { ok: false, error: 'Toutes les parties obligatoires doivent être validées avant de publier.' };
    const item = this.deps.kind === 'recipe' ? ({ ...composed, is_published: true } as ReviewItems[K]) : composed;
    const at = this.deps.now();
    const version: PublishedVersion<K> = {
      id: `${id}-${at}`,
      item_id: id,
      kind: this.deps.kind,
      content: item,
      published_at: at,
      published_by: by,
      ...(note.trim() ? { note: note.trim().slice(0, 200) } : {}),
    };
    const copy: WorkCopy<K> = {
      ...entry.copy,
      published_hashes: cellHashes(this.deps.kind, item),
      published_at: at,
      history: withEvent(entry.copy.history, {
        action: 'publish',
        by,
        at,
        ...(version.note ? { note: version.note } : {}),
      }),
    };
    const result = await this.write(copy, entry.copy.written_at, (c, expected) =>
      this.deps.writer.publish(item, c, version, expected)
    );
    if (result.ok || result.local) this.deps.published.putLocal(item);
    return result;
  }

  /** Takes an item offline; its work copy stays in the workspace. */
  async unpublish(id: string): Promise<WorkspaceWriteResult> {
    const { id: by, role } = this.deps.actor();
    if (!canPerform(role, 'publish')) return denied('retirer du site');
    const entry = this.entry(id);
    if (!entry) return { ok: false, error: 'Élément introuvable dans l’atelier.' };
    const at = this.deps.now();
    const { published_hashes: _h, published_at: _a, ...rest } = entry.copy;
    const copy: WorkCopy<K> = { ...rest, history: withEvent(entry.copy.history, { action: 'unpublish', by, at }) };
    const result = await this.write(copy, entry.copy.written_at, (c, expected) =>
      this.deps.writer.unpublish(c, expected)
    );
    if (result.ok || result.local) this.deps.published.removeLocal(id);
    return result;
  }

  /** Validated versions of an item, newest first. */
  async versions(id: string): Promise<PublishedVersion<K>[]> {
    const raw = await this.deps.writer.listVersions(id);
    return raw
      .map((v) => parsePublishedVersion(this.deps.kind, v))
      .filter((v): v is PublishedVersion<K> => v !== null)
      .sort((a, b) => b.published_at - a.published_at);
  }

  /** Brings back a validated version: it becomes the work copy, every cell validated, and is published again. */
  async restore(version: PublishedVersion<K>): Promise<WorkspaceWriteResult> {
    const { id: by, role } = this.deps.actor();
    if (!canPerform(role, 'publish')) return denied('republier une version');
    const entry = this.entry(version.item_id);
    const at = this.deps.now();
    const restored = workCopyFromPublished(this.deps.kind, version.content, by, at);
    const copy: WorkCopy<K> = {
      ...restored,
      ...(entry?.copy.published_hashes ? { published_hashes: entry.copy.published_hashes } : {}),
      history: withEvent(entry?.copy.history ?? [], {
        action: 'restore',
        by,
        at,
        note: `Version du ${new Date(version.published_at).toISOString().slice(0, 10)}`,
      }),
    };
    const saved = await this.write(copy, entry?.copy.written_at ?? null, (c, expected) =>
      this.deps.writer.save(c, expected)
    );
    if (!saved.ok) return saved;
    return this.publish(
      version.item_id,
      `Retour à la version du ${new Date(version.published_at).toLocaleDateString()}`
    );
  }

  /**
   * First switch to the workflow: every item online without a work copy gets one, marked validated
   * (it is what the public already sees). Items already in the workspace are left alone.
   */
  async importPublished(): Promise<WriteResult & { imported?: number }> {
    const { id: by, role } = this.deps.actor();
    if (!canPerform(role, 'manage_workflows')) return denied('lancer l’import');
    const existing = new Set(this.deps.workspace.getState().items.map((c) => c.id));
    const at = this.deps.now();
    const copies = this.deps.published
      .getState()
      .items.filter((item) => !existing.has(item.id))
      .map((item) =>
        this.deps.kind === 'recipe' && (item as ReviewItems['recipe']).is_published === false
          ? newWorkCopy(this.deps.kind, item, by, at)
          : workCopyFromPublished(this.deps.kind, item, by, at)
      );
    if (copies.length === 0) return { ok: true, imported: 0 };
    const result = await this.deps.writer.importAll(copies);
    if (!result.ok) return result;
    copies.forEach((c) => this.deps.workspace.putLocal(c));
    // Recipes that were drafts leave the public collection: drafts now live in the workspace only
    for (const copy of copies.filter((c) => !c.published_hashes)) {
      const out = await this.deps.writer.unpublish(copy, copy.written_at);
      if (out.ok) this.deps.published.removeLocal(copy.id);
    }
    return { ok: true, imported: copies.length };
  }

  private async write(
    copy: WorkCopy<K>,
    expected: number | null,
    send: (copy: WorkCopy<K>, expected: number | null) => Promise<WorkspaceWriteResult>
  ): Promise<WorkspaceWriteResult> {
    // Each write gets its own mark: the next change on this device starts from it
    const written = { ...copy, written_at: Math.max(this.deps.now(), (expected ?? 0) + 1) };
    const result = await send(written, expected);
    if (result.ok) {
      this.deps.workspace.putLocal(written);
      return result;
    }
    if (result.conflict) return { ok: false, conflict: true, error: CONFLICT };
    // Database unreachable or refused: like the catalog, the change stays on this device
    this.deps.workspace.putLocal(written);
    return { ok: false, local: true, error: `Enregistré sur cet appareil seulement. ${result.error}` };
  }
}
