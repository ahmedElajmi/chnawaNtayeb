import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: 'current-password' | 'new-password';
  minLength?: number;
  required?: boolean;
  /** Full label for screen readers (translated by the caller) */
  ariaLabel: string;
  /** Text of the show / hide toggle (translated by the caller) */
  toggleLabels: { show: string; hide: string };
  /** Extra classes for the input itself (border colors, widths...) */
  className?: string;
}

/** Password field with a show/hide toggle: fewer typos, no plaintext password left on screen. */
export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  required,
  ariaLabel,
  toggleLabels,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const Toggle = visible ? EyeOff : Eye;
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        aria-label={ariaLabel}
        className={`w-full pr-10 pl-3 py-2 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? toggleLabels.hide : toggleLabels.show}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-ink transition-colors"
      >
        <Toggle className="w-4 h-4" />
      </button>
    </div>
  );
};

/** Satisfies every configured rule (length, digit, uppercase, special) → 0 to 4. */
export function passwordScore(
  password: string,
  criteria: { minLength: number; digit: boolean; uppercase: boolean; special: boolean }
): number {
  let score = 0;
  if (password.length >= criteria.minLength) score++;
  if (criteria.digit && /\d/.test(password)) score++;
  if (criteria.uppercase && /[A-Z]/.test(password)) score++;
  if (criteria.special && /[^A-Za-z0-9]/.test(password)) score++;
  return score;
}
