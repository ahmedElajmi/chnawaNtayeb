import { ArrowDown, ArrowUp } from 'lucide-react';
import {
  DEFAULT_MATCHING_CONFIG,
  RANKING_CRITERIA,
  type MatchingConfig,
  type MatchTier,
  type RankingCriterion,
} from '@/core/matching';
import { cls, Section } from './ui';

const CRITERION_LABEL: Record<RankingCriterion, string> = {
  boost: 'Mise en avant',
  fridgeUsed: 'Utilise le plus le frigo',
  score: 'Meilleur score',
  toBuy: 'Le moins de courses',
  missingKey: 'Le moins de clés manquantes',
  time: 'Le plus rapide',
  cost: 'Le moins cher',
};

const TIER_LABEL: Record<MatchTier, string> = { ready: 'Prêtes', almost: 'Presque prêtes', ideas: 'Idées' };

function TierRanking({
  criteria,
  onChange,
}: {
  criteria: RankingCriterion[];
  onChange: (c: RankingCriterion[]) => void;
}) {
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
            <span className="flex-1 font-semibold text-ink">{CRITERION_LABEL[c]}</span>
            <button
              className="p-1 disabled:opacity-30"
              disabled={i === 0}
              onClick={() => move(i, -1)}
              aria-label="Monter"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1 disabled:opacity-30"
              disabled={i === criteria.length - 1}
              onClick={() => move(i, 1)}
              aria-label="Descendre"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              className={cls.danger}
              disabled={criteria.length === 1}
              onClick={() => onChange(criteria.filter((x) => x !== c))}
            >
              Retirer
            </button>
          </li>
        ))}
      </ol>
      {unused.length > 0 && (
        <select
          className={cls.input}
          value=""
          onChange={(e) => e.target.value && onChange([...criteria, e.target.value as RankingCriterion])}
          aria-label="Ajouter un critère"
        >
          <option value="">+ Ajouter un critère</option>
          {unused.map((c) => (
            <option key={c} value={c}>
              {CRITERION_LABEL[c]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function RankingEditor({ config, onChange }: { config: MatchingConfig; onChange: (c: MatchingConfig) => void }) {
  return (
    <Section
      title="Ordre d’affichage"
      hint="Dans chaque niveau, les recettes sont triées par le premier critère, puis le suivant en cas d’égalité."
      actions={
        <button
          className={cls.secondary}
          onClick={() => onChange({ ...config, ranking: DEFAULT_MATCHING_CONFIG.ranking })}
        >
          Valeurs par défaut
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(TIER_LABEL) as MatchTier[]).map((tier) => (
          <div key={tier} className="space-y-2">
            <h4 className="text-xs font-bold text-ink">{TIER_LABEL[tier]}</h4>
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
