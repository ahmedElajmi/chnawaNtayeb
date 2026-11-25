/**
 * The single data contract of the server: whatever the storage technology behind it
 * (Firestore today, any SQL engine later), the routes only talk to this interface.
 * Every implementation must pass the same contract suite (server/storage/contract.ts).
 */

export type CollectionName = string;

/** Rules a written document must satisfy — declared per collection in collections.ts. */
export type ParseDoc = (raw: unknown) => Record<string, unknown> | null;

/**
 * The logical position of a client in a collection's change feed: the last change actually
 * delivered, modification or deletion marker alike. The single pagination authority —
 * implementations never invent a second one. A plain number is the legacy cursor (strict
 * “everything after this revision”, no id) that the negotiation keeps supporting.
 */
export interface SyncCursor {
  revision: number;
  /** Id of the last delivered change; absent = resume inclusively at the whole revision */
  id?: string;
}
/** What `changes` accepts: a structured cursor, or a legacy number. */
export type ChangeCursor = SyncCursor | number;

/** Normalizes the legacy number shape into the structured one (strict resume, no id). */
export function normalizeCursor(cursor: ChangeCursor): SyncCursor {
  if (typeof cursor === 'number') return { revision: Math.max(0, cursor) };
  return { revision: Math.max(0, cursor.revision), ...(cursor.id !== undefined ? { id: cursor.id } : {}) };
}

/** What changed in a collection since a given position: the shape the client applies. */
export interface StorageChanges {
  /** Documents written since `since` (deletion markers excluded) */
  items: Record<string, unknown>[];
  /** Ids published as deleted since `since` */
  removedIds: string[];
  /** Newest revision of the returned set (or of `since` when nothing changed) */
  revision: number;
  /** The position to pass back to resume exactly after the last delivered change */
  cursor?: SyncCursor;
  /** True when the answer reached the page limit: the client polls again right away */
  more?: boolean;
}

/** One document write inside a conditional batch (`commit`). */
export interface WriteOp {
  name: CollectionName;
  id: string;
  doc: Record<string, unknown>;
}

/** The condition a `commit` checks before writing anything: the field must still equal `expected`. */
export interface WriteGuard {
  name: CollectionName;
  id: string;
  /** Field compared against `expected` (missing field or deleted doc count as `null`) */
  field: string;
  expected: number | null;
}

export type CommitResult = { ok: true; revision: number } | { ok: false; conflict: boolean };

/** The outcome of one `transact` operation: the next value to store plus the result to return. */
export interface TransactOutcome<T> {
  /** The document to store after the operation (same reference as `current` = write nothing) */
  next: Record<string, unknown> | null;
  /** The value handed back to the caller once the transaction committed */
  result: T;
}

/** A paged, filtered listing (backoffice directory): equality or e-mail-style prefix. */
export interface DirectoryQuery {
  /** Equality filter on one field, null = no filter */
  where?: { field: string; value: string } | null;
  /** Prefix match on one field (`value` … `value + \uf8ff`), null = no prefix */
  prefix?: { field: string; value: string } | null;
  /** First id of the next page (documents ordered after this id), null from the beginning */
  after?: string | null;
  limit: number;
}

export interface DirectoryPage {
  items: Record<string, unknown>[];
  /** The whole filtered set (never the page length) */
  total: number;
  /** Id to pass back as `after`, null when there is no more */
  nextCursor: string | null;
}

export interface DataStore {
  /**
   * The change feed in contract order: every change — modification or deletion marker —
   * whose position is after `cursor`, oldest first, bounded by `limit` (a whole revision
   * group may exceed the limit rather than be cut: the limit is soft). Deletion markers
   * come back through `removedIds`, not through `items`. `cursor` is the exact position to
   * pass back: resuming from it can never lose a document, even when several share the
   * same revision. `more` tells the client the answer was bounded and it must catch up now.
   */
  changes(name: CollectionName, cursor: ChangeCursor, limit: number): Promise<StorageChanges>;
  /** The first document whose indexed field equals the value, null when none. */
  findFirst(name: CollectionName, field: string, value: string): Promise<Record<string, unknown> | null>;
  /** Every document whose field equals the value (bounded by `limit`), revision order. */
  findWhere(name: CollectionName, field: string, value: string, limit: number): Promise<Record<string, unknown>[]>;
  /** One paged, filtered listing with an exact total (backoffice directory). */
  page(name: CollectionName, query: DirectoryQuery): Promise<DirectoryPage>;
  /** Every id of a collection, deletion markers included (a `replace` must know what to drop). */
  ids(name: CollectionName): Promise<string[]>;
  /** One document by id, null when absent. */
  get(name: CollectionName, id: string): Promise<Record<string, unknown> | null>;
  /** The newest revision present in the collection (0 when it holds nothing). */
  maxRevision(name: CollectionName): Promise<number>;
  /** Writes a whole document (no merge); a removed field disappears. Returns the new revision. */
  put(name: CollectionName, id: string, doc: Record<string, unknown>): Promise<number>;
  /** Publishes a deletion marker. Returns the new revision. */
  remove(name: CollectionName, id: string): Promise<number>;
  /**
   * Writes several documents in one atomic batch. When a `guard` is given, nothing is written
   * unless the guarded field still equals `expected` (two editors never overwrite each other,
   * a publication never lands without its version). A failed guard writes nothing.
   */
  commit(ops: WriteOp[], guard?: WriteGuard): Promise<CommitResult>;
  /**
   * Reads one document and rewrites it inside a transaction: `operation` receives the stored
   * document as it is at commit time (null when absent or deleted) and returns what to store
   * plus the result to hand back. The read and the write are atomic: two concurrent `transact`
   * calls on the same document are serialised — the second operation sees the first one's
   * write, so a read-merge-write can never overwrite a change it did not see.
   *
   * `operation` must be pure (no side effects, no randomness): a contended backend re-runs it.
   * Returning the `current` reference itself as `next` writes nothing (no revision bump).
   * A deletion or a multi-document write goes through `remove` / `commit` instead.
   * `id` and `revision` are owned by the storage layer: they are stripped from `next`.
   */
  transact<T>(
    name: CollectionName,
    id: string,
    operation: (current: Record<string, unknown> | null) => TransactOutcome<T>
  ): Promise<T>;
}
