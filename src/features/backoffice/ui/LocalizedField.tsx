import { useId } from 'react';
import type { LocalizedText } from '@/core/shared';
import { EDITOR_LANGUAGES, useEditorLanguage } from './editorLanguage';

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
  /** Shown as invalid (the form points at it after a failed save) */
  invalid?: boolean;
}

/**
 * One text written in the three languages of the app (French, Derja in Latin letters, Arabic).
 * Inside a form with language tabs (EditorLanguageProvider) only the chosen language is shown,
 * with the French text as a reminder while translating.
 */
export function LocalizedField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 2,
  frenchRequired = false,
  placeholder,
  invalid = false,
}: LocalizedFieldProps) {
  const id = useId();
  const only = useEditorLanguage();
  const languages = only ? EDITOR_LANGUAGES.filter((l) => l.key === only) : EDITOR_LANGUAGES;
  const french = value.fr?.trim();

  return (
    <fieldset className="min-w-0">
      <legend className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{label}</legend>
      <div className={`grid grid-cols-1 gap-2 ${multiline || only ? '' : 'sm:grid-cols-3'}`}>
        {languages.map(({ key, label: langLabel, rtl }) => {
          const required = frenchRequired && key === 'fr';
          const common = {
            id: `${id}-${key}`,
            value: value[key] ?? '',
            dir: rtl ? ('rtl' as const) : undefined,
            lang: key === 'ar' ? 'ar' : key === 'fr' ? 'fr' : 'ar-Latn-TN',
            required,
            'aria-invalid': invalid && key === 'fr' ? true : undefined,
            placeholder: key === 'fr' ? placeholder : french ? `Traduction de : ${french.slice(0, 60)}` : undefined,
            className: `${INPUT} ${invalid && key === 'fr' ? '!border-rose-500 ring-2 ring-rose-500/20' : ''}`,
          };
          return (
            <div key={key} className="min-w-0">
              {!only && (
                <label htmlFor={common.id} className="text-[10px] font-semibold text-ink-muted">
                  {langLabel}
                  {required && ' *'}
                </label>
              )}
              {multiline ? (
                <textarea {...common} rows={rows} onChange={(e) => onChange({ ...value, [key]: e.target.value })} />
              ) : (
                <input {...common} type="text" onChange={(e) => onChange({ ...value, [key]: e.target.value })} />
              )}
              {only && key !== 'fr' && french && (
                <p className="mt-1 text-[10px] text-ink-muted line-clamp-2" lang="fr" dir="ltr">
                  <span className="font-semibold">FR :</span> {french}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {!only && <p className="text-[10px] text-ink-muted mt-1">Derja ou arabe vide : le texte français est affiché.</p>}
    </fieldset>
  );
}
