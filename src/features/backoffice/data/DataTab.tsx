import { useEffect, useState } from 'react';
import { Cloud, CloudOff, Download, RefreshCw, RotateCcw, Save, Upload } from 'lucide-react';
import { initialRecipes } from '@/core/catalog';
import type { CloudStatus } from '@/application';
import { useContainer } from '@/app/ContainerContext';
import type { CatalogAdminActions } from '../useCatalogAdmin';
import { format } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';

const TILE =
  'p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface transition flex flex-col items-center text-center gap-2';

/** Backup / restore (JSON file) and synchronisation with the shared cloud catalog. */
export function DataTab({ admin, cloudStatus }: { admin: CatalogAdminActions; cloudStatus: CloudStatus }) {
  const { isSyncing } = admin;
  const b = useBackofficeText();
  const { pollingSettings } = useContainer();
  const [interval, setInterval] = useState<number | null>(null);
  const [pollLimit, setPollLimit] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    pollingSettings
      .read()
      .then((s) => {
        setInterval(s.intervalSeconds);
        setPollLimit(s.pollRequestsPerMinute ?? null);
      })
      .catch(() => {
        setInterval(null);
        setPollLimit(null);
      });
  }, [pollingSettings]);

  // Tiny inline feedback: the note under the field says what happened, then fades away
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const showNote = (note: string) => {
    setSavedNote(note);
    window.setTimeout(() => setSavedNote(null), 2500);
  };

  const saveSettings = async () => {
    if (!interval) return;
    setBusy(true);
    try {
      await pollingSettings.save({ intervalSeconds: interval, pollRequestsPerMinute: pollLimit ?? undefined });
      showNote(b.panSyncSaved);
    } catch {
      showNote(b.panSyncError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-card border border-line space-y-4">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider">{b.panBackupTitle}</h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{b.panBackupIntro}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button onClick={admin.downloadBackup} className={`${TILE} hover:border-brand`}>
            <Download className="w-6 h-6 text-brand-text" />
            <span className="text-xs font-bold text-ink">{b.panExport}</span>
            <span className="text-[10px] text-slate-400">{b.panExportHint}</span>
          </button>
          <label className={`${TILE} hover:border-accent cursor-pointer`}>
            <Upload className="w-6 h-6 text-accent-text" />
            <span className="text-xs font-bold text-ink">{b.panImport}</span>
            <span className="text-[10px] text-slate-400">{b.panImportHint}</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) admin.importBackup(file);
                e.target.value = '';
              }}
            />
          </label>
          <button onClick={admin.resetLocalToDefaults} className={`${TILE} hover:border-rose-400`}>
            <RotateCcw className="w-6 h-6 text-rose-500" />
            <span className="text-xs font-bold text-ink">{b.panRestoreDefaults}</span>
            <span className="text-[10px] text-slate-400">
              {format(b.panRestoreDefaultsHint, { count: initialRecipes.length })}
            </span>
          </button>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-card border border-line space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-strong text-white flex items-center justify-center shadow-sm">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">{b.panCloudTitle}</h3>
              <p className="text-xs text-slate-400">
                {b.panCloudProject} <code className="font-mono text-accent-text">{admin.cloudName}</code>
              </p>
            </div>
          </div>
          {cloudStatus === 'connected' ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {b.panConnected}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5">
              <CloudOff className="w-3.5 h-3.5" />
              {b.panLocal}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{b.panCloudIntro}</p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={admin.pushAll}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{b.panPushAll}</span>
          </button>
          <button
            onClick={admin.pullFromCloud}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-slate-400 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-accent-text" />
            <span>{b.panPull}</span>
          </button>
          <button
            onClick={() => admin.resetCloudCatalog(initialRecipes.length)}
            disabled={isSyncing || cloudStatus !== 'connected'}
            title={cloudStatus !== 'connected' ? b.panCloudSessionRequired : undefined}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:border-rose-500 transition disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{b.panResetCloud}</span>
          </button>
        </div>
      </div>

      {/* How often every device polls the change feed: configured here, applied by the server */}
      <div className="p-5 rounded-2xl bg-card border border-line space-y-4">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider">{b.panSyncTitle}</h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{b.panSyncIntro}</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-[11px] font-semibold text-slate-500">
            {b.panSyncLabel}
            <input
              type="number"
              min={15}
              max={600}
              dir="ltr"
              value={interval ?? 60}
              onChange={(e) => setInterval(parseInt(e.target.value, 10) || null)}
              className="mt-1 w-32 px-3 py-2 text-xs rounded-xl bg-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
          <label className="block text-[11px] font-semibold text-slate-500">
            {b.panSyncLimitLabel}
            <input
              type="number"
              min={30}
              max={6000}
              dir="ltr"
              value={pollLimit ?? 300}
              onChange={(e) => setPollLimit(parseInt(e.target.value, 10) || null)}
              className="mt-1 w-32 px-3 py-2 text-xs rounded-xl bg-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
          <button
            type="button"
            onClick={saveSettings}
            disabled={busy || !interval}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong transition shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{b.save}</span>
          </button>
        </div>
        {savedNote && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400" role="status">
            {savedNote}
          </p>
        )}
      </div>
    </div>
  );
}
