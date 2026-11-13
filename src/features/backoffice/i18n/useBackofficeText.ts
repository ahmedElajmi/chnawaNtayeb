import { useLanguage } from '@/app/providers/LanguageContext';
import { BACKOFFICE_TEXTS, type BackofficeTexts } from './backofficeTexts';

/** Backoffice labels in the current language. */
export function useBackofficeText(): BackofficeTexts {
  const { language } = useLanguage();
  return BACKOFFICE_TEXTS[language] ?? BACKOFFICE_TEXTS.fr;
}
