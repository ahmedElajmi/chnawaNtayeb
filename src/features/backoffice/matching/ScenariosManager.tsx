import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Download, FlaskConical, Pencil, Play, Plus, Trash2, Upload, XCircle } from 'lucide-react';
import type { Ingredient, Recipe } from '@/core/catalog';
import {
  matchRecipes,
  type MatchingConfig,
  type MatchingScenario,
  type MatchTier,
  type ScenarioResult,
} from '@/core/matching';
import { DEFAULT_PANTRY_STAPLES } from '@/core/preferences';
import { useMatchingScenarios } from '@/app/ContainerContext';
import { downloadTextFile } from '@/shared/ui/download';
import { ScenarioEditorModal } from './ScenarioEditorModal';
import { cls, Section } from './ui';

const TIERS: { id: MatchTier; label: string }[] = [
  { id: 'ready', label: 'Prêtes' },
  { id: 'almost', label: 'Presque prêtes' },
  { id: 'ideas', label: 'Idées' },
];

/** Suggestions of one scenario with the draft settings (the "Tester" button). */
function ScenarioPreview({
  scenario,
  recipes,
  ingredients,
  config,
}: {
  scenario: MatchingScenario;
  recipes: Recipe[];
  ingredients: Ingredient[];
  config: MatchingConfig;
}) {
  const results = useMemo(
    () =>
      matchRecipes(recipes, scenario.fridge, scenario.filters, {
        pantryIds: scenario.pantry ?? DEFAULT_PANTRY_STAPLES,
        catalog: ingredients,
        config,
      }),
    [scenario, recipes, ingredients, config]
  );
  return (
    <div className="ml-6 mt-1 p-2 rounded-lg bg-surface border border-line grid gap-2 sm:grid-cols-3">
      {TIERS.map(({ id, label }) => (
        <div key={id} className="min-w-0">
          <p className={cls.label}>
            {label} ({results[id].length})
          </p>
          <ol className="text-[11px] text-ink">
            {results[id].slice(0, 5).map((r, i) => (
              <li key={r.recipe.id} className="truncate">
                {i + 1}. {r.recipe.name_fr} <span className="text-ink-muted">· {r.score}%</span>
              </li>
            ))}
            {results[id].length === 0 && <li className="text-ink-muted">—</li>}
          </ol>
        </div>
      ))}
    </div>
  );
}

/**
 * The chef's scenarios, stored in the database: replayed with the draft settings before
 * publishing, and managed here (add, edit, test, delete, export / restore as JSON).
 */
export function ScenariosManager({
  results,
  publishedResults,
  recipes,
  ingredients,
  config,
  onNotify,
}: {
  results: ScenarioResult[];
  publishedResults: ScenarioResult[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  config: MatchingConfig;
  onNotify: (message: string, isError?: boolean) => void;
}) {
  const { status, matchingScenarios } = useMatchingScenarios();
  const [editing, setEditing] = useState<{ scenario: MatchingScenario; isNew: boolean } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const failed = results.filter((r) => !r.passed).length;
  const wasPassing = new Set(publishedResults.filter((r) => r.passed).map((r) => r.scenario.id));
  const catalog = useMemo(
    () => ({ recipeIds: recipes.map((r) => r.id), ingredientIds: ingredients.map((i) => i.id) }),
    [recipes, ingredients]
  );

  const runTests = async () => {
    setBusy(true);
    await matchingScenarios.load();
    setBusy(false);
    setLastRun(new Date());
    if (matchingScenarios.getState().status === 'error') onNotify('Base injoignable : scénarios non rechargés.', true);
  };

  const remove = async (scenario: MatchingScenario) => {
    if (!window.confirm(`Supprimer le scénario « ${scenario.title} » ?`)) return;
    const result = await matchingScenarios.remove(scenario.id);
    onNotify(result.ok ? 'Scénario supprimé.' : result.error, !result.ok);
  };

  const importFile = async (file: File) => {
    const count = matchingScenarios.getState().scenarios.length;
    if (count > 0 && !window.confirm(`Remplacer les ${count} scénarios de la base par ceux du fichier ?`)) return;
    setBusy(true);
    const result = await matchingScenarios.importJson(await file.text());
    setBusy(false);
    if (!result.ok) return onNotify(result.error, true);
    onNotify(
      `${result.count} scénario(s) restauré(s)${result.skipped ? `, ${result.skipped} incomplet(s) ignoré(s)` : ''}.`
    );
  };

  const newScenario = (): MatchingScenario => ({ id: '', title: '', fridge: [], checks: [] });

  return (
    <Section
      title={
        results.length
          ? `Scénarios du chef : ${results.length - failed}/${results.length} respectés`
          : 'Scénarios du chef'
      }
      hint="« Avec ce frigo, on doit voir ces plats. » Enregistrés en base et rejoués avec le brouillon avant publication."
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            className={`${cls.primary} inline-flex items-center gap-1`}
            onClick={() => setEditing({ scenario: newScenario(), isNew: true })}
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
          <button className={`${cls.secondary} inline-flex items-center gap-1`} disabled={busy} onClick={runTests}>
            <Play className="w-3.5 h-3.5" /> {busy ? 'Tests…' : 'Lancer les tests'}
          </button>
          <button
            className={`${cls.secondary} inline-flex items-center gap-1`}
            disabled={!results.length}
            onClick={() =>
              downloadTextFile(
                `scenarios-${new Date().toISOString().slice(0, 10)}.json`,
                matchingScenarios.exportJson()
              )
            }
          >
            <Download className="w-3.5 h-3.5" /> Exporter
          </button>
          <button
            className={`${cls.secondary} inline-flex items-center gap-1`}
            disabled={busy}
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
              if (file) void importFile(file);
              e.target.value = '';
            }}
          />
        </div>
      }
    >
      {lastRun && (
        <p className="text-[11px] text-ink-muted">
          Derniers tests : {lastRun.toLocaleTimeString('fr-FR')} · {results.length - failed} réussi(s), {failed} en
          échec.
        </p>
      )}
      {status === 'loading' && results.length === 0 && <p className="text-xs text-ink-muted">Chargement…</p>}
      {status === 'error' && (
        <p className="text-xs font-semibold text-rose-600">
          Base injoignable : la liste n’a pas pu être chargée (« Lancer les tests » pour réessayer).
        </p>
      )}
      {status === 'ready' && results.length === 0 && (
        <p className="text-xs text-ink-muted">
          Aucun scénario en base. Ajoutez-en un, ou importez un export (fichier initial :
          docs/encyclopedie/donnees/scenarios-initiaux.json).
        </p>
      )}

      <ul className="space-y-1.5">
        {results.map(({ scenario, passed, failures }) => (
          <li key={scenario.id} className="text-xs">
            <div className="flex items-start gap-1.5">
              {passed ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span className={`flex-1 min-w-0 break-words ${passed ? 'text-ink' : 'font-semibold text-rose-600'}`}>
                {scenario.title}
                {!passed && wasPassing.has(scenario.id) && (
                  <span className="ml-1 font-bold">(cassé par le brouillon)</span>
                )}
              </span>
              <div className="flex shrink-0">
                <button
                  className="p-1 rounded text-ink-muted hover:text-ink"
                  aria-label={`Tester « ${scenario.title} »`}
                  title="Tester : voir les suggestions"
                  aria-pressed={testing === scenario.id}
                  onClick={() => setTesting(testing === scenario.id ? null : scenario.id)}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                </button>
                <button
                  className="p-1 rounded text-ink-muted hover:text-ink"
                  aria-label={`Modifier « ${scenario.title} »`}
                  title="Modifier"
                  onClick={() => setEditing({ scenario, isNew: false })}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  className="p-1 rounded text-ink-muted hover:text-rose-600"
                  aria-label={`Supprimer « ${scenario.title} »`}
                  title="Supprimer"
                  onClick={() => void remove(scenario)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {!passed && (
              <ul className="ml-6 mt-0.5 list-disc text-[11px] text-ink-muted break-words">
                {failures.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
            {testing === scenario.id && (
              <ScenarioPreview scenario={scenario} recipes={recipes} ingredients={ingredients} config={config} />
            )}
          </li>
        ))}
      </ul>

      {editing && (
        <ScenarioEditorModal
          scenario={editing.scenario}
          isNew={editing.isNew}
          recipes={recipes}
          ingredients={ingredients}
          config={config}
          onClose={() => setEditing(null)}
          onSave={async (s) => {
            const scenario = editing.isNew ? { ...s, id: matchingScenarios.newId(s.title) } : s;
            const result = await matchingScenarios.save(scenario, catalog);
            if (result.ok) onNotify(editing.isNew ? 'Scénario ajouté.' : 'Scénario enregistré.');
            return result;
          }}
        />
      )}
    </Section>
  );
}
