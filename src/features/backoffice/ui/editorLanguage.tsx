import { createContext, useContext, useRef, type KeyboardEvent } from 'react';
import { EDITING_ORDER, languageInfo, type Language, type LanguageInfo } from '@/core/shared';

export type EditorLanguage = Language;

/** Languages a form writes, in editing order (reference first, then the variants of each family). */
export const EDITOR_LANGUAGES: readonly LanguageInfo[] = EDITING_ORDER.map(languageInfo);

/**
 * Language being written in a long form (recipe editor). When set, every LocalizedField
 * of the form shows only this language instead of all of them at once.
 */
const EditorLanguageContext = createContext<EditorLanguage | null>(null);

export const EditorLanguageProvider = EditorLanguageContext.Provider;
export const useEditorLanguage = () => useContext(EditorLanguageContext);

/**
 * Tabs to choose the language being written, with how many texts are left to translate.
 * Arrow keys move between tabs (Home / End: first / last), like any tab list.
 */
export function LanguageTabs({
  value,
  onChange,
  missing,
}: {
  value: EditorLanguage;
  onChange: (lang: EditorLanguage) => void;
  missing?: Partial<Record<EditorLanguage, number>>;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (event: KeyboardEvent, index: number) => {
    const last = EDITOR_LANGUAGES.length - 1;
    // In a right-to-left page the next tab is on the left
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const nextKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const previousKey = rtl ? 'ArrowRight' : 'ArrowLeft';
    const target =
      event.key === nextKey || event.key === 'ArrowDown'
        ? index === last
          ? 0
          : index + 1
        : event.key === previousKey || event.key === 'ArrowUp'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : -1;
    if (target < 0) return;
    event.preventDefault();
    onChange(EDITOR_LANGUAGES[target].code);
    buttons.current[target]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Langue de saisie"
      className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-x-auto"
    >
      {EDITOR_LANGUAGES.map(({ code, short, description, htmlLang, family }, index) => {
        const count = missing?.[code] ?? 0;
        const active = value === code;
        // A thin separator between the reference language and the Arabic family
        const startsFamily = index > 0 && EDITOR_LANGUAGES[index - 1].family !== family;
        return (
          <div key={code} className="flex-1 min-w-0 flex items-center gap-1">
            {startsFamily && <span aria-hidden className="w-px self-stretch my-1 bg-line" />}
            <button
              ref={(el) => {
                buttons.current[index] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              title={count ? `${description} : ${count} texte(s) à traduire` : description}
              onClick={() => onChange(code)}
              onKeyDown={(e) => move(e, index)}
              className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                active ? 'bg-card text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <span lang={htmlLang}>{short}</span>
              {count > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] leading-[18px]">
                  {count}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
