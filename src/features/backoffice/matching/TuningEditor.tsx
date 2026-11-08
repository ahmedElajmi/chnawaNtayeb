import { DEFAULT_MATCHING_CONFIG, type MatchingConfig } from '@/core/matching';
import { cls, Section } from './ui';

type Scoring = MatchingConfig['scoring'];
type Tiers = MatchingConfig['tiers'];

const TIER_FIELDS: { key: keyof Tiers; label: string; help: string; max: number }[] = [
  {
    key: 'almostMaxToBuy',
    label: '« Presque prêt » : courses max.',
    help: 'Nombre d’ingrédients à acheter au maximum',
    max: 5,
  },
  {
    key: 'almostMaxMissingKey',
    label: 'Ingrédients clés manquants max.',
    help: '0 = une recette sans son ingrédient principal n’est jamais « presque prête »',
    max: 3,
  },
  {
    key: 'almostMaxToBuyWhenKeyMissing',
    label: 'Courses max. si une clé manque',
    help: '1 = seulement si c’est la seule course',
    max: 5,
  },
  {
    key: 'ideasMinFridgeUsedWithoutKey',
    label: 'Idées sans ingrédient clé',
    help: 'Ingrédients du frigo nécessaires pour une recette sans ingrédient clé',
    max: 10,
  },
];

const SCORING_FIELDS: { key: keyof Scoring; label: string; step: number; max: number }[] = [
  { key: 'keyWeight', label: 'Poids d’un ingrédient clé', step: 0.5, max: 10 },
  { key: 'secondaryWeight', label: 'Poids d’un ingrédient secondaire', step: 0.5, max: 10 },
  { key: 'substituteFactor', label: 'Valeur d’un remplacement (0 à 1)', step: 0.05, max: 1 },
  { key: 'staplePenalty', label: 'Points retirés par épice manquante', step: 1, max: 20 },
  { key: 'maxStaplePenalty', label: 'Maximum retiré pour les épices', step: 1, max: 50 },
];

function NumberField({
  label,
  help,
  value,
  step = 1,
  max,
  onChange,
}: {
  label: string;
  help?: string;
  value: number;
  step?: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={cls.label}>{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${cls.input} w-28`}
      />
      {help && <span className="text-[10px] text-ink-muted">{help}</span>}
    </label>
  );
}

export function TuningEditor({ config, onChange }: { config: MatchingConfig; onChange: (c: MatchingConfig) => void }) {
  return (
    <Section
      title="Seuils et poids"
      hint="Quand une recette est « prête », « presque prête » ou une « idée », et comment le score est calculé."
      actions={
        <button
          className={cls.secondary}
          onClick={() =>
            onChange({ ...config, scoring: DEFAULT_MATCHING_CONFIG.scoring, tiers: DEFAULT_MATCHING_CONFIG.tiers })
          }
        >
          Valeurs par défaut
        </button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TIER_FIELDS.map((f) => (
          <NumberField
            key={f.key}
            label={f.label}
            help={f.help}
            max={f.max}
            value={config.tiers[f.key]}
            onChange={(v) => onChange({ ...config, tiers: { ...config.tiers, [f.key]: v } })}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-line">
        {SCORING_FIELDS.map((f) => (
          <NumberField
            key={f.key}
            label={f.label}
            step={f.step}
            max={f.max}
            value={config.scoring[f.key]}
            onChange={(v) => onChange({ ...config, scoring: { ...config.scoring, [f.key]: v } })}
          />
        ))}
      </div>
    </Section>
  );
}
