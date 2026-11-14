import { useEffect, useMemo, useRef, useState } from 'react';
import { countryName, flagEmoji, type CountryRecord } from '@/core/accounts';
import type { Language } from '@/core/shared';

interface PhoneInputProps {
  /** Full E.164 value ('+21620123456'), '' when empty */
  value: string;
  onChange(value: string): void;
  /** Countries whose dial codes users may pick (super-admin-enabled list) */
  options: readonly CountryRecord[];
  language: Language;
  id?: string;
}

/**
 * Phone input with a searchable dial-code dropdown (flag + country name + code), like most
 * modern sites. One canonical value: the composed E.164 number — the country choice is
 * remembered only through it. Keyboard-friendly (dial: native select) and RTL-safe.
 */
export function PhoneInput({ value, onChange, options, language, id }: PhoneInputProps) {
  const [search, setSearch] = useState('');
  const [dialOpen, setDialOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Closes like every window: click outside or Escape
  useEffect(() => {
    if (!dialOpen) return;
    const close = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setDialOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDialOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [dialOpen]);

  // Split the current value into dial + national part; unknown dial falls back to Tunisia.
  const parsed = useMemo(() => {
    // The longest known dial wins: '+21620...' is +216 then 20..., never +2162.
    const known = [...options].sort((a, b) => b.dial.length - a.dial.length);
    for (const c of known) {
      if (value.startsWith(c.dial) && value.length > c.dial.length) {
        return { dial: c.dial, national: value.slice(c.dial.length), code: c.id };
      }
    }
    const match = value.match(/^(\+\d{1,4})(\d+)$/);
    if (match) {
      const dial = match[1];
      const country = options.find((x) => x.dial === dial);
      return { dial, national: match[2], code: country?.id ?? '' };
    }
    return { dial: '+216', national: value.replace(/\D/g, ''), code: 'TN' };
  }, [value, options]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = options;
    if (!q) return list;
    return list.filter(
      (c) =>
        c.dial.includes(q) || countryName(c.id, language).toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [options, search, language]);

  const emit = (dial: string, national: string) => {
    const digits = national.replace(/\D/g, '');
    onChange(digits ? dial + digits : '');
  };

  return (
    <div ref={wrapperRef} className="relative flex gap-2" dir="ltr">
      <div>
        <button
          type="button"
          onClick={() => setDialOpen((open) => !open)}
          aria-label={`${countryName(parsed.code || 'TN', language)} ${parsed.dial}`}
          className="h-full px-2.5 py-2 rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-ink flex items-center gap-1 hover:border-brand transition"
        >
          <span>{flagEmoji(parsed.code) || '🌐'}</span>
          <span>{parsed.dial}</span>
          <span aria-hidden className="text-[9px] text-slate-400">
            ▼
          </span>
        </button>
        {dialOpen && (
          <div className="absolute z-30 mt-1 w-56 max-h-56 overflow-y-auto rounded-xl bg-surface border border-line shadow-xl p-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="…"
              className="w-full px-2 py-1.5 mb-1 text-xs rounded-lg bg-card border border-line focus:outline-none"
            />
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  emit(c.dial, parsed.national);
                  setDialOpen(false);
                  setSearch('');
                }}
                className={`w-full px-2 py-1.5 text-xs rounded-lg flex items-center gap-2 hover:bg-brand/10 ${
                  c.dial === parsed.dial ? 'bg-brand/15 font-bold' : ''
                }`}
              >
                <span>{flagEmoji(c.id)}</span>
                <span className="flex-1 text-left truncate text-ink">{countryName(c.id, language)}</span>
                <span className="text-slate-400">{c.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="px-2 py-1.5 text-xs text-slate-400">—</p>}
          </div>
        )}
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        value={parsed.national}
        onChange={(e) => emit(parsed.dial, e.target.value)}
        placeholder="20 123 456"
        dir="ltr"
        className="flex-1 min-w-0 px-3 py-2 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}
