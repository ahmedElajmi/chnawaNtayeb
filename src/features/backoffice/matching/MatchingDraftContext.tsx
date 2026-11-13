import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { evaluateScenarios, type MatchingConfig, type ScenarioResult } from '@/core/matching';
import { DEFAULT_PANTRY_STAPLES } from '@/core/preferences';
import type { StoredMatchingSettings } from '@/application';
import { useCatalog, useMatchingScenarios, useMatchingSettings } from '@/app/ContainerContext';
import { format } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { useNotify } from '../shell/NotifyContext';

interface MatchingDraft {
  /** What the admin is editing (starts from the published settings) */
  draft: MatchingConfig;
  setDraft: (config: MatchingConfig) => void;
  published: MatchingConfig;
  version: number | null;
  isDirty: boolean;
  /** The chef's scenarios checked against the draft, and against what is online */
  draftResults: ScenarioResult[];
  publishedResults: ScenarioResult[];
  failures: number;
  publishing: boolean;
  publish: (message: string) => Promise<boolean>;
  restore: (version: StoredMatchingSettings) => Promise<void>;
  listVersions: () => Promise<StoredMatchingSettings[]>;
}

const MatchingDraftContext = createContext<MatchingDraft | null>(null);

/**
 * Draft of the matching settings, shared by every sub-page of the engine (simulator, scenarios, boosts…):
 * moving between them keeps the draft; it is checked against the chef's scenarios, then published as a
 * new version.
 */
export function MatchingDraftProvider({ children }: { children: ReactNode }) {
  const notify = useNotify();
  const b = useBackofficeText();
  const { recipes, ingredients } = useCatalog();
  const { config: published, version, matchingSettings } = useMatchingSettings();
  const { scenarios, matchingScenarios } = useMatchingScenarios();
  const [draft, setDraft] = useState<MatchingConfig>(published);
  const [publishing, setPublishing] = useState(false);

  // The chef's scenarios are read from the database each time the engine opens
  useEffect(() => {
    void matchingScenarios.load();
  }, [matchingScenarios]);

  // A new published version (here or elsewhere) becomes the starting point of the draft
  const [draftBase, setDraftBase] = useState(published);
  if (draftBase !== published) {
    setDraftBase(published);
    setDraft(published);
  }

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(published), [draft, published]);
  const draftResults = useMemo(
    () => evaluateScenarios({ recipes, ingredients, defaultPantry: DEFAULT_PANTRY_STAPLES, config: draft }, scenarios),
    [draft, recipes, ingredients, scenarios]
  );
  const publishedResults = useMemo(
    () =>
      evaluateScenarios({ recipes, ingredients, defaultPantry: DEFAULT_PANTRY_STAPLES, config: published }, scenarios),
    [published, recipes, ingredients, scenarios]
  );
  const listVersions = useCallback(() => matchingSettings.listVersions(), [matchingSettings]);

  const value: MatchingDraft = {
    draft,
    setDraft,
    published,
    version,
    isDirty,
    draftResults,
    publishedResults,
    failures: draftResults.filter((r) => !r.passed).length,
    publishing,
    async publish(message) {
      setPublishing(true);
      const result = await matchingSettings.publish(draft, message);
      setPublishing(false);
      if (result.ok) notify(b.engPublished);
      else notify(result.error, true);
      return result.ok;
    },
    async restore(v) {
      const result = await matchingSettings.restore(v);
      notify(result.ok ? format(b.engVersionRepublished, { version: v.version }) : result.error, !result.ok);
    },
    listVersions,
  };

  return <MatchingDraftContext.Provider value={value}>{children}</MatchingDraftContext.Provider>;
}

export function useMatchingDraft(): MatchingDraft {
  const draft = useContext(MatchingDraftContext);
  if (!draft) throw new Error('useMatchingDraft must be used inside MatchingDraftProvider');
  return draft;
}
