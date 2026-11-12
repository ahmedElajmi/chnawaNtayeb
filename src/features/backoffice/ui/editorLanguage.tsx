import { createContext, useContext } from 'react';
import type { LocalizedText } from '@/core/shared';

export type EditorLanguage = keyof LocalizedText;

export const EDITOR_LANGUAGES: { key: EditorLanguage; label: string; short: string; rtl?: boolean }[] = [
  { key: 'fr', label: 'Français', short: 'FR' },
  { key: 'derja', label: 'Derja (3, 7, 9)', short: 'Derja' },
  { key: 'ar', label: 'العربية', short: 'عربي', rtl: true },
];

/**
 * Language being written in a long form (recipe editor). When set, every LocalizedField
 * of the form shows only this language instead of the three at once.
 */
const EditorLanguageContext = createContext<EditorLanguage | null>(null);

export const EditorLanguageProvider = EditorLanguageContext.Provider;
export const useEditorLanguage = () => useContext(EditorLanguageContext);

/** Tabs to choose the language being written, with how many texts are left to translate. */
export function LanguageTabs({
  value,
  onChange,
  missing,
}: {
  value: EditorLanguage;
  onChange: (lang: EditorLanguage) => void;
  missing?: Partial<Record<EditorLanguage, number>>;
}) {
  return (
    <div
      role="tablist"
      aria-label="Langue de saisie"
      className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800"
    >
      {EDITOR_LANGUAGES.map(({ key, short, label }) => {
        const count = missing?.[key] ?? 0;
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            title={count ? `${label} : ${count} texte(s) à traduire` : label}
            onClick={() => onChange(key)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              active ? 'bg-card text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <span lang={key === 'ar' ? 'ar' : undefined}>{short}</span>
            {count > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] leading-[18px]">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
