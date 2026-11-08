import type { Ingredient, Recipe } from '@/core/catalog';
import type { DayPlan } from '@/core/planning';
import type { GroceryItem } from '@/core/grocery';
import type { MatchingConfig } from '@/core/matching';
import type { UserPreferences } from '@/core/preferences';
import type { AppTheme } from '@/core/theme';

/**
 * Ports: what the application needs from the outside world.
 * Implementations (adapters) live in src/infrastructure and are wired in src/app/container.ts.
 * Replacing localStorage or Firestore means writing a new adapter for one of these interfaces.
 */

/** Catalog copy kept on the device (works offline). */
export interface CatalogRepository {
  loadRecipes(): Recipe[];
  saveRecipes(recipes: Recipe[]): void;
  loadIngredients(): Ingredient[];
  saveIngredients(ingredients: Ingredient[]): void;
}

/** Shared catalog published by the admin. `null` means "unavailable, keep the local copy". */
export interface RemoteCatalogSource {
  fetchRecipes(): Promise<Recipe[] | null>;
  fetchIngredients(): Promise<Ingredient[] | null>;
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
  loadGroceryList(): GroceryItem[];
  saveGroceryList(items: GroceryItem[]): void;
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

/** User preferences kept on the device (language, theme, pantry...). */
export interface PreferencesRepository {
  load(): UserPreferences;
  save(patch: Partial<UserPreferences>): void;
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

export interface UserAuthGateway {
  /** Minimum password length accepted when creating an account */
  readonly minPasswordLength: number;
  /** Calls `listener` now and on every sign-in / sign-out; returns the unsubscribe function */
  subscribe(listener: (user: AppUser | null) => void): () => void;
  loginAsGuest(): Promise<void>;
  loginWithEmail(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  /** Readable message for a failed sign-in */
  errorMessage(error: unknown): string;
  /** Owner account that also has admin rights */
  isOwner(user: AppUser): boolean;
  /** Technical account of a patron session (signed in through the server) */
  isPatronAccount(user: AppUser): boolean;
}

export interface CatalogInitStats {
  recipes: number;
  ingredients: number;
  deleted: number;
}

/** Catalog administration (backoffice): local copy first, then the shared cloud catalog. */
export interface CatalogAdminGateway {
  /** Name of the cloud project shown to the admin */
  readonly cloudName: string;
  saveRecipe(recipe: Recipe): Promise<WriteResult>;
  deleteRecipe(recipeId: string): Promise<WriteResult>;
  saveIngredient(ingredient: Ingredient): Promise<WriteResult>;
  /** Creates an ingredient on this device (then `saveIngredient` publishes it) */
  createIngredient(data: Omit<Ingredient, 'id'>): Ingredient;
  /** Sends every local recipe and ingredient to the cloud */
  pushAll(): Promise<WriteResult>;
  /** Replaces the cloud catalog with the built-in one */
  resetCloudCatalog(): Promise<WriteResult & { stats?: CatalogInitStats }>;
  /** Replaces the local copy with the cloud catalog */
  pullFromCloud(): Promise<void>;
  /** Full backup as JSON text (dump) */
  exportBackup(): string;
  /** Restores a JSON backup; false when the file is not a backup */
  importBackup(json: string): boolean;
  /** Built-in catalog and default menu on this device */
  resetLocalToDefaults(): void;
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

/** Whether admin edits reach the shared cloud catalog or stay on this device. */
export type CloudStatus = 'connected' | 'local-only';

export type PatronLoginResult = { ok: true; cloud: CloudStatus } | { ok: false; error: string };

/** Admin (patron) session. Only the server decides who is admin. */
export interface PatronGateway {
  login(username: string, password: string): Promise<PatronLoginResult>;
  hasStoredSession(): boolean;
  verifySession(): Promise<boolean>;
  connectCloud(): Promise<CloudStatus>;
  logout(): Promise<void>;
  /** Called once the admin is connected to the cloud (e.g. seeds an empty cloud catalog). */
  onCloudConnected(): Promise<void>;
}
