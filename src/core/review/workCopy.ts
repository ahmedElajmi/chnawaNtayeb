import { parseStoredIngredient, parseStoredRecipe } from '../catalog';
import type { Versioned } from '../sync';
import { parseCellDecisions, type CellDecision } from './decisions';
import { cellHashes, type ReviewItems, type ReviewKind } from './parts';

/** What happened to a work copy (kept in its history, newest first). */
export interface ReviewEvent {
  action: 'save' | 'approve' | 'reject' | 'publish' | 'unpublish' | 'restore' | 'import';
  by: string;
  at: number;
  cells?: string[];
  note?: string;
}

/** History entries kept per item (older ones are dropped). */
export const HISTORY_LIMIT = 50;

/**
 * Work copy of an item, in the private workspace: what the team edits and the reviewer validates,
 * cell by cell. The public collection only receives validated versions (see composePublication).
 * Same id as the item it stands for.
 */
export interface WorkCopy<K extends ReviewKind = ReviewKind> extends Versioned {
  kind: K;
  content: ReviewItems[K];
  /** Last decision of the reviewer on each cell */
  decisions: Record<string, CellDecision>;
  /** Fingerprints of the version online (absent = never published or taken offline) */
  published_hashes?: Record<string, string>;
  published_at?: number;
  history: ReviewEvent[];
  updated_by: string;
  updated_at: number;
  /**
   * Set by the device on every write (ms since epoch): a write says which one it starts from, and is
   * refused when the stored copy was written meanwhile by someone else (no lost update).
   */
  written_at: number;
}

const ACTIONS: readonly ReviewEvent['action'][] = [
  'save',
  'approve',
  'reject',
  'publish',
  'unpublish',
  'restore',
  'import',
];

const readContent: { [K in ReviewKind]: (raw: unknown) => ReviewItems[K] | null } = {
  recipe: parseStoredRecipe,
  ingredient: parseStoredIngredient,
};

/** Content of an item read through its own domain rules (null when it is not readable). */
export function parseReviewContent<K extends ReviewKind>(kind: K, raw: unknown): ReviewItems[K] | null {
  return readContent[kind](raw) as ReviewItems[K] | null;
}

function parseHistory(raw: unknown): ReviewEvent[] {
  if (!Array.isArray(raw)) return [];
  const events: ReviewEvent[] = [];
  for (const e of raw.slice(0, HISTORY_LIMIT)) {
    if (!e || typeof e !== 'object') continue;
    const v = e as Record<string, unknown>;
    if (!ACTIONS.includes(v.action as ReviewEvent['action'])) continue;
    if (typeof v.by !== 'string' || typeof v.at !== 'number') continue;
    const cells = Array.isArray(v.cells) ? v.cells.filter((c): c is string => typeof c === 'string') : [];
    const note = typeof v.note === 'string' ? v.note.trim().slice(0, 500) : '';
    events.push({
      action: v.action as ReviewEvent['action'],
      by: v.by,
      at: v.at,
      ...(cells.length ? { cells } : {}),
      ...(note ? { note } : {}),
    });
  }
  return events;
}

function parseHashes(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const hashes: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (typeof v === 'string') hashes[k] = v;
  return hashes;
}

/** Work copy read from outside (database, device copy, backup): null when it is not usable. */
export function parseWorkCopy<K extends ReviewKind>(kind: K, raw: unknown): WorkCopy<K> | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.id !== 'string' || v.kind !== kind) return null;
  const content = parseReviewContent(kind, v.content);
  if (!content || content.id !== v.id) return null;
  const published_hashes = parseHashes(v.published_hashes);
  return {
    id: v.id,
    kind,
    content,
    decisions: parseCellDecisions(v.decisions),
    ...(published_hashes ? { published_hashes } : {}),
    ...(typeof v.published_at === 'number' ? { published_at: v.published_at } : {}),
    history: parseHistory(v.history),
    updated_by: typeof v.updated_by === 'string' ? v.updated_by : '?',
    updated_at: typeof v.updated_at === 'number' ? v.updated_at : 0,
    written_at: typeof v.written_at === 'number' ? v.written_at : 0,
    ...(typeof v.revision === 'number' ? { revision: v.revision } : {}),
  };
}

export const parseWorkCopies =
  <K extends ReviewKind>(kind: K) =>
  (list: readonly unknown[]): WorkCopy<K>[] =>
    list.map((raw) => parseWorkCopy(kind, raw)).filter((c): c is WorkCopy<K> => c !== null);

/** History with a new event first, limited to HISTORY_LIMIT entries. */
export function withEvent(history: readonly ReviewEvent[], event: ReviewEvent): ReviewEvent[] {
  return [event, ...history].slice(0, HISTORY_LIMIT);
}

/** True when the work copy differs from the version online (or nothing is online). */
export function hasPendingChanges<K extends ReviewKind>(copy: WorkCopy<K>): boolean {
  if (!copy.published_hashes) return true;
  const now = cellHashes(copy.kind, copy.content);
  return Object.keys(now).some((cell) => now[cell] !== copy.published_hashes![cell]);
}

/**
 * Work copy for an item already online (first switch to the workflow, backup): every cell is marked
 * validated, since this version is what the public already sees.
 */
export function workCopyFromPublished<K extends ReviewKind>(
  kind: K,
  item: ReviewItems[K],
  by: string,
  at: number
): WorkCopy<K> {
  const hashes = cellHashes(kind, item);
  const decisions: Record<string, CellDecision> = {};
  for (const [cell, hash] of Object.entries(hashes)) decisions[cell] = { verdict: 'approved', hash, by, at };
  return {
    id: item.id,
    kind,
    content: item,
    decisions,
    published_hashes: hashes,
    published_at: at,
    history: [{ action: 'import', by, at }],
    updated_by: by,
    updated_at: at,
    written_at: at,
  };
}

/** Work copy for an item never published (a draft): nothing validated yet. */
export function newWorkCopy<K extends ReviewKind>(kind: K, item: ReviewItems[K], by: string, at: number): WorkCopy<K> {
  return {
    id: item.id,
    kind,
    content: item,
    decisions: {},
    history: [{ action: 'save', by, at }],
    updated_by: by,
    updated_at: at,
    written_at: at,
  };
}

/** A validated version, kept in the history of an item (never modified). */
export interface PublishedVersion<K extends ReviewKind = ReviewKind> {
  id: string;
  item_id: string;
  kind: K;
  content: ReviewItems[K];
  published_at: number;
  published_by: string;
  note?: string;
}

/** A validated version from the history of an item, read back from outside (null when unusable). */
export function parsePublishedVersion<K extends ReviewKind>(kind: K, raw: unknown): PublishedVersion<K> | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.id !== 'string' || typeof v.item_id !== 'string' || v.kind !== kind) return null;
  if (typeof v.published_at !== 'number' || typeof v.published_by !== 'string') return null;
  const content = parseReviewContent(kind, v.content);
  if (!content || content.id !== v.item_id) return null;
  const note = typeof v.note === 'string' ? v.note.trim().slice(0, 200) : '';
  return {
    id: v.id,
    item_id: v.item_id,
    kind,
    content,
    published_at: v.published_at,
    published_by: v.published_by,
    ...(note ? { note } : {}),
  };
}
