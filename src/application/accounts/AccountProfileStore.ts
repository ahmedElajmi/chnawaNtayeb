import {
  resolveUserProfile,
  validateProfileUpdate,
  type CountryRecord,
  type FieldError,
  type UserProfile,
} from '@/core/accounts';
import type { AccountProfileRepository } from '../ports';
import { Store } from '../store';

export interface AccountProfileState {
  /** The profile of the signed-in account, null for guests and signed-out visitors */
  profile: UserProfile | null;
  loading: boolean;
}

export type AccountProfileUpdateResult = { ok: true; profile: UserProfile } | { ok: false; errors: FieldError[] };

/**
 * Profile of the signed-in account (name, phone, address, preferred language). The core
 * revalidates every update against the enabled countries before anything is written.
 */
export class AccountProfileStore extends Store<AccountProfileState> {
  constructor(
    private readonly repo: AccountProfileRepository,
    /** Enabled countries of the moment (used to validate the address) */
    private readonly countries: () => readonly CountryRecord[]
  ) {
    super({ profile: null, loading: false });
  }

  /** Loads the profile of an account; null uid (guest, signed-out) clears the state. */
  async identify(uid: string | null): Promise<void> {
    if (!uid) {
      this.setState({ profile: null, loading: false });
      return;
    }
    this.setState({ profile: null, loading: true });
    const stored = await this.repo.read(uid);
    // A newer identify may have happened while reading: only the latest wins.
    if (this.getState().loading) this.setState({ profile: stored, loading: false });
  }

  /** Validates and writes the editable fields; the returned profile is the one now shown. */
  async update(
    uid: string,
    patch: Partial<Pick<UserProfile, 'displayName' | 'phone' | 'address' | 'preferredLanguage'>>
  ): Promise<AccountProfileUpdateResult> {
    const current = this.getState().profile ?? resolveUserProfile({ uid });
    if (!current) return { ok: false, errors: [] };
    const errors = validateProfileUpdate(patch, this.countries());
    if (errors.length) return { ok: false, errors };
    const clean: UserProfile = { ...current };
    clean.displayName = (patch.displayName ?? '').trim() || undefined;
    clean.phone = patch.phone?.trim() ? patch.phone.trim() : undefined;
    const address = patch.address;
    const hasAddress = address && (address.line.trim() || address.city.trim() || address.postalCode.trim());
    clean.address = hasAddress ? address : undefined;
    clean.preferredLanguage = patch.preferredLanguage || undefined;
    const ok = await this.repo.write(clean);
    if (!ok) return { ok: false, errors: [] };
    this.setState({ profile: clean });
    return { ok: true, profile: clean };
  }
}
