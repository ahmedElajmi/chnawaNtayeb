import { cellState, AWAITS_REVIEW, type CellDecisions, type CellState } from './decisions';
import { cellHash, copyCell, parseCellId, reviewCells, type ReviewItems, type ReviewKind } from './parts';
import { checkCell, type ReviewContext, type RuleLevel, type RuleResult } from './rules';
import { workflowCells, type WorkflowDefinition } from './workflow';

export interface CellReview {
  state: CellState;
  hash: string;
  checks: RuleResult[];
}

/**
 * Where an item stands in its workflow. Computed when the item (or the workflow) changes and stored
 * with the work copy, so lists and the review queue only read it.
 */
export interface ReviewSnapshot {
  cells: Record<string, CellReview>;
  /** Required cells validated / required cells */
  approvedRequired: number;
  required: number;
  /** Required cells failing a blocking check */
  incompleteRequired: number;
  /** Validation progress, 0–100 (required cells) */
  percent: number;
  /** Checks passed among all the checks of the workflow's cells, 0–100 */
  completeness: number;
  /** Every required cell is validated */
  publishable: boolean;
  /** First step with a cell not validated yet (null when everything is validated) */
  currentStep: string | null;
  /** First cell not validated, in workflow order: where "Resume" opens */
  nextCell: string | null;
}

export function reviewSnapshot<K extends ReviewKind>(
  kind: K,
  item: ReviewItems[K],
  decisions: CellDecisions,
  workflow: WorkflowDefinition,
  ctx: ReviewContext
): ReviewSnapshot {
  const cells: Record<string, CellReview> = {};
  let passedChecks = 0;
  let totalChecks = 0;
  for (const id of workflowCells(workflow)) {
    const cell = parseCellId(kind, id);
    if (!cell) continue;
    const hash = cellHash(kind, item, cell);
    const checks = checkCell(kind, item, cell, ctx, workflow.ruleLevels);
    const blocking = checks.filter((c) => c.level === 'blocking' && !c.passed).length;
    cells[id] = { state: cellState(hash, decisions[id], blocking), hash, checks };
    totalChecks += checks.length;
    passedChecks += checks.filter((c) => c.passed).length;
  }
  const required = workflow.requiredCells.filter((id) => cells[id]);
  const approvedRequired = required.filter((id) => cells[id].state === 'approved').length;
  const currentStep = workflow.steps.find((s) => s.cells.some((c) => cells[c] && cells[c].state !== 'approved'));
  const nextCell = workflowCells(workflow).find((c) => cells[c] && cells[c].state !== 'approved') ?? null;
  return {
    cells,
    approvedRequired,
    required: required.length,
    incompleteRequired: required.filter((id) => cells[id].state === 'incomplete').length,
    percent: required.length ? Math.round((approvedRequired / required.length) * 100) : 100,
    completeness: totalChecks ? Math.round((passedChecks / totalChecks) * 100) : 100,
    publishable: approvedRequired === required.length,
    currentStep: currentStep?.id ?? null,
    nextCell,
  };
}

/**
 * Whether a step can be reviewed now: always, unless the workflow is sequential, where a step opens
 * once every required cell of the previous steps is validated.
 */
export function isStepOpen(workflow: WorkflowDefinition, snapshot: ReviewSnapshot, stepId: string): boolean {
  if (!workflow.sequential) return true;
  for (const step of workflow.steps) {
    if (step.id === stepId) return true;
    const blocked = step.cells.some(
      (c) => workflow.requiredCells.includes(c) && snapshot.cells[c] && snapshot.cells[c].state !== 'approved'
    );
    if (blocked) return false;
  }
  return false;
}

/** Cells waiting for the reviewer (ready or changed). */
export function pendingCells(snapshot: ReviewSnapshot): string[] {
  return Object.entries(snapshot.cells)
    .filter(([, c]) => AWAITS_REVIEW.includes(c.state))
    .map(([id]) => id);
}

/** Cells that can be validated together: waiting, with no blocking check failing. */
export function batchApprovableCells(snapshot: ReviewSnapshot): string[] {
  return pendingCells(snapshot).filter((id) =>
    snapshot.cells[id].checks.every((c) => c.level !== 'blocking' || c.passed)
  );
}

/**
 * Version to publish: the work copy, where every cell that is not validated is taken from the version
 * online (or emptied when there is none). Null when a required cell is not validated, or when a
 * language that is not validated cannot wait (partial publication switched off).
 */
export function composePublication<K extends ReviewKind>(
  kind: K,
  draft: ReviewItems[K],
  online: ReviewItems[K] | null,
  snapshot: ReviewSnapshot,
  workflow: WorkflowDefinition
): ReviewItems[K] | null {
  if (!snapshot.publishable) return null;
  let result = draft;
  for (const [id, review] of Object.entries(snapshot.cells)) {
    if (review.state === 'approved') continue;
    const cell = parseCellId(kind, id);
    if (!cell) continue;
    if (cell.language && !workflow.partialLanguages) return null;
    result = copyCell(kind, result, online, cell);
  }
  return result;
}

/**
 * Status of an item, shown in the lists and used by their filters:
 * - online: online, nothing pending
 * - online_pending: online, with changes not published yet
 * - to_fix: a cell was sent back
 * - publishable: every required cell validated, never published
 * - incomplete: a required cell fails a blocking check
 * - in_review: some cells validated, others still waiting
 * - ready: complete, nothing validated yet
 */
export type ItemStatus = 'online' | 'online_pending' | 'to_fix' | 'publishable' | 'in_review' | 'incomplete' | 'ready';
export const ITEM_STATUSES: readonly ItemStatus[] = [
  'online',
  'online_pending',
  'to_fix',
  'publishable',
  'in_review',
  'incomplete',
  'ready',
];

export function itemStatus(snapshot: ReviewSnapshot, online: boolean, pending: boolean): ItemStatus {
  if (online && !pending) return 'online';
  const states = Object.values(snapshot.cells).map((c) => c.state);
  if (states.includes('to_fix')) return 'to_fix';
  if (online) return 'online_pending';
  if (snapshot.publishable) return 'publishable';
  if (snapshot.incompleteRequired > 0) return 'incomplete';
  if (states.includes('approved')) return 'in_review';
  return 'ready';
}

/** A check that fails on a cell: what is missing to make the item complete. */
export interface MissingData {
  cell: string;
  rule: string;
}

export interface ContentCompleteness {
  /** Checks passed among every check of every cell (optional languages included), 0–100 */
  percent: number;
  missing: MissingData[];
}

/**
 * How complete the data of an item is, whatever its validation: every cell of the grid (optional
 * languages and variants included) and every check that is not switched off, advice included. An item
 * can be validated at 100 % and complete at 70 %. Whether ingredients are online is a publication matter,
 * not data, so it is left out.
 */
export function contentCompleteness<K extends ReviewKind>(
  kind: K,
  item: ReviewItems[K],
  ctx: ReviewContext,
  levels: Readonly<Record<string, RuleLevel>> = {}
): ContentCompleteness {
  const dataCtx: ReviewContext = { ingredients: ctx.ingredients };
  let total = 0;
  const missing: MissingData[] = [];
  for (const cell of reviewCells(kind)) {
    for (const check of checkCell(kind, item, cell, dataCtx, levels)) {
      total += 1;
      if (!check.passed) missing.push({ cell: cell.id, rule: check.rule });
    }
  }
  return { percent: total ? Math.round(((total - missing.length) / total) * 100) : 100, missing };
}
