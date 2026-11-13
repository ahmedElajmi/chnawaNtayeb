import { useState } from 'react';
import { Download, Globe, Power } from 'lucide-react';
import { useCountries } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { countryName, flagEmoji, initialCountries, parseStoredCountries, type CountryRecord } from '@/core/accounts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { useNotify } from '../shell/NotifyContext';

const INPUT =
  'px-3 py-2 text-xs rounded-xl bg-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand';
const PRIMARY =
  'px-3 py-2 rounded-xl bg-brand text-on-brand font-bold text-xs hover:bg-brand-strong transition disabled:opacity-50';
const SECONDARY =
  'px-3 py-2 rounded-xl border border-line bg-card text-ink font-semibold text-xs hover:border-brand transition disabled:opacity-50';

/**
 * Countries users may pick (phone dial codes, address regions): enable, add, edit regions.
 * The database is the source of truth; the built-in seed can be imported in one click.
 */
export function CountriesPage() {
  const b = useBackofficeText();
  const notify = useNotify();
  const { language } = useLanguage();
  const { countries, countriesStore } = useCountries();
  const [iso, setIso] = useState('');
  const [dial, setDial] = useState('');
  const [postal, setPostal] = useState('');
  const [busy, setBusy] = useState(false);
  // Regions editing: one textarea per open country, "id | français | arabe" per line
  const [editingId, setEditingId] = useState<string | null>(null);
  const [regionsText, setRegionsText] = useState('');

  const openRegions = (country: CountryRecord) => {
    setEditingId(editingId === country.id ? null : country.id);
    setRegionsText(country.regions.map((r) => `${r.id} | ${r.name_fr} | ${r.name_ar}`).join('\n'));
  };

  const saveRegions = async (country: CountryRecord) => {
    setBusy(true);
    try {
      const regions = regionsText
        .split('\n')
        .map((line) => line.split('|').map((part) => part.trim()))
        .filter(([id, fr, ar]) => id && fr && ar && !['-', '—'].includes(fr))
        .map(([id, fr, ar]) => ({ id, name_fr: fr, name_ar: ar }));
      const result = await countriesStore.saveRegions(country.id, regions);
      notify(result.ok ? b.teamUpdated : (result.error ?? ''), !result.ok);
      if (result.ok) setEditingId(null);
    } finally {
      setBusy(false);
    }
  };

  const addCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = iso.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(id) || !/^\+[1-9]\d{0,3}$/.test(dial.trim())) {
      notify(b.countriesIso, true);
      return;
    }
    setBusy(true);
    try {
      const digits = parseInt(postal.trim(), 10);
      const result = await countriesStore.add({
        id,
        dial: dial.trim(),
        enabled: false,
        regions: [],
        ...(Number.isInteger(digits) && digits > 0 && digits <= 10 ? { postal_digits: digits } : {}),
      });
      notify(result.ok ? b.teamAdded : (result.error ?? ''), !result.ok);
      if (result.ok) {
        setIso('');
        setDial('');
        setPostal('');
        setEditingId(id);
        setRegionsText('');
      }
    } finally {
      setBusy(false);
    }
  };

  const importSeed = async () => {
    setBusy(true);
    try {
      const known = new Set(countries.map((c) => c.id));
      const missing = initialCountries.filter((c) => !known.has(c.id));
      for (const country of parseStoredCountries(missing)) await countriesStore.add(country);
      notify(missing.length ? b.countriesImported : formatAlready(b.countriesAlreadyThere, known), !missing.length);
    } finally {
      setBusy(false);
    }
  };

  const sorted = [...countries].sort((a, b2) =>
    countryName(a.id, language).localeCompare(countryName(b2.id, language))
  );

  return (
    <div className="space-y-3">
      <form className="rounded-2xl bg-card border border-line p-3 flex flex-wrap items-end gap-2" onSubmit={addCountry}>
        <label className="text-[11px] font-semibold text-ink-muted">
          {b.countriesIso}
          <input
            value={iso}
            onChange={(e) => setIso(e.target.value)}
            maxLength={2}
            dir="ltr"
            className={`${INPUT} mt-1 w-24`}
          />
        </label>
        <label className="text-[11px] font-semibold text-ink-muted">
          {b.countriesDial}
          <input
            value={dial}
            onChange={(e) => setDial(e.target.value)}
            maxLength={5}
            dir="ltr"
            placeholder="+216"
            className={`${INPUT} mt-1 w-28`}
          />
        </label>
        <label className="text-[11px] font-semibold text-ink-muted">
          {b.countriesPostal}
          <input
            value={postal}
            onChange={(e) => setPostal(e.target.value)}
            inputMode="numeric"
            className={`${INPUT} mt-1 w-28`}
          />
        </label>
        <button type="submit" className={PRIMARY} disabled={busy}>
          <Globe className="w-3.5 h-3.5 inline" /> {b.countriesAdd}
        </button>
        <button type="button" onClick={importSeed} className={SECONDARY} disabled={busy}>
          <Download className="w-3.5 h-3.5 inline" /> {b.countriesImport}
        </button>
      </form>

      <ul className="divide-y divide-line rounded-2xl bg-card border border-line">
        {sorted.map((country) => (
          <li key={country.id} className="p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-base w-8 text-center">{flagEmoji(country.id) || country.id}</span>
              <span className="flex-1 min-w-40 font-semibold">{countryName(country.id, language)}</span>
              <span className="text-ink-muted" dir="ltr">
                {country.dial}
              </span>
              <span className="text-ink-muted">{formatCount(b.countriesRegions, country.regions.length)}</span>
              <button
                type="button"
                onClick={() => openRegions(country)}
                className="text-[11px] font-semibold text-accent-text hover:underline"
              >
                ✎
              </button>
              <button
                type="button"
                aria-pressed={country.enabled}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition ${
                  country.enabled
                    ? 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-line text-ink-muted'
                }`}
                onClick={async () => {
                  const result = await countriesStore.setEnabled(country.id, !country.enabled);
                  if (!result.ok) notify(result.error ?? '', true);
                }}
              >
                <Power className="w-3 h-3 inline" /> {country.enabled ? b.countriesEnabled : b.countriesDisabled}
              </button>
            </div>
            {editingId === country.id && (
              <div className="space-y-2">
                <p className="text-[11px] text-ink-muted">{b.countriesRegionsHint}</p>
                <textarea
                  value={regionsText}
                  onChange={(e) => setRegionsText(e.target.value)}
                  rows={Math.min(10, Math.max(3, country.regions.length + 1))}
                  dir="ltr"
                  className={`${INPUT} w-full font-mono`}
                />
                <button type="button" onClick={() => saveRegions(country)} className={PRIMARY} disabled={busy}>
                  {b.countriesSaveRegions}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const formatCount = (template: string, count: number) => template.replace('{count}', String(count));
const formatAlready = (template: string, known: Set<string>) => template.replace('{list}', [...known].join(', '));
