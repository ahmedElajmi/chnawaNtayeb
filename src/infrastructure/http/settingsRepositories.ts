import type {
  MatchingSettingsRepository,
  ReviewSettingsRepository,
  StoredMatchingSettings,
  StoredReviewSettings,
} from '@/application';
import { followActiveSettings, listSettingsVersions, loadActiveSettings, publishSettings } from './settingsHttp';

/**
 * The two active settings documents through the server. The stored shapes are the same as
 * before (the domain reads `config`/`settings` through its own resolvers).
 */

const toStoredMatching = (d: unknown): StoredMatchingSettings | null => {
  const s = d as { version?: unknown; config?: unknown; updated_at?: unknown; note?: unknown } | null;
  if (!s || typeof s.version !== 'number') return null;
  return {
    version: s.version,
    config: s.config,
    updatedAt: typeof s.updated_at === 'string' ? s.updated_at : '',
    note: typeof s.note === 'string' ? s.note : '',
  };
};

const toStoredReview = (d: unknown): StoredReviewSettings | null => {
  const s = d as { version?: unknown; settings?: unknown; updated_at?: unknown; note?: unknown } | null;
  if (!s || typeof s.version !== 'number') return null;
  return {
    version: s.version,
    settings: s.settings,
    updatedAt: typeof s.updated_at === 'string' ? s.updated_at : '',
    note: typeof s.note === 'string' ? s.note : '',
  };
};

/** Matching settings: followed by every visitor, published by the admin (port MatchingSettingsRepository). */
export const matchingSettingsHttp: MatchingSettingsRepository = {
  loadActive: async () => toStoredMatching(await loadActiveSettings('matching')),
  followActive(onChange) {
    return followActiveSettings(
      'matching',
      (doc) => onChange(toStoredMatching(doc)),
      () => undefined
    );
  },
  async publish(config, note) {
    // The version being replaced is the one this device last saw (conflict = someone published meanwhile)
    const current = await loadActiveSettings('matching');
    const result = await publishSettings('matching', config, note, current?.version ?? null);
    return result.ok
      ? { ok: true, version: result.version }
      : { ok: false, error: friendlyPublish(result.error, result.conflict) };
  },
  listVersions: async (limit) =>
    (await listSettingsVersions('matching', limit))
      .map(toStoredMatching)
      .filter((v): v is StoredMatchingSettings => v !== null),
};

/** Review settings: followed in the backoffice, published by the admin (port ReviewSettingsRepository). */
export const reviewSettingsHttp: ReviewSettingsRepository = {
  follow(onChange, onError) {
    return followActiveSettings('review', (doc) => onChange(toStoredReview(doc)), onError);
  },
  async publish(settings, note) {
    const current = await loadActiveSettings('review');
    const result = await publishSettings('review', settings, note, current?.version ?? null);
    return result.ok
      ? { ok: true, version: result.version }
      : { ok: false, error: friendlyPublish(result.error, result.conflict) };
  },
  listVersions: async () =>
    (await listSettingsVersions('review', 100))
      .map(toStoredReview)
      .filter((v): v is StoredReviewSettings => v !== null),
};

function friendlyPublish(error: string, conflict?: boolean): string {
  if (conflict) return 'Une autre personne a publié des réglages entre-temps : recharge et réessaie.';
  return error;
}
