import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import {
  DEFAULT_MATCHING_CONFIG,
  evaluateScenarios,
  resolveMatchingConfig,
  type MatchingConfig,
} from '@/core/matching';
import { DEFAULT_PANTRY_STAPLES } from '@/core/preferences';
import type { StoredMatchingSettings } from '@/application';
import { useCatalog, useMatchingScenarios, useMatchingSettings } from '@/app/ContainerContext';
import { BoostsEditor } from './BoostsEditor';
import { MatchingSimulator } from './MatchingSimulator';
import { RankingEditor } from './RankingEditor';
import { ScenariosManager } from './ScenariosManager';
import { SubstitutionsEditor } from './SubstitutionsEditor';
import { TuningEditor } from './TuningEditor';
import { VersionHistory } from './VersionHistory';
import { cls } from './ui';
import { downloadTextFile } from '@/shared/ui/download';

const SOURCE_LABEL = {
  default: 'réglages par défaut (rien de publié)',
  cache: 'copie hors ligne',
  database: 'base de données',
};

/**
 * Backoffice "Moteur" tab: the admin edits a draft of the matching settings, checks it
 * (simulator + chef's scenarios), then publishes it to the database as a new version.
 * A JSON file is only used to export (dump) or import (restore) settings.
 */
export function MatchingSettingsPanel({ onNotify }: { onNotify: (message: string, isError?: boolean) => void }) {
  const { recipes, ingredients } = useCatalog();
  const { config: published, version, updatedAt, source, matchingSettings } = useMatchingSettings();
  const [draft, setDraft] = useState<MatchingConfig>(published);
  const [note, setNote] = useState('');
  const [acceptFailures, setAcceptFailures] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { scenarios, matchingScenarios } = useMatchingScenarios();

  // The chef's scenarios are read from the database each time the tab opens
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
  const failures = draftResults.filter((r) => !r.passed).length;
  const listVersions = useCallback(() => matchingSettings.listVersions(), [matchingSettings]);

  const publish = async (config: MatchingConfig, message: string) => {
    setPublishing(true);
    const result = await matchingSettings.publish(config, message);
    setPublishing(false);
    if (result.ok) {
      setNote('');
      setAcceptFailures(false);
      onNotify('Réglages publiés : ils s’appliquent à tous les utilisateurs.');
    } else {
      onNotify(result.error, true);
    }
  };

  const restore = async (v: StoredMatchingSettings) => {
    const result = await matchingSettings.restore(v);
    onNotify(result.ok ? `Version ${v.version} republiée.` : result.error, !result.ok);
  };

  const exportJson = () => {
    downloadTextFile(
      `reglages-moteur-v${version ?? 0}.json`,
      JSON.stringify({ exported_at: new Date().toISOString(), version, config: draft }, null, 2)
    );
  };

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      setDraft(resolveMatchingConfig(parsed?.config ?? parsed));
      onNotify('Fichier chargé dans le brouillon : vérifiez puis publiez.');
    } catch {
      onNotify('Fichier illisible : ce n’est pas un export de réglages.', true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status and publication */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-line space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-ink">Moteur « Warini chnowa ntayeb »</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              En ligne : {version ? `version ${version}` : 'aucune version'} · source : {SOURCE_LABEL[source]}
              {updatedAt &&
                ` · ${new Date(updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={`${cls.secondary} inline-flex items-center gap-1`} onClick={exportJson}>
              <Download className="w-3.5 h-3.5" /> Exporter (JSON)
            </button>
            <button
              className={`${cls.secondary} inline-flex items-center gap-1`}
              onClick={() => fileInput.current?.click()}
            >
              <Upload className="w-3.5 h-3.5" /> Importer
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importJson(file);
                e.target.value = '';
              }}
            />
            <button className={cls.secondary} onClick={() => setDraft(DEFAULT_MATCHING_CONFIG)}>
              Brouillon = défaut
            </button>
          </div>
        </div>

        {isDirty ? (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-line">
            <span className="text-xs font-bold text-accent-text">Brouillon non publié</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="Note de version (ex. : plats de Ramadan en avant)"
              className={`${cls.input} flex-1 min-w-48`}
            />
            {failures > 0 && (
              <label className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-semibold">
                <input type="checkbox" checked={acceptFailures} onChange={(e) => setAcceptFailures(e.target.checked)} />
                Publier malgré {failures} scénario(s) non respecté(s)
              </label>
            )}
            <button className={cls.secondary} onClick={() => setDraft(published)}>
              Annuler
            </button>
            <button
              className={cls.primary}
              disabled={publishing || (failures > 0 && !acceptFailures)}
              onClick={() => publish(draft, note)}
            >
              {publishing ? 'Publication…' : 'Publier'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-ink-muted pt-3 border-t border-line">
            Modifiez un réglage ci-dessous : le simulateur et les scénarios montrent l’effet avant publication.
          </p>
        )}
      </div>

      <MatchingSimulator
        published={published}
        draft={draft}
        recipes={recipes}
        ingredients={ingredients}
        presets={scenarios}
      />
      <ScenariosManager
        results={draftResults}
        publishedResults={publishedResults}
        recipes={recipes}
        ingredients={ingredients}
        config={draft}
        onNotify={onNotify}
      />
      <BoostsEditor config={draft} recipes={recipes} onChange={setDraft} />
      <SubstitutionsEditor config={draft} ingredients={ingredients} onChange={setDraft} />
      <TuningEditor config={draft} onChange={setDraft} />
      <RankingEditor config={draft} onChange={setDraft} />
      <VersionHistory
        activeVersion={version}
        load={listVersions}
        refreshKey={version}
        onEdit={(v) => {
          setDraft(resolveMatchingConfig(v.config));
          onNotify(`Version ${v.version} ouverte dans le brouillon.`);
        }}
        onRestore={restore}
      />
    </div>
  );
}
