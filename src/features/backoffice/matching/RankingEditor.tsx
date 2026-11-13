import { ArrowDown, ArrowUp } from 'lucide-react';
import {
  DEFAULT_MATCHING_CONFIG,
  RANKING_CRITERIA,
  type MatchingConfig,
  type MatchTier,
  type RankingCriterion,
} from '@/core/matching';
import type { BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { cls, Section } from './ui';

const criterionLabels = (b: BackofficeTexts): Record<RankingCriterion, string> => ({
  boost: b.engCritBoost,
  fridgeUsed: b.engCritFridgeUsed,
  score: b.engCritScore,
  toBuy: b.engCritToBuy,
  missingKey: b.engCritMissingKey,
  time: b.engCritTime,
  cost: b.engCritCost,
});

const tierLabels = (b: BackofficeTexts): Record<MatchTier, string> => ({
  ready: b.engTiersReady,
  almost: b.engTiersAlmost,
  ideas: b.engTiersIdeas,
});

function TierRanking({
  criteria,
  onChange,
}: {
  criteria: RankingCriterion[];
  onChange: (c: RankingCriterion[]) => void;
}) {
  const b = useBackofficeText();
  const criterionLabel = criterionLabels(b);
  const unused = RANKING_CRITERIA.filter((c) => !criteria.includes(c));
  const move = (i: number, delta: number) => {
    const next = [...criteria];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-1.5">
      <ol className="space-y-1">
        {criteria.map((c, i) => (
          <li key={c} className="flex items-center gap-1.5 text-xs">
            <span className="w-4 text-ink-muted">{i + 1}.</span>
            <span className="flex-1 font-semibold text-ink">{criterionLabel[c]}</span>
            <button
              className="p-1 disabled:opacity-30"
              disabled={i === 0}
              onClick={() => move(i, -1)}
              aria-label={b.engMoveUp}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1 disabled:opacity-30"
              disabled={i === criteria.length - 1}
              onClick={() => move(i, 1)}
              aria-label={b.engMoveDown}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              className={cls.danger}
              disabled={criteria.length === 1}
              onClick={() => onChange(criteria.filter((x) => x !== c))}
            >
              {b.engRemove}
            </button>
          </li>
        ))}
      </ol>
      {unused.length > 0 && (
        <select
          className={cls.input}
          value=""
          onChange={(e) => e.target.value && onChange([...criteria, e.target.value as RankingCriterion])}
          aria-label={b.engAddCriterion}
        >
          <option value="">+ {b.engAddCriterion}</option>
          {unused.map((c) => (
            <option key={c} value={c}>
              {criterionLabel[c]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function RankingEditor({ config, onChange }: { config: MatchingConfig; onChange: (c: MatchingConfig) => void }) {
  const b = useBackofficeText();
  const tierLabel = tierLabels(b);
  return (
    <Section
      title={b.engRankingTitle}
      hint={b.engRankingHint}
      actions={
        <button
          className={cls.secondary}
          onClick={() => onChange({ ...config, ranking: DEFAULT_MATCHING_CONFIG.ranking })}
        >
          {b.engDefaults}
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(tierLabel) as MatchTier[]).map((tier) => (
          <div key={tier} className="space-y-2">
            <h4 className="text-xs font-bold text-ink">{tierLabel[tier]}</h4>
            <TierRanking
              criteria={config.ranking[tier]}
              onChange={(c) => onChange({ ...config, ranking: { ...config.ranking, [tier]: c } })}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
