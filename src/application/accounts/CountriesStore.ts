import type { CountryRecord } from '@/core/accounts';
import { initialCountries } from '@/core/accounts';
import type { SharedCollectionWriter } from '../ports';
import { Store } from '../store';

export type CountriesWriteResult = { ok: true; local?: boolean } | { ok: false; error: string };
import type { SyncedCollectionStore } from '../sync/SyncedCollectionStore';

/**
 * Countries of the app: a shared collection followed like the catalog, edited in the
 * backoffice (enable/disable, regions) without a deploy. A built-in seed covers the first
 * launch until the super-admin imports the full list. The per-language ordering is done by the
 * interface (the store only holds the data).
 */
export class CountriesStore extends Store<{ countries: CountryRecord[] }> {
  constructor(
    private readonly collection: SyncedCollectionStore<CountryRecord>,
    private readonly writer: SharedCollectionWriter<CountryRecord>,
    private readonly canEdit: () => boolean
  ) {
    super(CountriesStore.stateOf(collection.getState().items));
    let stored = collection.getState().items;
    collection.subscribe(() => {
      if (collection.getState().items === stored) return;
      stored = collection.getState().items;
      this.setState(CountriesStore.stateOf(stored));
    });
  }

  private static stateOf(stored: CountryRecord[]): { countries: CountryRecord[] } {
    return { countries: stored.length > 0 ? stored : [...initialCountries] };
  }

  start(): () => void {
    return this.collection.start();
  }

  /** Enables or disables a country users may pick. */
  async setEnabled(id: string, enabled: boolean): Promise<CountriesWriteResult> {
    if (!this.canEdit()) return { ok: false, error: 'denied' };
    const country = this.getState().countries.find((c) => c.id === id);
    if (!country) return { ok: false, error: 'unknown-country' };
    const updated: CountryRecord = { ...country, enabled };
    const result = await this.writer.put(updated);
    this.collection.putLocal(updated);
    return { ok: true, ...(result.ok ? {} : { local: true }) };
  }

  /** Adds a country (ISO code, dial code, optional postal digits). */
  async add(country: CountryRecord): Promise<CountriesWriteResult> {
    if (!this.canEdit()) return { ok: false, error: 'denied' };
    if (this.getState().countries.some((c) => c.id === country.id)) {
      return { ok: false, error: 'already-exists' };
    }
    const result = await this.writer.put(country);
    this.collection.putLocal(country);
    return { ok: true, ...(result.ok ? {} : { local: true }) };
  }

  /** Saves the whole region list of a country (names editable in French and Arabic). */
  async saveRegions(id: string, regions: CountryRecord['regions']): Promise<CountriesWriteResult> {
    if (!this.canEdit()) return { ok: false, error: 'denied' };
    const country = this.getState().countries.find((c) => c.id === id);
    if (!country) return { ok: false, error: 'unknown-country' };
    const updated: CountryRecord = { ...country, regions };
    const result = await this.writer.put(updated);
    this.collection.putLocal(updated);
    return { ok: true, ...(result.ok ? {} : { local: true }) };
  }
}
