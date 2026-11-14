import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { useUnitDescription } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';

export interface UnitInfoProps {
  /** Unit label as stored on the item or ingredient (e.g. 'kg', 'c.à.s'). */
  unit: string;
  className?: string;
}

/**
 * Displays a unit label. When the backoffice defines a description for the
 * unit (shared `units` collection), an info affordance with the localized
 * description is shown next to the label: hovering or focusing reveals it,
 * a tap toggles it on touch screens. Without a configured description the
 * bare unit is shown (nothing is written in the code).
 */
export const UnitInfo: React.FC<UnitInfoProps> = ({ unit, className }) => {
  const description = useUnitDescription(unit);
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  if (!description) return <span className={className}>{unit}</span>;
  return (
    <span className={`group relative inline-flex items-center gap-0.5 align-baseline ${className ?? ''}`}>
      {unit}
      <button
        type="button"
        aria-label={t.unitInfoAria.replace('{unit}', unit)}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="p-0.5 -m-0.5 rounded-full text-accent-text hover:text-brand-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Info className="w-3 h-3" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className={`${
          open ? 'block' : 'hidden'
        } group-hover:block group-focus-within:block absolute z-30 bottom-full start-0 mb-1 w-56 max-w-[60vw] rounded-lg bg-ink text-surface px-2.5 py-1.5 text-[11px] font-medium leading-snug shadow-lg pointer-events-none`}
      >
        {description}
      </span>
    </span>
  );
};
