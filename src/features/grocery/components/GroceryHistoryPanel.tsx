import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Download, History, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { GroceryHistoryEntry } from '@/core/grocery';
import { formatPriceRange } from '@/shared/i18n/formatPrice';
import { exportHistoryXlsx, formatHistoryDate } from '@/shared/export/exportHistoryXlsx';
import { useContainer, useAccountProfile, useKitchen } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';

const FALLBACK_BRAND_COLOR = '#2d5a27';

/** Formats a money amount without locale dependency: "12.5 DT". */
const formatMoney = (value: number, currency: string): string => `${Math.round(value * 100) / 100} ${currency}`;

/**
 * Collapsible panel of the archived shopping lists (server history of the signed-in
 * account). Loads lazily on the first open, one delete per row, styled Excel export.
 * Guests get a sign-in hint instead of the list.
 */
export function GroceryHistoryPanel() {
  const { t } = useLanguage();
  const { groceryHistory } = useContainer();
  const { kitchen } = useKitchen();
  const { profile } = useAccountProfile();

  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<GroceryHistoryEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [duplicated, setDuplicated] = useState(false);

  const isGuest = profile === null;

  const startLoad = () => {
    setLoading(true);
    groceryHistory
      .list()
      .then((list) => {
        setEntries(list);
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  // Lazy load: the first open fetches the history once (the open event, not an effect)
  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && !isGuest && entries === null && !loading) startLoad();
  };

  const handleRemove = async (entryId: string) => {
    if (!entries) return;
    if (!window.confirm(t.groceryHistoryDeleteConfirm)) return;
    const previous = entries;
    setEntries(entries.filter((e) => e.id !== entryId));
    try {
      await groceryHistory.remove(entryId);
    } catch {
      setEntries(previous);
      setFailed(true);
    }
  };

  /** Rebuilds a fresh (unchecked) shopping list from an archived entry and shows it. */
  const handleDuplicate = (entry: GroceryHistoryEntry) => {
    kitchen.createGroceryListFromItems(t.listsFromHistoryName, entry.items);
    setDuplicated(true);
    window.setTimeout(() => setDuplicated(false), 4000);
  };

  const handleExport = async () => {
    if (!entries || exporting) return;
    setExporting(true);
    try {
      await exportHistoryXlsx(entries, {
        fileName: 'historique-courses-chnowa-ntayeb.xlsx',
        sheetTitle: t.groceryHistoryTitle,
        columnLabels: {
          date: t.groceryXlsxDate,
          comment: t.groceryXlsxComment,
          items: t.groceryXlsxItems,
          planned: t.groceryXlsxPlanned,
          actual: t.groceryXlsxActual,
          gap: t.groceryXlsxGap,
          total: t.groceryXlsxTotal,
        },
        currency: t.currency,
        // The export is styled with the app's brand color (theme CSS variable)
        brandColor:
          getComputedStyle(document.documentElement).getPropertyValue('--color-brand').trim() || FALLBACK_BRAND_COLOR,
      });
    } catch {
      setFailed(true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="rounded-2xl bg-card border border-line shadow-xs overflow-hidden">
        {/* Collapsible header */}
        <button
          onClick={toggleOpen}
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition text-left"
        >
          <span className="text-sm sm:text-base font-extrabold text-ink flex items-center gap-2">
            <History className="w-5 h-5 text-accent-text" />
            {t.groceryHistoryTitle}
          </span>
          {open ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {open && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
            {/* Confirmation of a duplicate: the new list is now the active one on screen */}
            {duplicated && (
              <p
                role="status"
                className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {t.listsFromHistoryToast}
              </p>
            )}
            {/* Guests: the history lives on the server, a session is required */}
            {isGuest ? (
              <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {t.grocerySignInHint}
              </p>
            ) : loading ? (
              <p className="text-xs text-ink-muted py-4 text-center">{t.groceryHistoryTitle}…</p>
            ) : failed ? (
              <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {t.groceryHistoryLoadError}
              </p>
            ) : !entries || entries.length === 0 ? (
              <p className="text-xs text-ink-muted py-4 text-center">{t.groceryHistoryEmpty}</p>
            ) : (
              <>
                <div className="divide-y divide-slate-100 dark:divide-slate-700/80 rounded-xl border border-line overflow-hidden">
                  {entries.map((entry) => {
                    const hasPlanned =
                      typeof entry.planned_cost_min === 'number' && typeof entry.planned_cost_max === 'number';
                    const hasSpent = typeof entry.spent_tnd === 'number';

                    // Gap colour of the actual spend vs the planned range
                    let gapTone = '';
                    if (hasPlanned && hasSpent) {
                      gapTone =
                        entry.spent_tnd! <= entry.planned_cost_min!
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : entry.spent_tnd! <= entry.planned_cost_max!
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400';
                    }

                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-3 bg-card hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-ink truncate">
                            {formatHistoryDate(entry.archived_at)}
                            {entry.comment ? (
                              <span className="text-slate-400 font-medium"> · {entry.comment}</span>
                            ) : null}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {t.groceryHistoryCount.replace('{n}', String(entry.items.length))}
                            {hasPlanned && (
                              <>
                                {' · '}
                                {t.groceryPlanned}:{' '}
                                {formatPriceRange(
                                  { min: entry.planned_cost_min!, max: entry.planned_cost_max! },
                                  t.currency
                                )}
                              </>
                            )}
                            {hasSpent && (
                              <>
                                {' · '}
                                <span className={gapTone}>
                                  {t.groceryReal}: {formatMoney(entry.spent_tnd!, t.currency)}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDuplicate(entry)}
                          aria-label={t.listsFromHistory}
                          title={t.listsFromHistory}
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-brand-text hover:bg-slate-100 dark:hover:bg-slate-700 transition shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemove(entry.id)}
                          aria-label={t.groceryHistoryDeleteConfirm}
                          title={t.groceryHistoryDeleteConfirm}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-slate-300 dark:border-slate-600 text-ink text-xs sm:text-sm font-semibold hover:border-brand transition shadow-xs active:scale-95 disabled:opacity-60"
                >
                  <Download className="w-4 h-4 text-accent-text" />
                  <span>{t.groceryExportExcel}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
