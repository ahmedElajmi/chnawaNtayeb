import React from 'react';
import type { DisplayLevel, DisplayReason } from '@/core/matching';
import { formatPriceRange } from '@/shared/i18n/formatPrice';
import { useLanguage } from '@/app/providers/LanguageContext';

/**
 * Display level of a matching result. The level comes from the core display rule (`displayLevel`,
 * mapping of the engine tier); the wording lives here (i18n) and never guarantees that the recipe
 * can be cooked right now (D1: "seem present — quantities to check").
 */
interface MatchingBadgeProps {
  level: DisplayLevel;
  className?: string;
}

const LEVEL_STYLES: Record<DisplayLevel, string> = {
  // One style per level, theme tokens only
  'all-present': 'bg-tint text-success-text',
  almost: 'bg-tint text-warning-text',
  ideas: 'bg-surface text-ink-muted',
};

export const MatchingBadge: React.FC<MatchingBadgeProps> = ({ level, className = '' }) => {
  const { t } = useLanguage();
  const label =
    level === 'all-present' ? t.matchLevelAllPresent : level === 'almost' ? t.matchLevelAlmost : t.matchLevelIdeas;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ${LEVEL_STYLES[level]} ${className}`}
      aria-label={t.matchBadgeAriaLabel}
    >
      {label}
    </span>
  );
};

/** Names of the reason ingredient IDs, joined with the language separator. */
export const MatchReason: React.FC<{
  reasons: DisplayReason[];
  nameOf: (id: string) => string;
  className?: string;
}> = ({ reasons, nameOf, className = '' }) => {
  const { t, language } = useLanguage();
  if (reasons.length === 0) return null;
  // Arabic script families join with the Arabic comma
  const sep = language === 'ar' || language === 'derja_ar' ? '، ' : ', ';
  const names = (ids: string[]) => ids.map(nameOf).filter(Boolean).join(sep);
  return (
    <ul className={`flex flex-col gap-1 text-sm text-ink-muted ${className}`}>
      {reasons.map((reason, i) => {
        let text: string;
        switch (reason.code) {
          case 'missing-key':
            text = t.matchReasonMissingKey.replace('{names}', names(reason.ingredientIds));
            break;
          case 'missing-secondary':
            text = t.matchReasonMissingSecondary.replace('{names}', names(reason.ingredientIds));
            break;
          case 'substitution':
            text = t.matchReasonSubstitution.replace(
              '{names}',
              names(reason.ingredientIds) && reason.substituteId
                ? `${names(reason.ingredientIds)} → ${nameOf(reason.substituteId)}`
                : names(reason.ingredientIds)
            );
            break;
          case 'unknown-quantity':
            text = t.matchReasonUnknownQuantity;
            break;
          case 'missing-cost':
            text = t.matchReasonMissingCost.replace(
              '{range}',
              reason.cost ? formatPriceRange(reason.cost, t.currency) : ''
            );
            break;
        }
        return (
          <li key={i} className="min-w-0">
            {text}
          </li>
        );
      })}
    </ul>
  );
};
