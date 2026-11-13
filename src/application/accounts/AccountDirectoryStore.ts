import type { AccountSummary } from '@/core/accounts';
import type { AccountDirectoryRepository, AccountTypeFilter } from '../ports';
import { Store } from '../store';

const PAGE_SIZE = 24;

export interface AccountDirectoryState {
  users: AccountSummary[];
  /** Whole filtered set, never the number shown */
  total: number;
  search: string;
  type: AccountTypeFilter;
  loading: boolean;
  /** True when a page was fetched and the next one is available */
  hasMore: boolean;
}

/**
 * Backoffice directory of the accounts: paged list (24 by page), e-mail prefix search and a
 * kind filter. The database rules only let managers list the accounts, so the store is only
 * started where a manager is signed in (the backoffice).
 */
export class AccountDirectoryStore extends Store<AccountDirectoryState> {
  constructor(private readonly repo: AccountDirectoryRepository) {
    super({ users: [], total: 0, search: '', type: 'all', loading: false, hasMore: false });
  }

  /** Reloads from the beginning with the current search and filter. */
  async reset(): Promise<void> {
    await this.load(
      {
        users: [],
        total: 0,
        search: this.getState().search,
        type: this.getState().type,
        loading: true,
        hasMore: false,
      },
      null
    );
  }

  async setSearch(search: string): Promise<void> {
    await this.load({ users: [], total: 0, search, type: this.getState().type, loading: true, hasMore: false }, null);
  }

  async setType(type: AccountTypeFilter): Promise<void> {
    await this.load({ users: [], total: 0, search: this.getState().search, type, loading: true, hasMore: false }, null);
  }

  async loadMore(): Promise<void> {
    const { users } = this.getState();
    const last = users[users.length - 1];
    if (!last) return;
    await this.load(this.getState(), last.uid);
  }

  private async load(state: AccountDirectoryState, cursor: string | null): Promise<void> {
    this.setState(state);
    const page = await this.repo.list({
      type: state.type,
      search: state.search.trim() || undefined,
      limit: PAGE_SIZE,
      cursor,
    });
    // A newer reset/search may have started while reading: only the matching view wins.
    const current = this.getState();
    if (current.search !== state.search || current.type !== state.type) return;
    this.setState({
      ...current,
      users: cursor ? [...current.users, ...page.items] : page.items,
      total: page.total,
      hasMore: page.nextCursor !== null,
      loading: false,
    });
  }
}
