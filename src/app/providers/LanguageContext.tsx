import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language } from '@/core/shared';
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

  const getIngredientName = (item: { name_fr: string; name_derja: string; name_ar: string }) => {
    if (language === 'ar') return item.name_ar;
    if (language === 'fr') return item.name_fr;
    return item.name_derja || item.name_fr;
  };

  const getRecipeName = (recipe: { name_fr: string; name_derja: string; name_ar: string }) => {
    if (language === 'ar') return recipe.name_ar;
    if (language === 'fr') return recipe.name_fr;
    return recipe.name_derja || recipe.name_fr;
  };

  const getRecipeDesc = (recipe: { description_fr: string; description_derja: string; description_ar: string }) => {
    if (language === 'ar') return recipe.description_ar;
    if (language === 'fr') return recipe.description_fr;
    return recipe.description_derja || recipe.description_fr;
  };

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
