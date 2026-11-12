import { useId } from 'react';
import type { LocalizedText } from '@/core/shared';

const LANGUAGES: { key: keyof LocalizedText; label: string; rtl?: boolean }[] = [
  { key: 'fr', label: 'Français' },
  { key: 'derja', label: 'Derja (3, 7, 9)' },
  { key: 'ar', label: 'العربية', rtl: true },
];

const INPUT = 'w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1';

interface LocalizedFieldProps {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  /** Textarea instead of a one-line input (descriptions, steps, tips). */
  multiline?: boolean;
  rows?: number;
  /** French is the reference language: mark it required (empty derja / Arabic fall back to it). */
  frenchRequired?: boolean;
  placeholder?: string;
}

/** One text written in the three languages of the app (French, Derja in Latin letters, Arabic). */
export function LocalizedField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 2,
  frenchRequired = false,
  placeholder,
}: LocalizedFieldProps) {
  const id = useId();
  return (
    <fieldset className="min-w-0">
      <legend className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{label}</legend>
      <div className={`grid grid-cols-1 gap-2 ${multiline ? '' : 'sm:grid-cols-3'}`}>
        {LANGUAGES.map(({ key, label: langLabel, rtl }) => {
          const common = {
            id: `${id}-${key}`,
            value: value[key] ?? '',
            dir: rtl ? ('rtl' as const) : undefined,
            lang: key === 'ar' ? 'ar' : key === 'fr' ? 'fr' : 'ar-Latn-TN',
            required: frenchRequired && key === 'fr',
            placeholder: key === 'fr' ? placeholder : undefined,
            className: INPUT,
          };
          return (
            <div key={key} className="min-w-0">
              <label htmlFor={common.id} className="text-[10px] font-semibold text-ink-muted">
                {langLabel}
                {common.required && ' *'}
              </label>
              {multiline ? (
                <textarea {...common} rows={rows} onChange={(e) => onChange({ ...value, [key]: e.target.value })} />
              ) : (
                <input {...common} type="text" onChange={(e) => onChange({ ...value, [key]: e.target.value })} />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-ink-muted mt-1">Derja ou arabe vide : le texte français est affiché.</p>
    </fieldset>
  );
}
