import { useState } from 'react';
import type { Recipe } from '@/core/catalog';
import type { MatchingConfig, RecipeBoost } from '@/core/matching';
import { cls, RecipeSelect, Section } from './ui';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useBackofficeText } from '../i18n/useBackofficeText';

export function BoostsEditor({
  config,
  recipes,
  onChange,
}: {
  config: MatchingConfig;
  recipes: Recipe[];
  onChange: (c: MatchingConfig) => void;
}) {
  const { getRecipeName } = useLanguage();
  const b = useBackofficeText();
  const [recipeId, setRecipeId] = useState('');
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const name = (id: string) => {
    const recipe = recipes.find((r) => r.id === id);
    return recipe ? getRecipeName(recipe) : id;
  };
  const setBoosts = (recipeBoosts: RecipeBoost[]) => onChange({ ...config, recipeBoosts });
  const update = (i: number, patch: Partial<RecipeBoost>) =>
    setBoosts(config.recipeBoosts.map((boost, k) => (k === i ? { ...boost, ...patch } : boost)));

  return (
    <Section title={b.engineBoosts} hint={b.engBoostsHint}>
      {config.recipeBoosts.length === 0 && <p className="text-xs text-ink-muted">{b.engNoBoost}</p>}
      <ul className="space-y-2">
        {config.recipeBoosts.map((boost, i) => {
          const expired = !!boost.until && boost.until < today;
          return (
            <li key={`${boost.recipeId}-${i}`} className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`flex-1 min-w-40 font-semibold ${expired ? 'line-through text-ink-muted' : 'text-ink'}`}>
                {name(boost.recipeId)}
              </span>
              <label className="flex items-center gap-1">
                <span className={cls.label}>{b.engPriority}</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={boost.weight}
                  onChange={(e) => update(i, { weight: Number(e.target.value) })}
                  className={`${cls.input} w-16`}
                />
              </label>
              <label className="flex items-center gap-1">
                <span className={cls.label}>{b.engUntil}</span>
                <input
                  type="date"
                  value={boost.until ?? ''}
                  onChange={(e) => update(i, { until: e.target.value || undefined })}
                  className={cls.input}
                />
              </label>
              {expired && <span className="text-[10px] font-bold text-rose-600">{b.engEnded}</span>}
              <button className={cls.danger} onClick={() => setBoosts(config.recipeBoosts.filter((_, k) => k !== i))}>
                {b.engRemove}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line">
        <RecipeSelect
          recipes={recipes.filter((r) => !config.recipeBoosts.some((boost) => boost.recipeId === r.id))}
          value={recipeId}
          onChange={setRecipeId}
        />
        <button
          className={cls.primary}
          disabled={!recipeId}
          onClick={() => {
            setBoosts([...config.recipeBoosts, { recipeId, weight: 5 }]);
            setRecipeId('');
          }}
        >
          {b.engBoost}
        </button>
      </div>
    </Section>
  );
}
