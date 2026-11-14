/**
 * The single data contract of the server: whatever the storage technology behind it
 * (Firestore today, any SQL engine later), the routes only talk to this interface.
 * Every implementation must pass the same contract suite (server/storage/contract.ts).
 */

export type CollectionName = string;

/** Rules a written document must satisfy — declared per collection in collections.ts. */
export type ParseDoc = (raw: unknown) => Record<string, unknown> | null;

/** What changed in a collection since a given revision: the shape the client already applies. */
export interface StorageChanges {
  /** Documents written since `since` (deletion markers excluded) */
  items: Record<string, unknown>[];
  /** Ids published as deleted since `since` */
  removedIds: string[];
  /** Newest revision of the returned set (or of `since` when nothing changed) */
  revision: number;
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
   * Documents whose `revision` is strictly greater than `since`, oldest first, bounded by
   * `limit`. Deletion markers come back through `removedIds` (their ids), not through `items`.
   * `more` tells the client the answer was bounded and it must catch up immediately.
   */
  changes(name: CollectionName, since: number, limit: number): Promise<StorageChanges>;
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
}
