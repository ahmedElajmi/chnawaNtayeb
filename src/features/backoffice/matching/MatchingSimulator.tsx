import { useCallback, useMemo, useState } from 'react';
import type { Ingredient, Recipe } from '@/core/catalog';
import {
  matchRecipes,
  type MatchingConfig,
  type MatchingScenario,
  type MatchResults,
  type MatchTier,
} from '@/core/matching';
import { DEFAULT_PANTRY_STAPLES } from '@/core/preferences';
import { cls, IngredientChips, Section } from './ui';

const TIERS: { id: MatchTier; label: string }[] = [
  { id: 'ready', label: 'Prêtes' },
  { id: 'almost', label: 'Presque prêtes' },
  { id: 'ideas', label: 'Idées' },
];
const SHOWN = 5;

function Column({ title, results, other }: { title: string; results: MatchResults; other?: MatchResults }) {
  return (
    <div className="flex-1 min-w-0 space-y-3">
      <h4 className="text-xs font-extrabold text-ink">{title}</h4>
      {TIERS.map(({ id, label }) => {
        const otherIds = other?.[id].slice(0, SHOWN).map((r) => r.recipe.id);
        return (
          <div key={id}>
            <p className={cls.label}>
              {label} ({results[id].length})
            </p>
            <ol className="text-xs space-y-0.5 mt-1">
              {results[id].slice(0, SHOWN).map((r, i) => {
                const changed = otherIds && otherIds[i] !== r.recipe.id;
                return (
                  <li key={r.recipe.id} className={changed ? 'font-bold text-accent-text' : 'text-ink'}>
                    {i + 1}. {r.recipe.name_fr}
                    <span className="text-ink-muted font-normal">
                      {' '}
                      · {r.score}%{r.missing_ingredients.length > 0 && ` · ${r.missing_ingredients.length} à acheter`}
                    </span>
                  </li>
                );
              })}
              {results[id].length === 0 && <li className="text-ink-muted">—</li>}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

/** Try a fridge with the published settings and with the draft, side by side. */
export function MatchingSimulator({
  published,
  draft,
  recipes,
  ingredients,
  presets,
}: {
  published: MatchingConfig;
  draft: MatchingConfig;
  recipes: Recipe[];
  ingredients: Ingredient[];
  /** The chef's scenarios, used as ready-made fridges */
  presets: MatchingScenario[];
}) {
  const [fridge, setFridge] = useState<string[]>([]);
  const run = useCallback(
    (config: MatchingConfig) =>
      matchRecipes(recipes, fridge, undefined, { pantryIds: DEFAULT_PANTRY_STAPLES, catalog: ingredients, config }),
    [recipes, fridge, ingredients]
  );
  const before = useMemo(() => run(published), [run, published]);
  const after = useMemo(() => run(draft), [run, draft]);
  const same = published === draft;

  return (
    <Section
      title="Simulateur"
      hint="Composez un frigo (avec le placard par défaut) et comparez les suggestions publiées et celles du brouillon. En couleur : ce qui change."
    >
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={`${cls.input} max-w-full`}
          value=""
          onChange={(e) => {
            const s = presets.find((x) => x.id === e.target.value);
            if (s) setFridge(s.fridge);
          }}
          aria-label="Frigo type"
        >
          <option value="">Frigo type…</option>
          {presets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <button className={cls.secondary} onClick={() => setFridge([])}>
          Vider
        </button>
      </div>
      <IngredientChips ids={fridge} ingredients={ingredients} onChange={setFridge} addLabel="Ajouter au frigo…" />
      <div className="flex flex-col md:flex-row gap-6 pt-2 border-t border-line">
        <Column title="Publié (en ligne)" results={before} />
        {!same && <Column title="Brouillon" results={after} other={before} />}
      </div>
    </Section>
  );
}
