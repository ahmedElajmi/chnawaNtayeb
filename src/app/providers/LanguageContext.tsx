import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, pickLocalized } from '@/core/shared';
import type { ChefTip, RecipeStep } from '@/core/catalog';
import { translations, TranslationDictionary } from '@/shared/i18n/translations';
import { useContainer } from '@/app/ContainerContext';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
  dir: 'ltr' | 'rtl';
  getIngredientName: (item: { name_fr: string; name_derja: string; name_ar: string }) => string;
  getRecipeName: (recipe: { name_fr: string; name_derja: string; name_ar: string }) => string;
  getRecipeDesc: (recipe: { description_fr: string; description_derja: string; description_ar: string }) => string;
  getThemeName: (theme: { name_fr: string; name_derja: string; name_ar: string }) => string;
  getStepText: (step: RecipeStep) => string;
  getChefTip: (tip: ChefTip | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences } = useContainer();
  const [language, setLanguageState] = useState<Language>(() => preferences.load().language);

  useEffect(() => {
    // Update HTML dir and lang attributes
    const isRtl = language === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language === 'ar' ? 'ar' : language === 'derja' ? 'ar-TN' : 'fr';
  }, [language]);

  const setLanguage = (newLang: Language) => {
    preferences.save({ language: newLang });
    setLanguageState(newLang);
  };

  const t = translations[language] || translations.derja;
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  // Every content text follows the chosen language, with the fallbacks of pickLocalized
  const getIngredientName = (item: { name_fr: string; name_derja: string; name_ar: string }) =>
    pickLocalized(language, { fr: item.name_fr, derja: item.name_derja, ar: item.name_ar });

  const getRecipeName = getIngredientName;

  const getRecipeDesc = (recipe: { description_fr: string; description_derja: string; description_ar: string }) =>
    pickLocalized(language, { fr: recipe.description_fr, derja: recipe.description_derja, ar: recipe.description_ar });

  const getStepText = (step: RecipeStep) =>
    pickLocalized(language, { fr: step.instruction_fr, derja: step.instruction_derja, ar: step.instruction_ar });

  const getChefTip = (tip: ChefTip | undefined) => (tip ? pickLocalized(language, tip) : '');

  const getThemeName = getRecipeName;

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
        getStepText,
        getChefTip,
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
