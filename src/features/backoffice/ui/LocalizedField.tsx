import { useId } from 'react';
import { languageInfo, pickLocalized, REFERENCE_LANGUAGE, type Language, type LocalizedText } from '@/core/shared';
import { EDITOR_LANGUAGES, useEditorLanguage } from './editorLanguage';

const INPUT = 'w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1';

interface LocalizedFieldProps {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  /** Textarea instead of a one-line input (descriptions, steps, tips). */
  multiline?: boolean;
  rows?: number;
  /** French is the reference language: mark it required (the other languages fall back to it). */
  frenchRequired?: boolean;
  placeholder?: string;
  /** Shown as invalid (the form points at it after a failed save) */
  invalid?: boolean;
}

/** Texts shown as a reminder while translating into `lang`: French, plus derja in Latin letters for an Arabic-script variant. */
const REMINDERS: Partial<Record<Language, Language[]>> = {
  derja: ['fr'],
  derja_ar: ['fr', 'derja'],
  ar: ['fr', 'derja_ar'],
};

/**
 * One text written in every language and language variant of the app (see LANGUAGES).
 * Inside a form with language tabs (EditorLanguageProvider) only the chosen language is shown, with
 * the texts to translate from as a reminder and what the public sees while it stays empty.
 * Elsewhere every language is shown side by side.
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
  const languages = only ? EDITOR_LANGUAGES.filter((l) => l.code === only) : EDITOR_LANGUAGES;

  return (
    <fieldset className="min-w-0">
      <legend className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{label}</legend>
      <div className={`grid grid-cols-1 gap-2 ${only ? '' : multiline ? 'lg:grid-cols-2' : 'sm:grid-cols-2'}`}>
        {languages.map(({ code, description, dir, htmlLang }) => {
          const isReference = code === REFERENCE_LANGUAGE;
          const required = frenchRequired && isReference;
          const own = value[code] ?? '';
          // What the public sees while this language is empty (its fallback)
          const shown = own.trim() ? '' : pickLocalized(code, { ...value, [code]: '' });
          const reminders = (REMINDERS[code] ?? [])
            .map((lang) => ({ lang, text: value[lang]?.trim() ?? '' }))
            .filter((r) => r.text);
          const common = {
            id: `${id}-${code}`,
            value: own,
            dir,
            lang: htmlLang,
            required,
            'aria-invalid': invalid && isReference ? true : undefined,
            placeholder: isReference ? placeholder : shown ? `Vide : « ${shown.slice(0, 50)} » est affiché` : undefined,
            className: `${INPUT} ${invalid && isReference ? '!border-rose-500 ring-2 ring-rose-500/20' : ''}`,
          };
          const update = (text: string) => onChange({ ...value, [code]: text });
          return (
            <div key={code} className="min-w-0">
              {!only && (
                <label htmlFor={common.id} className="text-[10px] font-semibold text-ink-muted">
                  {description}
                  {required && ' *'}
                </label>
              )}
              {multiline ? (
                <textarea {...common} rows={rows} onChange={(e) => update(e.target.value)} />
              ) : (
                <input {...common} type="text" onChange={(e) => update(e.target.value)} />
              )}
              {only &&
                reminders.map(({ lang, text }) => (
                  <p
                    key={lang}
                    className="mt-1 text-[10px] text-ink-muted line-clamp-2"
                    lang={languageInfo(lang).htmlLang}
                    dir={languageInfo(lang).dir}
                  >
                    <span className="font-semibold">{languageInfo(lang).short} :</span> {text}
                  </p>
                ))}
            </div>
          );
        })}
      </div>
      {!only && (
        <p className="text-[10px] text-ink-muted mt-1">
          Langue laissée vide : le texte de la langue la plus proche est affiché (le français en dernier).
        </p>
      )}
    </fieldset>
  );
}
