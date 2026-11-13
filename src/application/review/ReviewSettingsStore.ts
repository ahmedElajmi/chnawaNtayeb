import {
  defaultReviewSettings,
  resolveReviewSettings,
  validateReviewSettings,
  type ReviewSettings,
} from '@/core/review';
import type { ReviewSettingsRepository, StoredReviewSettings, WriteResult } from '../ports';
import { Store } from '../store';

export interface ReviewSettingsState {
  /** Workflows and roles in use (always valid: defaults for what is missing) */
  settings: ReviewSettings;
  /** Published version in use; null = built-in defaults */
  version: number | null;
  updatedAt?: string;
  /** What was ignored or repaired while reading the stored settings */
  warnings: string[];
  /** True once the database answered (or was found unreachable) */
  synced: boolean;
}

const DEFAULT_STATE: ReviewSettingsState = {
  settings: defaultReviewSettings(),
  version: null,
  warnings: [],
  synced: false,
};

/** Workflows and roles of the team: followed live, edited by the admin, every version kept. */
export class ReviewSettingsStore extends Store<ReviewSettingsState> {
  constructor(private readonly repo: ReviewSettingsRepository) {
    super(DEFAULT_STATE);
  }

  /** Follows the published settings (admin only); returns the stop function. */
  start(): () => void {
    return this.repo.follow(
      (active) => this.receive(active),
      () => this.setState({ synced: true })
    );
  }

  private receive(active: StoredReviewSettings | null): void {
    if (!active) {
      this.setState({ ...DEFAULT_STATE, synced: true });
      return;
    }
    const { settings, warnings } = resolveReviewSettings(active.settings);
    this.setState({ settings, version: active.version, updatedAt: active.updatedAt, warnings, synced: true });
  }

  /** Saves new settings as a new version, after checking them (nothing is written when they are not valid). */
  async publish(settings: ReviewSettings, note: string): Promise<WriteResult> {
    const errors = validateReviewSettings(settings);
    if (errors.length) return { ok: false, error: errors.join(' ') };
    const result = await this.repo.publish(settings, note.trim().slice(0, 200));
    if (result.ok) this.setState({ settings, version: result.version ?? this.getState().version, warnings: [] });
    return result;
  }

  /** Saved versions, newest first, each one read back through the domain. */
  async listVersions(): Promise<(StoredReviewSettings & { resolved: ReviewSettings })[]> {
    const versions = await this.repo.listVersions();
    return versions.map((v) => ({ ...v, resolved: resolveReviewSettings(v.settings).settings }));
  }
}
