import { useEffect, useState } from 'react';
import type { StoredMatchingSettings } from '@/application';
import { cls, Section } from './ui';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
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
  const [versions, setVersions] = useState<StoredMatchingSettings[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    load().then((list) => !cancelled && setVersions(list));
    return () => {
      cancelled = true;
    };
  }, [load, refreshKey]);

  return (
    <Section
      title="Historique des versions"
      hint="Chaque publication est conservée. Republier une ancienne version crée une nouvelle version."
    >
      {versions === null && <p className="text-xs text-ink-muted">Chargement…</p>}
      {versions?.length === 0 && (
        <p className="text-xs text-ink-muted">
          Aucune version publiée : l’application utilise les réglages par défaut.
        </p>
      )}
      <ul className="divide-y divide-line">
        {versions?.map((v) => (
          <li key={v.version} className="flex flex-wrap items-center gap-2 py-2 text-xs">
            <span className="font-bold text-ink w-10">v{v.version}</span>
            <span className="text-ink-muted w-32">{formatDate(v.updatedAt)}</span>
            <span className="flex-1 min-w-40 text-ink">{v.note || '—'}</span>
            {v.version === activeVersion ? (
              <span className="text-[11px] font-bold text-emerald-600">en ligne</span>
            ) : (
              <>
                <button className={cls.secondary} onClick={() => onEdit(v)}>
                  Ouvrir dans le brouillon
                </button>
                <button className={cls.secondary} onClick={() => onRestore(v)}>
                  Republier
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
