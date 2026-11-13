import { DEFAULT_MATCHING_CONFIG, type MatchingConfig } from '@/core/matching';
import type { BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { cls, Section } from './ui';

type Scoring = MatchingConfig['scoring'];
type Tiers = MatchingConfig['tiers'];

type Label = (b: BackofficeTexts) => string;

const TIER_FIELDS: { key: keyof Tiers; label: Label; help: Label; max: number }[] = [
  { key: 'almostMaxToBuy', label: (b) => b.engTuneAlmostMaxToBuy, help: (b) => b.engTuneAlmostMaxToBuyHelp, max: 5 },
  { key: 'almostMaxMissingKey', label: (b) => b.engTuneMaxMissingKey, help: (b) => b.engTuneMaxMissingKeyHelp, max: 3 },
  {
    key: 'almostMaxToBuyWhenKeyMissing',
    label: (b) => b.engTuneToBuyWhenKeyMissing,
    help: (b) => b.engTuneToBuyWhenKeyMissingHelp,
    max: 5,
  },
  {
    key: 'ideasMinFridgeUsedWithoutKey',
    label: (b) => b.engTuneIdeasWithoutKey,
    help: (b) => b.engTuneIdeasWithoutKeyHelp,
    max: 10,
  },
];

const SCORING_FIELDS: { key: keyof Scoring; label: Label; step: number; max: number }[] = [
  { key: 'keyWeight', label: (b) => b.engTuneKeyWeight, step: 0.5, max: 10 },
  { key: 'secondaryWeight', label: (b) => b.engTuneSecondaryWeight, step: 0.5, max: 10 },
  { key: 'substituteFactor', label: (b) => b.engTuneSubstituteFactor, step: 0.05, max: 1 },
  { key: 'staplePenalty', label: (b) => b.engTuneStaplePenalty, step: 1, max: 20 },
  { key: 'maxStaplePenalty', label: (b) => b.engTuneMaxStaplePenalty, step: 1, max: 50 },
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
  const b = useBackofficeText();
  return (
    <Section
      title={b.engTuningTitle}
      hint={b.engTuningHint}
      actions={
        <button
          className={cls.secondary}
          onClick={() =>
            onChange({ ...config, scoring: DEFAULT_MATCHING_CONFIG.scoring, tiers: DEFAULT_MATCHING_CONFIG.tiers })
          }
        >
          {b.engDefaults}
        </button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TIER_FIELDS.map((f) => (
          <NumberField
            key={f.key}
            label={f.label(b)}
            help={f.help(b)}
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
            label={f.label(b)}
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
