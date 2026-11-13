/**
 * State of one cell of the validation grid:
 * - incomplete: a blocking check fails
 * - ready: complete, not reviewed yet
 * - approved: validated, and its content has not changed since
 * - changed: validated, then modified: to validate again (only this cell)
 * - to_fix: sent back with a note, not modified since
 */
export type CellState = 'incomplete' | 'ready' | 'approved' | 'changed' | 'to_fix';
export const CELL_STATES: readonly CellState[] = ['incomplete', 'ready', 'approved', 'changed', 'to_fix'];

/** What the reviewer decided about a cell, tied to the fingerprint of what they saw. */
export interface CellDecision {
  verdict: 'approved' | 'rejected';
  hash: string;
  note?: string;
  /** Who decided (account id) and when (ms since epoch) */
  by: string;
  at: number;
}

export type CellDecisions = Readonly<Record<string, CellDecision>>;

/** State of a cell from its current fingerprint, the last decision and its blocking checks. */
export function cellState(hash: string, decision: CellDecision | undefined, blockingFailures: number): CellState {
  if (decision?.verdict === 'approved') return decision.hash === hash ? 'approved' : 'changed';
  if (decision?.verdict === 'rejected' && decision.hash === hash) return 'to_fix';
  return blockingFailures > 0 ? 'incomplete' : 'ready';
}

/** States in which a cell waits for the reviewer. */
export const AWAITS_REVIEW: readonly CellState[] = ['ready', 'changed'];

/** Decisions after approving (or sending back) one cell. Pure: returns a new record. */
export function decideCell(
  decisions: CellDecisions,
  cell: string,
  decision: { verdict: CellDecision['verdict']; hash: string; by: string; at: number; note?: string }
): Record<string, CellDecision> {
  const note = decision.note?.trim();
  const entry: CellDecision = {
    verdict: decision.verdict,
    hash: decision.hash,
    by: decision.by,
    at: decision.at,
    ...(note ? { note: note.slice(0, 500) } : {}),
  };
  return { ...decisions, [cell]: entry };
}

/** Reads stored decisions back (unknown or malformed entries are dropped). */
export function parseCellDecisions(raw: unknown): Record<string, CellDecision> {
  const result: Record<string, CellDecision> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  for (const [cell, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const v = value as Record<string, unknown>;
    if (v.verdict !== 'approved' && v.verdict !== 'rejected') continue;
    if (typeof v.hash !== 'string' || typeof v.by !== 'string' || typeof v.at !== 'number') continue;
    result[cell] = {
      verdict: v.verdict,
      hash: v.hash,
      by: v.by,
      at: v.at,
      ...(typeof v.note === 'string' && v.note.trim() ? { note: v.note.trim().slice(0, 500) } : {}),
    };
  }
  return result;
}
