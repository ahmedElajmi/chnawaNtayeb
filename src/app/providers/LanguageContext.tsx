import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { languageInfo, localizedField, pickLocalized, type Language } from '@/core/shared';
import type { ChefTip, RecipeStep } from '@/core/catalog';
import { translations, TranslationDictionary } from '@/shared/i18n/translations';
import { useContainer } from '@/app/ContainerContext';

/** Any item with a localized name (`name_fr`, `name_derja`, `name_ar`, optional variants). */
type LocalizedName = { name_fr: string };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
  dir: 'ltr' | 'rtl';
  getIngredientName: (item: LocalizedName) => string;
  getRecipeName: (recipe: LocalizedName) => string;
  getRecipeDesc: (recipe: { description_fr: string }) => string;
  getThemeName: (theme: LocalizedName) => string;
  /** Name in another language, shown under the main one; '' when it would only repeat it */
  getSecondaryName: (item: LocalizedName) => string;
  /** Sorts named items (ingredients, recipes...) alphabetically in the current language */
  compareNames: (a: LocalizedName, b: LocalizedName) => number;
  getStepText: (step: RecipeStep) => string;
  getChefTip: (tip: ChefTip | undefined) => string;
  /** Any localized field (`<field>_<language>`) of an item, in the current language with its fallbacks */
  getLocalized: (item: object, field: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences } = useContainer();
  const [language, setLanguageState] = useState<Language>(() => preferences.load().language);
  const info = languageInfo(language);

  useEffect(() => {
    document.documentElement.dir = info.dir;
    document.documentElement.lang = info.htmlLang;
  }, [info]);

  const setLanguage = (newLang: Language) => {
    preferences.save({ language: newLang });
    setLanguageState(newLang);
  };

  const t = translations[language] || translations.derja;
  const dir = info.dir;

  // Every content text follows the chosen language, with the fallbacks of its LANGUAGES entry
  const getLocalized = (item: object, field: string) => pickLocalized(language, localizedField(item, field));
  const getIngredientName = (item: LocalizedName) => getLocalized(item, 'name');
  const getRecipeName = getIngredientName;
  const getRecipeDesc = (recipe: { description_fr: string }) => getLocalized(recipe, 'description');
  const getStepText = (step: RecipeStep) => getLocalized(step, 'instruction');
  const getChefTip = (tip: ChefTip | undefined) => (tip ? pickLocalized(language, tip) : '');
  const getThemeName = getRecipeName;

  // French under the Arabic family (derja, Arabic), derja under French
  const getSecondaryName = (item: LocalizedName) => {
    const main = getIngredientName(item).trim();
    const names = localizedField(item, 'name');
    const other = (info.family === 'fr' ? names.derja : names.fr)?.trim() ?? '';
    return other && other.toLowerCase() !== main.toLowerCase() ? other : '';
  };

  const collator = useMemo(
    () => new Intl.Collator(info.collation, { sensitivity: 'base', numeric: true }),
    [info.collation]
  );
  // Stable while the language does not change (used in memoized sorts of long lists)
  const compareNames = useCallback(
    (a: LocalizedName, b: LocalizedName) => {
      const name = (x: LocalizedName) => pickLocalized(language, localizedField(x, 'name'));
      return collator.compare(name(a), name(b));
    },
    [collator, language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        dir,
        getIngredientName,
        getRecipeName,
        getRecipeDesc,
        getThemeName,
        getSecondaryName,
        compareNames,
        getStepText,
        getChefTip,
        getLocalized,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
