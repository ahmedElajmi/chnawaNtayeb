import { useEffect, useState } from 'react';
import type { StoredMatchingSettings } from '@/application';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { cls, Section } from './ui';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
};

/** Every published version; one can be loaded into the draft or published again. */
export function VersionHistory({
  activeVersion,
  load,
  refreshKey,
  onEdit,
  onRestore,
}: {
  activeVersion: number | null;
  load: () => Promise<StoredMatchingSettings[]>;
  refreshKey: unknown;
  onEdit: (v: StoredMatchingSettings) => void;
  onRestore: (v: StoredMatchingSettings) => void;
}) {
  const b = useBackofficeText();
  const [versions, setVersions] = useState<StoredMatchingSettings[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    load().then((list) => !cancelled && setVersions(list));
    return () => {
      cancelled = true;
    };
  }, [load, refreshKey]);

  return (
    <Section title={b.engHistoryTitle} hint={b.engHistoryHint}>
      {versions === null && <p className="text-xs text-ink-muted">{b.engLoading}</p>}
      {versions?.length === 0 && <p className="text-xs text-ink-muted">{b.engNoPublishedVersion}</p>}
      <ul className="divide-y divide-line">
        {versions?.map((v) => (
          <li key={v.version} className="flex flex-wrap items-center gap-2 py-2 text-xs">
            <span className="font-bold text-ink w-10">v{v.version}</span>
            <span className="text-ink-muted w-32">{formatDate(v.updatedAt)}</span>
            <span className="flex-1 min-w-40 text-ink">{v.note || '—'}</span>
            {v.version === activeVersion ? (
              <span className="text-[11px] font-bold text-emerald-600">{b.engOnlineBadge}</span>
            ) : (
              <>
                <button className={cls.secondary} onClick={() => onEdit(v)}>
                  {b.engOpenInDraft}
                </button>
                <button className={cls.secondary} onClick={() => onRestore(v)}>
                  {b.engRepublish}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
