import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { DEFAULT_MATCHING_CONFIG, resolveMatchingConfig } from '@/core/matching';
import { useCatalog, useMatchingScenarios, useMatchingSettings } from '@/app/ContainerContext';
import { downloadTextFile } from '@/shared/ui/download';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { format } from '../i18n/backofficeTexts';
import { useNotify } from '../shell/NotifyContext';
import { BoostsEditor } from './BoostsEditor';
import { useMatchingDraft } from './MatchingDraftContext';
import { MatchingSimulator } from './MatchingSimulator';
import { RankingEditor } from './RankingEditor';
import { ScenariosManager } from './ScenariosManager';
import { SubstitutionsEditor } from './SubstitutionsEditor';
import { TuningEditor } from './TuningEditor';
import { VersionHistory } from './VersionHistory';
import { cls } from './ui';

/**
 * Status and publication of the engine draft, shown above every engine sub-page:
 * what is online, the unpublished draft, its note, and the scenarios it breaks.
 */
export function EnginePublishBar() {
  const b = useBackofficeText();
  const notify = useNotify();
  const { updatedAt, source } = useMatchingSettings();
  const { draft, setDraft, published, version, isDirty, failures, publishing, publish } = useMatchingDraft();
  const [note, setNote] = useState('');
  const [acceptFailures, setAcceptFailures] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const exportJson = () =>
    downloadTextFile(
      `reglages-moteur-v${version ?? 0}.json`,
      JSON.stringify({ exported_at: new Date().toISOString(), version, config: draft }, null, 2)
    );

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      setDraft(resolveMatchingConfig(parsed?.config ?? parsed));
      notify(b.engFileLoaded);
    } catch {
      notify(b.engFileUnreadable, true);
    }
  };

  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-card border border-line space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-muted">
          {version ? format(b.engineOnline, { version }) : b.engineNoVersion}
          {source === 'cache' && ` · ${b.engineFromCache}`}
          {updatedAt &&
            ` · ${new Date(updatedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`}
        </p>
        <div className="flex flex-wrap gap-2">
          <button className={`${cls.secondary} inline-flex items-center gap-1`} onClick={exportJson}>
            <Download className="w-3.5 h-3.5" /> {b.engineExport}
          </button>
          <button
            className={`${cls.secondary} inline-flex items-center gap-1`}
            onClick={() => fileInput.current?.click()}
          >
            <Upload className="w-3.5 h-3.5" /> {b.engineImport}
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
            {b.engineResetDraft}
          </button>
        </div>
      </div>

      {isDirty ? (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-line">
          <span className="text-xs font-bold text-accent-text">{b.engineDraft}</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder={b.engineNotePlaceholder}
            className={`${cls.input} flex-1 min-w-0 basis-48`}
          />
          {failures > 0 && (
            <label className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-semibold">
              <input type="checkbox" checked={acceptFailures} onChange={(e) => setAcceptFailures(e.target.checked)} />
              {format(b.engineAcceptFailures, { count: failures })}
            </label>
          )}
          <button className={cls.secondary} onClick={() => setDraft(published)}>
            {b.engineCancel}
          </button>
          <button
            className={cls.primary}
            disabled={publishing || (failures > 0 && !acceptFailures)}
            onClick={async () => {
              if (await publish(note)) {
                setNote('');
                setAcceptFailures(false);
              }
            }}
          >
            {publishing ? b.enginePublishing : b.enginePublish}
          </button>
        </div>
      ) : (
        <p className="text-xs text-ink-muted pt-3 border-t border-line">{b.engineIdle}</p>
      )}
    </div>
  );
}

export function EngineSimulatorPage() {
  const { recipes, ingredients } = useCatalog();
  const { scenarios } = useMatchingScenarios();
  const { draft, published } = useMatchingDraft();
  return (
    <MatchingSimulator
      published={published}
      draft={draft}
      recipes={recipes}
      ingredients={ingredients}
      presets={scenarios}
    />
  );
}

export function EngineScenariosPage() {
  const notify = useNotify();
  const { recipes, ingredients } = useCatalog();
  const { draft, draftResults, publishedResults } = useMatchingDraft();
  return (
    <ScenariosManager
      results={draftResults}
      publishedResults={publishedResults}
      recipes={recipes}
      ingredients={ingredients}
      config={draft}
      onNotify={notify}
    />
  );
}

export function EngineBoostsPage() {
  const { recipes } = useCatalog();
  const { draft, setDraft } = useMatchingDraft();
  return <BoostsEditor config={draft} recipes={recipes} onChange={setDraft} />;
}

export function EngineSubstitutionsPage() {
  const { ingredients } = useCatalog();
  const { draft, setDraft } = useMatchingDraft();
  return <SubstitutionsEditor config={draft} ingredients={ingredients} onChange={setDraft} />;
}

export function EngineTuningPage() {
  const { draft, setDraft } = useMatchingDraft();
  return (
    <div className="space-y-4">
      <TuningEditor config={draft} onChange={setDraft} />
      <RankingEditor config={draft} onChange={setDraft} />
    </div>
  );
}

export function EngineHistoryPage() {
  const b = useBackofficeText();
  const notify = useNotify();
  const { setDraft, version, restore, listVersions } = useMatchingDraft();
  return (
    <VersionHistory
      activeVersion={version}
      load={listVersions}
      refreshKey={version}
      onEdit={(v) => {
        setDraft(resolveMatchingConfig(v.config));
        notify(format(b.engVersionOpened, { version: v.version }));
      }}
      onRestore={restore}
    />
  );
}
