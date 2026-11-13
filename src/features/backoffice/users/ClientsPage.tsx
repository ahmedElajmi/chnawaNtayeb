import { useEffect, useState } from 'react';
import { Loader2, Mail, Search } from 'lucide-react';
import { useAccountDirectory, useContainer } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { useNotify } from '../shell/NotifyContext';

const INPUT =
  'px-3 py-2 text-xs rounded-xl bg-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand';
const CHIP = 'px-2.5 py-1 rounded-lg text-[11px] font-bold border transition';

/** Friendly date of the last sign-in, in the current language. */
function lastLoginText(value: string | undefined, language: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(language === 'ar' || language === 'derja_ar' ? 'ar-TN' : 'fr-TN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Directory of every account (clients and employees): paged list of 24, e-mail prefix search,
 * kind filter. Only what a manager needs — never the favorites or the fridge of anyone.
 */
export function ClientsPage() {
  const b = useBackofficeText();
  const notify = useNotify();
  const { language } = useLanguage();
  const { users, total, loading, hasMore, search, type } = useAccountDirectory();
  const { accountDirectory: directory } = useContainer();
  const [query, setQuery] = useState('');

  useEffect(() => {
    void directory.reset();
  }, [directory]);

  const typeChips: { id: 'all' | 'client' | 'employee'; label: string }[] = [
    { id: 'all', label: b.clientsAll },
    { id: 'client', label: b.clientsOnly },
    { id: 'employee', label: b.employeesOnly },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-card border border-line p-3 flex flex-wrap items-center gap-2">
        <label className="flex-1 min-w-48 relative text-[11px] font-semibold text-ink-muted">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                await directory.setSearch(query);
                if (loading) notify('…', false);
              }
            }}
            onBlur={async () => {
              if ((search ?? '') !== query.trim()) await directory.setSearch(query);
            }}
            placeholder={b.clientsSearch}
            className={`${INPUT} w-full pl-8`}
          />
        </label>
        {typeChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => void directory.setType(chip.id)}
            className={`${CHIP} ${type === chip.id ? 'border-brand text-brand bg-brand/10' : 'border-line text-ink-muted hover:text-ink'}`}
          >
            {chip.label}
          </button>
        ))}
        <span className="text-[11px] font-bold text-ink-muted">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : `${users.length} / ${total}`}
        </span>
      </div>

      {users.length === 0 && !loading ? (
        <p className="text-xs text-ink-muted p-6 text-center">{b.clientsEmpty}</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl bg-card border border-line">
          {users.map((user) => (
            <li key={user.uid} className="p-3 flex flex-wrap items-center gap-3 text-xs">
              <span className="w-8 h-8 rounded-xl bg-brand/10 text-brand font-bold flex items-center justify-center uppercase">
                {(user.displayName ?? user.email ?? '?').charAt(0)}
              </span>
              <div className="flex-1 min-w-48">
                <p className="font-bold text-ink break-all">
                  {user.displayName || (user.isAnonymous ? b.clientsGuest : '—')}
                </p>
                <p className="text-ink-muted break-all flex items-center gap-1" dir="ltr">
                  {user.email ? <Mail className="w-3 h-3" /> : null}
                  {user.email ?? b.clientsNoEmail}
                </p>
              </div>
              {user.phone && (
                <span className="text-ink-muted" dir="ltr">
                  {user.phone}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                  user.type === 'employee'
                    ? 'border-accent-text/40 text-accent-text bg-accent-text/10'
                    : 'border-line text-ink-muted'
                }`}
              >
                {user.type === 'employee' ? b.employeesOnly : user.isAnonymous ? b.clientsGuest : b.clientsOnly}
              </span>
              <span className="text-ink-muted min-w-24">{lastLoginText(user.lastLogin, language)}</span>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => void directory.loadMore()}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-line bg-card text-ink font-semibold text-xs hover:border-brand transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : b.clientsShowMore}
          </button>
        </div>
      )}
    </div>
  );
}
