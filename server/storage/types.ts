/**
 * The single data contract of the server: whatever the storage technology behind it
 * (Firestore today, any SQL engine later), the routes only talk to this interface.
 * Every implementation must pass the same contract suite (server/storage/contract.ts).
 */

export type CollectionName = string;

/** What changed in a collection since a given revision: the shape the client already applies. */
export interface StorageChanges {
  /** Documents written since `since` (deletion markers excluded) */
  items: Record<string, unknown>[];
  /** Ids published as deleted since `since` */
  removedIds: string[];
  /** Newest revision of the returned set (or of `since` when nothing changed) */
  revision: number;
}

/** Rules a written document must satisfy — declared per collection in collections.ts. */
export type ParseDoc = (raw: unknown) => Record<string, unknown> | null;

export interface DataStore {
  /**
   * Documents whose `revision` is strictly greater than `since`, oldest first, bounded by
   * `limit`. Deletion markers come back through `removedIds` (their ids), not through `items`.
   */
  changes(name: CollectionName, since: number, limit: number): Promise<StorageChanges>;
  /** The first document whose indexed field equals the value, null when none. */
  findFirst(name: CollectionName, field: string, value: string): Promise<Record<string, unknown> | null>;
  /** One document by id, null when absent. */
  get(name: CollectionName, id: string): Promise<Record<string, unknown> | null>;
  /** The newest revision present in the collection (0 when it holds nothing). */
  maxRevision(name: CollectionName): Promise<number>;
  /** Writes a whole document (no merge); a removed field disappears. Returns the new revision. */
  put(name: CollectionName, id: string, doc: Record<string, unknown>): Promise<number>;
  /** Publishes a deletion marker. Returns the new revision. */
  remove(name: CollectionName, id: string): Promise<number>;
}
