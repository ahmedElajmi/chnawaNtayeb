import type { DayPlan } from '@/core/planning';
import type { AccountSummary, PasswordPolicy, RegistrationInput, UserProfile } from '@/core/accounts';

export type { PasswordPolicy };
import type { GroceryHistoryEntry, GroceryList } from '@/core/grocery';
import type { MatchingConfig, MatchingScenario } from '@/core/matching';
import type { UserPreferences } from '@/core/preferences';
import type { AppTheme } from '@/core/theme';
import type { CollectionChanges, Versioned } from '@/core/sync';
import type { PublishedVersion, ReviewItems, ReviewKind, ReviewSettings, TeamMember, WorkCopy } from '@/core/review';
import type { SearchDocument, SearchHit } from '@/core/search';

/**
 * Ports: what the application needs from the outside world.
 * Implementations (adapters) live in src/infrastructure and are wired in src/app/container.ts.
 * Ports speak the language of the domain only: no database, SDK or storage type or term.
 * Changing the database means writing new adapters for these interfaces (each one must pass
 * its contract test in src/infrastructure/contracts) and swapping them in src/app/container.ts.
 */

// ---------------------------------------------------------------------------
// Shared collections (recipes, ingredients...): one generic mechanism for all of them.
// The database is the source of truth, followed incrementally (only what changed since
// the newest revision known on the device); the device keeps a copy for offline use.
// ---------------------------------------------------------------------------

/** Raw entries changed in a shared collection: always read by the domain before use. */
export interface RemoteChanges {
  /** Entries written since the last call (deletion markers included), as stored */
  items: unknown[];
  /** Ids removed outright */
  removedIds: string[];
  /** True when `items` is the whole collection (first answer of a full read) */
  complete: boolean;
}

/** A shared collection published by the admin, followed live. */
export interface SharedCollectionSource {
  /**
   * Sends what changed since `sinceRevision` (the whole collection when null), then every
   * later change, until the returned function is called. `onError` when it cannot be read.
   */
  follow(sinceRevision: number | null, onChanges: (changes: RemoteChanges) => void, onError: () => void): () => void;
}

/** Device copy of a shared collection, with the newest revision it contains. */
export interface CollectionCopy<T> {
  items: T[];
  /** Newest revision known; null = never followed incrementally (read everything next time) */
  revision: number | null;
  /** When the copy was last updated from the database (ms since epoch) */
  savedAt: number;
}

/** Offline copy of a shared collection (large volumes: stored item by item). */
export interface LocalCollectionCache<T extends Versioned> {
  /** Raw copy (read through the domain by the store); null when there is none. */
  load(): Promise<CollectionCopy<unknown> | null>;
  /** Replaces the whole copy. */
  replace(copy: CollectionCopy<T>): Promise<void>;
  /** Applies changes to the copy (only the changed items are written). */
  update(changes: CollectionChanges<T>, meta: Omit<CollectionCopy<T>, 'items'>): Promise<void>;
}

/** Admin writes to a shared collection. Every write is complete (no merge) and versioned by the database. */
export interface SharedCollectionWriter<T extends Versioned> {
  put(item: T): Promise<WriteResult>;
  /** Publishes a deletion (other devices remove the item too). */
  remove(id: string): Promise<WriteResult>;
  /** Writes many items (grouped, for large volumes). */
  putAll(items: T[]): Promise<WriteResult>;
  /** Makes the collection exactly `items`: the others are removed. */
  replaceAll(items: T[]): Promise<WriteResult & { removed?: number }>;
  /** True when the collection holds nothing yet (reads at most one entry). */
  isEmpty(): Promise<boolean>;
}

/**
 * Full-text search over catalog items (recipes or ingredients). Implementations may run on the
 * device or on a server; documents and queries are already normalized by the core
 * (`@/core/search`), so every engine sees the same words.
 */
export interface SearchEngine {
  /** Replaces the whole index. */
  rebuild(documents: SearchDocument[]): Promise<void>;
  /** Adds new documents and replaces the ones with the same id (no word of the old version remains). */
  upsert(documents: SearchDocument[]): Promise<void>;
  remove(ids: string[]): Promise<void>;
  /**
   * Ids whose documents contain every word of the query (a word may be the beginning of an
   * indexed word), best first. An empty query finds nothing.
   */
  search(query: string): Promise<SearchHit[]>;
}

/** The user's own kitchen data. */
export interface KitchenRepository {
  loadFridge(): string[];
  saveFridge(ids: string[]): void;
  loadPantry(): string[];
  savePantry(ids: string[]): void;
  loadFavorites(): string[];
  saveFavorites(ids: string[]): void;
  loadWeeklyPlan(): DayPlan[];
  saveWeeklyPlan(plan: DayPlan[]): void;
  /** The named shopping lists of this scope, with the id of the active one. */
  loadGroceryLists(): { lists: GroceryList[]; activeId: string };
  /** Replaces the named shopping lists and the active one (complete write, no merge). */
  saveGroceryLists(state: { lists: GroceryList[]; activeId: string }): void;
}

// ---------------------------------------------------------------------------
// Kitchen sync: the personal data of a signed-in account (fridge, favorites, menu,
// shopping list, preferences) kept on the server, one document per account, and the
// bookkeeping of what this device changed since its last confirmed push.
// ---------------------------------------------------------------------------

/** One section of the account's kitchen as the server keeps it (newest-write-wins). */
export interface RemoteKitchenSection<T> {
  value: T;
  /** Client time in ms, carried with the section; the newest one wins between devices */
  updatedAt: number;
}

export interface RemoteKitchenDocument {
  favorites?: RemoteKitchenSection<string[]>;
  fridge?: RemoteKitchenSection<string[]>;
  pantry?: RemoteKitchenSection<string[]>;
  weeklyPlan?: RemoteKitchenSection<DayPlan[]>;
  /** The named shopping lists and the active one, one newest-write-wins section */
  groceryLists?: RemoteKitchenSection<{ lists: GroceryList[]; activeId: string }>;
  preferences?: RemoteKitchenSection<UserPreferences>;
}

export type RemoteKitchenSections = Partial<RemoteKitchenDocument>;

/** The signed-in account's kitchen kept on the server (never reachable for guests). */
export interface KitchenSyncGateway {
  /** The stored document; null when the account has none yet. Throws when unreachable. */
  pull(): Promise<RemoteKitchenDocument | null>;
  /**
   * Sends the changed sections; the server keeps a section only when it is newer than the
   * stored one and answers with the document after the merge. Throws when unreachable.
   */
  push(sections: RemoteKitchenSections): Promise<RemoteKitchenDocument>;
}

/** Archived shopping lists of the account, kept on the server (newest first). */
export interface GroceryHistoryGateway {
  /** The archived lists of the signed-in account. Throws when unreachable. */
  list(): Promise<GroceryHistoryEntry[]>;
  /** Archives one entry (overwrites when the same id is sent again). Throws when refused. */
  save(entry: GroceryHistoryEntry): Promise<void>;
  /** Removes one archived list. Throws when refused. */
  remove(entryId: string): Promise<void>;
}

/** Sync bookkeeping of the kitchen data on this device (what changed here, and when). */
export interface KitchenSyncLedger {
  /** True when this device holds kitchen data (favorites, fridge, pantry or list). */
  hasData(): boolean;
  /** Sections changed locally and not confirmed by the server yet. */
  pending(): string[];
  /** Last local change per section, in ms (a missing key = never changed here). */
  sectionTimes(): Record<string, number>;
  /** When the preferences were last changed on this device (null = never). */
  preferencesChangedAt(): number | null;
  /** When the preferences were last confirmed by the server (null = never). */
  preferencesSyncedAt(): number | null;
  /** Confirms sections as pushed (leaves the pending list). */
  confirm(sections: string[]): void;
  /** Confirms the preferences mirror as pushed. */
  confirmPreferences(at: number): void;
  /** Records the time of a section adopted from the server (so it is not adopted again). */
  setSectionTime(section: string, at: number): void;
  /**
   * Saves applied from another device must not be marked as pending: suspended during a
   * merge; the returned function resumes the normal bookkeeping.
   */
  suspend(): () => void;
}

export type WriteResult = { ok: true } | { ok: false; error: string };

/** One published version of the matching engine settings. */
export interface StoredMatchingSettings {
  version: number;
  /** Raw settings as stored: always read through `resolveMatchingConfig` */
  config: unknown;
  updatedAt: string;
  note: string;
}

/** Matching engine settings, stored in the database with their history (source of truth). */
export interface MatchingSettingsRepository {
  /** Active settings; null when none were ever published. Throws when unreachable. */
  loadActive(): Promise<StoredMatchingSettings | null>;
  /**
   * Sends the active settings now and every time they are published again (null when none),
   * until the returned function is called.
   */
  followActive(onChange: (settings: StoredMatchingSettings | null) => void): () => void;
  /** Publishes new settings as the next version (the previous ones stay in the history). */
  publish(config: MatchingConfig, note: string): Promise<WriteResult & { version?: number }>;
  /** Latest versions, newest first. */
  listVersions(limit: number): Promise<StoredMatchingSettings[]>;
}

/** Copy of the active settings on the device, for offline use only. */
export interface MatchingSettingsCache {
  read(): StoredMatchingSettings | null;
  write(settings: StoredMatchingSettings): void;
}

/** The chef's quality scenarios, managed in the backoffice (database = source of truth). */
export interface MatchingScenarioRepository {
  /** Every scenario, oldest first, as stored (read through `parseScenario`); null when unreachable. */
  list(): Promise<unknown[] | null>;
  /** Creates or replaces one scenario. */
  save(scenario: MatchingScenario): Promise<WriteResult>;
  remove(scenarioId: string): Promise<WriteResult>;
  /** Replaces the whole list (restoring an export), keeping its order. */
  replaceAll(scenarios: MatchingScenario[]): Promise<WriteResult>;
}

/** User preferences kept on the device (language, theme, pantry...). `at` records the
 *  change time for the sync (a value adopted from the server carries its own time). */
export interface PreferencesRepository {
  load(): UserPreferences;
  save(patch: Partial<UserPreferences>, at?: number): void;
}

/** Resolved CSS of the active theme, read before the app starts (avoids a flash of the wrong colors). */
export interface ThemeSnapshot {
  dark: boolean;
  vars: Record<string, string>;
  cardShape: string;
  pattern: string;
}

/** Visual themes published by the admin (built-in themes live in the code). */
export interface ThemeRepository {
  /** Last known published themes (offline copy) */
  cached(): AppTheme[];
  /** Published themes; refreshes the offline copy, falls back to it when offline */
  fetchPublished(): Promise<AppTheme[]>;
  /** Every theme, drafts included (admin); null when unreachable */
  fetchAll(): Promise<AppTheme[] | null>;
  save(theme: AppTheme): Promise<WriteResult>;
  remove(themeId: string): Promise<WriteResult>;
  saveActiveSnapshot(snapshot: ThemeSnapshot): void;
}

/** A signed-in visitor (no provider types leak into the UI). */
export interface AppUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
}

/** Why a visitor sign-in or sign-up failed (translated by the interface). */
export type UserAuthError =
  | 'invalid-credentials'
  | 'email-in-use'
  | 'weak-password'
  | 'invalid-email'
  | 'too-many-attempts'
  | 'locked'
  | 'network'
  | 'disabled'
  | 'unknown';

/** Password rules of the site, shown live in the registration and change forms. */
export interface PasswordCriteria {
  minLength: number;
  digit: boolean;
  uppercase: boolean;
  special: boolean;
}

export interface UserAuthGateway {
  /** Minimum password length accepted when creating an account */
  readonly minPasswordLength: number;
  /** The live password rules of the site (the backoffice configures them); defaults when unreachable */
  passwordCriteria(): Promise<PasswordCriteria>;
  /** Calls `listener` now and on every sign-in / sign-out; returns the unsubscribe function */
  subscribe(listener: (user: AppUser | null) => void): () => void;
  loginAsGuest(): Promise<void>;
  loginWithEmail(email: string, password: string): Promise<void>;
  /** Creates the account and its profile (name, phone, address, preferred language) */
  register(input: RegistrationInput): Promise<void>;
  logout(): Promise<void>;
  /** Why a sign-in failed, as a code the interface translates */
  errorCode(error: unknown): UserAuthError;
  /** Technical account of a super-admin session (signed in through the server) */
  isSuperAdminAccount(user: AppUser): boolean;
  /** Changes the password, re-checking the current one */
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
}

/** Profile of any signed-in account (clients and employees alike), read and edited by its owner. */
export interface AccountProfileRepository {
  /** The stored profile of one account, null when it has none yet. */
  read(uid: string): Promise<UserProfile | null>;
  /** Writes the whole profile back (complete document, no merge). */
  write(profile: UserProfile): Promise<boolean>;
}

/**
 * Backoffice directory of every account (clients and employees): paged by uid, searched by
 * e-mail prefix. Never exposes the favorites or the fridge of anyone.
 */
export type AccountTypeFilter = 'all' | 'client' | 'employee';

export interface AccountDirectoryQuery {
  /** Show one kind of account, or every one */
  type: AccountTypeFilter;
  /** E-mail prefix (empty: no search) */
  search?: string;
  limit: number;
  /** First uid of the next page (startAfter), null from the beginning */
  cursor?: string | null;
}

export interface AccountDirectoryPage {
  items: AccountSummary[];
  /** Whole filtered set (never the page length) */
  total: number;
  /** uid to pass back as `cursor`, null when there is no more */
  nextCursor: string | null;
}

export interface AccountDirectoryRepository {
  list(query: AccountDirectoryQuery): Promise<AccountDirectoryPage>;
  /** Clears the lockout of an account (super-admin or manager session on the server). */
  unlock(uid: string): Promise<boolean>;
}

/** Password policy of the site: read and saved by the super admin in the backoffice. */
export interface PasswordPolicyGateway {
  read(): Promise<PasswordPolicy>;
  save(policy: PasswordPolicy): Promise<void>;
}

/** How often the devices poll the change feed (seconds), configured in the backoffice. */
export interface PollingSettings {
  intervalSeconds: number;
}

export interface PollingSettingsGateway {
  read(): Promise<PollingSettings>;
  save(intervalSeconds: number): Promise<void>;
}

/** Creates staff accounts on the server (super-admin session required): the client never mints a right. */
export interface AccountCreationGateway {
  /** Returns the temporary password exactly once, to hand to the employee. */
  createEmployee(input: {
    email: string;
    displayName: string;
  }): Promise<
    | { ok: true; uid: string; temporaryPassword: string }
    | { ok: false; error: 'email-in-use' | 'invalid-email' | 'server' }
  >;
}

export interface CatalogInitStats {
  recipes: number;
  ingredients: number;
  deleted: number;
}

export interface FridgeScanResult {
  /** Detected items: catalog id when recognized, French name otherwise */
  ingredients: { ingredient_id: string | null; name_fr: string }[];
  suggestions: string[];
}

/** Recognizes ingredients on a photo (AI on the server). Throws an Error with a readable message. */
export interface VisionGateway {
  scanFridge(
    image: { dataUrl: string; mimeType: string },
    catalog: { id: string; name: string }[]
  ): Promise<FridgeScanResult>;
}

/** ok: what was restored (invalid entries skipped); not ok: the file is not a backup. */
export type BackupImportResult = { ok: true; recipes: number; ingredients: number; skipped: number } | { ok: false };

/** Whether admin edits reach the shared cloud catalog or stay on this device. */
export type CloudStatus = 'connected' | 'local-only';

/**
 * Why a super-admin sign-in failed (the interface turns it into a text in the current language):
 * server out of reach, wrong credentials, too many attempts, or access not available on the server.
 */
export type BackofficeLoginError = 'unreachable' | 'invalid' | 'too-many-attempts' | 'unavailable';

export type BackofficeLoginResult = { ok: true; cloud: CloudStatus } | { ok: false; error: BackofficeLoginError };

/** Admin (super-admin) session. Only the server decides who is admin. */
export interface BackofficeSessionGateway {
  login(username: string, password: string): Promise<BackofficeLoginResult>;
  hasStoredSession(): boolean;
  verifySession(): Promise<boolean>;
  connectCloud(): Promise<CloudStatus>;
  logout(): Promise<void>;
}

/** Unsaved recipe edits, kept on this device so that closing the editor by mistake loses nothing. */
export interface StoredRecipeDraft {
  /** Raw recipe as stored: always read through `parseStoredRecipe` */
  recipe: unknown;
  savedAt: string;
}

export interface RecipeDraftRepository {
  /** Draft kept for this key (a recipe id, or "new" for a recipe being created); null when none. */
  load(key: string): StoredRecipeDraft | null;
  save(key: string, draft: StoredRecipeDraft): void;
  discard(key: string): void;
}

// ---------------------------------------------------------------------------
// Content validation (workflow): a private workspace per kind of content, followed like any shared
// collection (SharedCollectionSource), and the review settings (workflows + roles).
// ---------------------------------------------------------------------------

export type WorkspaceWriteResult = WriteResult & {
  /** Someone else saved this item meanwhile: nothing was written */
  conflict?: boolean;
  /** The database could not be reached: the change is kept on this device only */
  local?: boolean;
};

/** Writes to the workspace of one kind of content. Every write is complete and versioned by the database. */
export interface ReviewWorkspaceWriter<K extends ReviewKind> {
  /**
   * Saves a work copy, unless the stored one is no longer the one this change starts from:
   * `expected` = its `written_at` (null = the item must not exist in the workspace yet).
   */
  save(copy: WorkCopy<K>, expected: number | null): Promise<WorkspaceWriteResult>;
  /** Writes many work copies at once (first switch to the workflow); existing ones are kept. */
  importAll(copies: WorkCopy<K>[]): Promise<WriteResult & { imported?: number }>;
  /** Removes a work copy (the item is deleted). */
  remove(id: string): Promise<WriteResult>;
  /**
   * In one atomic write: the public item, its work copy and a new version in the history.
   * Refused (conflict) like `save`.
   */
  publish(
    item: ReviewItems[K],
    copy: WorkCopy<K>,
    version: PublishedVersion<K>,
    expected: number | null
  ): Promise<WorkspaceWriteResult>;
  /** In one atomic write: the item leaves the public collection (deletion marker) and its work copy is kept. */
  unpublish(copy: WorkCopy<K>, expected: number | null): Promise<WorkspaceWriteResult>;
  /** Validated versions of an item, newest first (raw: read back by the domain). */
  listVersions(itemId: string): Promise<unknown[]>;
}

/** Review settings as stored: raw document, always read through `resolveReviewSettings`. */
export interface StoredReviewSettings {
  version: number;
  settings: unknown;
  updatedAt: string;
  note: string;
}

/** Workflows and roles, edited by the admin; every saved version is kept. */
export interface ReviewSettingsRepository {
  /** Follows the active settings live; returns the stop function. */
  follow(onChange: (active: StoredReviewSettings | null) => void, onError: () => void): () => void;
  publish(settings: ReviewSettings, note: string): Promise<WriteResult & { version?: number }>;
  listVersions(): Promise<StoredReviewSettings[]>;
}

/** Accounts of the team and their roles (read through `parseTeamMember`). */
export interface TeamRepository {
  /** Follows every member (managers only); returns the stop function. */
  follow(onChange: (members: unknown[]) => void, onError: () => void): () => void;
  /** The member record of one account (each member can read their own), null when it is not a member. */
  getMember(uid: string): Promise<unknown | null>;
  /** Account that signed in on the site with this e-mail address (null when none). */
  findAccountByEmail(email: string): Promise<{ uid: string; email: string } | null>;
  put(member: TeamMember): Promise<WriteResult>;
  remove(uid: string): Promise<WriteResult>;
}
