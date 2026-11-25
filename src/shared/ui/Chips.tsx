import React from 'react';

interface ChipProps {
  label: string;
  pressed?: boolean;
  onClick?: () => void;
  className?: string;
}

/** One filter chip: a real button with `aria-pressed` (logical RTL classes only). */
export const Chip: React.FC<ChipProps> = ({ label, pressed = false, onClick, className = '' }) => (
  <button
    type="button"
    aria-pressed={pressed}
    onClick={onClick}
    className={`inline-flex min-h-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ring-1 transition ${
      pressed ? 'bg-tint text-brand-text ring-transparent' : 'bg-card text-ink-muted ring-line hover:text-ink'
    } ${className}`}
  >
    {label}
  </button>
);

export interface ChipFilterOption {
  value: string;
  label: string;
}

interface ChipFilterProps {
  options: ChipFilterOption[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  /** i18n label of the group */
  ariaLabel: string;
  className?: string;
}

/** Set of filter chips (multi-selection kept by the caller). */
export const ChipFilter: React.FC<ChipFilterProps> = ({ options, selected, onToggle, ariaLabel, className = '' }) => (
  <div className={`flex flex-wrap gap-2 ${className}`} role="group" aria-label={ariaLabel}>
    {options.map((option) => (
      <Chip
        key={option.value}
        label={option.label}
        pressed={selected.includes(option.value)}
        onClick={() => onToggle(option.value)}
      />
    ))}
  </div>
);
