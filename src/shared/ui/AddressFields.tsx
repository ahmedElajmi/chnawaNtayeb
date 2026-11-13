import { countryById, countryName, flagEmoji, regionName, type Address, type CountryRecord } from '@/core/accounts';
import type { Language } from '@/core/shared';

interface AddressFieldsProps {
  address: Address;
  onChange(address: Address): void;
  /** The currently chosen country (drives the region list and the postal format) */
  countries: readonly CountryRecord[];
  language: Language;
  /** Marks fields whose validation failed (field keys 'address.line'...) */
  errors?: ReadonlySet<string>;
  /** Translated placeholders (the component stays free of any dictionary) */
  placeholders: { line: string; region: string; city: string; postal: string };
}

/** Structured postal address (Tunisia first, open to any enabled country), fully optional. */
export function AddressFields({ address, onChange, countries, language, errors, placeholders }: AddressFieldsProps) {
  const country = countryById(countries, address.country);
  const mark = (field: string) => (errors?.has(field) ? ' border-rose-400 dark:border-rose-600' : '');

  return (
    <div className="space-y-2">
      <select
        value={address.country}
        onChange={(e) => {
          const next = countryById(countries, e.target.value);
          onChange({ ...address, country: e.target.value, region: '', postalCode: '', ...(next ? {} : {}) });
        }}
        className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand${mark('address.country')}`}
      >
        {!country && <option value={address.country}>{address.country}</option>}
        {countries
          .filter((c) => !c.deleted)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {flagEmoji(c.id)} {countryName(c.id, language)}
            </option>
          ))}
      </select>
      <input
        type="text"
        value={address.line}
        onChange={(e) => onChange({ ...address, line: e.target.value })}
        placeholder={placeholders.line}
        className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand${mark('address.line')}`}
      />
      {country && country.regions.length > 0 && (
        <select
          value={address.region}
          onChange={(e) => onChange({ ...address, region: e.target.value })}
          className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand${mark('address.region')}`}
        >
          <option value="">{placeholders.region}</option>
          {[...country.regions]
            .sort((a, b) => regionName(a, language).localeCompare(regionName(b, language)))
            .map((r) => (
              <option key={r.id} value={r.id}>
                {regionName(r, language)}
              </option>
            ))}
        </select>
      )}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={address.city}
          onChange={(e) => onChange({ ...address, city: e.target.value })}
          placeholder={placeholders.city}
          className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand${mark('address.city')}`}
        />
        <input
          type="text"
          value={address.postalCode}
          onChange={(e) => onChange({ ...address, postalCode: e.target.value })}
          placeholder={placeholders.postal}
          inputMode="numeric"
          dir="ltr"
          className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-card border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand${mark('address.postalCode')}`}
        />
      </div>
    </div>
  );
}
