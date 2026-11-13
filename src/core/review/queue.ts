import type { CellDecisions } from './decisions';
import { parseCellId, type ReviewItems, type ReviewKind } from './parts';
import { pendingCells, reviewSnapshot, type ReviewSnapshot } from './progress';
import type { ReviewContext } from './rules';
import { stepOfCell, type WorkflowDefinition } from './workflow';

/** An item of the review queue, as stored with its work copy. */
export interface QueueEntry {
  id: string;
  kind: ReviewKind;
  snapshot: ReviewSnapshot;
  /** Who last changed the work copy */
  author?: string;
  /** Last change (ms since epoch): the oldest waits first */
  updatedAt: number;
}

export type QueueGrouping = 'item' | 'step' | 'part' | 'language' | 'kind' | 'author';

export interface QueueCell {
  entry: string;
  kind: ReviewKind;
  cell: string;
}

export interface QueueGroup {
  /** Key of the group: item id, step id, part, language, kind or author */
  key: string;
  kind?: ReviewKind;
  /** Cells waiting in this group (counted on the whole queue, not on a page) */
  cells: QueueCell[];
}

/**
 * Cells waiting for the reviewer, grouped as asked ("Étapes × دارجة : 12"), oldest items first.
 * Groups are sorted by size (largest first), then by key.
 */
export function groupQueue(
  entries: readonly QueueEntry[],
  grouping: QueueGrouping,
  workflows: Readonly<Partial<Record<ReviewKind, WorkflowDefinition>>>
): QueueGroup[] {
  const groups = new Map<string, QueueGroup>();
  const ordered = [...entries].sort((a, b) => a.updatedAt - b.updatedAt);
  for (const entry of ordered) {
    const workflow = workflows[entry.kind];
    for (const cell of pendingCells(entry.snapshot)) {
      const parsed = parseCellId(entry.kind, cell);
      if (!parsed) continue;
      const key =
        grouping === 'item'
          ? `${entry.kind}:${entry.id}`
          : grouping === 'step'
            ? `${entry.kind}:${(workflow && stepOfCell(workflow, cell)?.id) ?? '?'}`
            : grouping === 'part'
              ? `${entry.kind}:${cell}`
              : grouping === 'language'
                ? (parsed.language ?? 'common')
                : grouping === 'kind'
                  ? entry.kind
                  : (entry.author ?? '?');
      const group = groups.get(key) ?? {
        key,
        ...(grouping === 'item' || grouping === 'step' || grouping === 'part' || grouping === 'kind'
          ? { kind: entry.kind }
          : {}),
        cells: [],
      };
      group.cells.push({ entry: entry.id, kind: entry.kind, cell });
      groups.set(key, group);
    }
  }
  return [...groups.values()].sort((a, b) => b.cells.length - a.cells.length || a.key.localeCompare(b.key));
}

/** Counts shown on the menu and the home page. */
export interface QueueCounts {
  /** Cells waiting for the reviewer */
  pending: number;
  /** Items with at least one cell waiting */
  items: number;
  /** Items with a cell sent back */
  toFix: number;
  /** Items whose required cells are all validated */
  publishable: number;
}

export function queueCounts(entries: readonly QueueEntry[]): QueueCounts {
  let pending = 0;
  let items = 0;
  let toFix = 0;
  let publishable = 0;
  for (const { snapshot } of entries) {
    const waiting = pendingCells(snapshot).length;
    pending += waiting;
    if (waiting) items++;
    if (Object.values(snapshot.cells).some((c) => c.state === 'to_fix')) toFix++;
    if (snapshot.publishable) publishable++;
  }
  return { pending, items, toFix, publishable };
}

/**
 * Effect of a new workflow on the items that are online: those that would have required cells not
 * validated under it (they stay online, marked to validate again). Recomputed from the items and their
 * decisions, without reading the database.
 */
export function workflowImpact<K extends ReviewKind>(
  kind: K,
  online: readonly { id: string; item: ReviewItems[K]; decisions: CellDecisions }[],
  workflow: WorkflowDefinition,
  ctx: ReviewContext
): string[] {
  return online.filter((e) => !reviewSnapshot(kind, e.item, e.decisions, workflow, ctx).publishable).map((e) => e.id);
}
