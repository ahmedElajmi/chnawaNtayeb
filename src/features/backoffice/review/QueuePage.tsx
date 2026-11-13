import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowLeft, Check, PlayCircle } from 'lucide-react';
import {
  groupQueue,
  parseCellId,
  type QueueCell,
  type QueueGroup,
  type QueueGrouping,
  type ReviewKind,
} from '@/core/review';
import { languageInfo, pickLocalized } from '@/core/shared';
import { useReview } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { patronPath } from '@/shared/paths';
import { format, type BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { useNotify } from '../shell/NotifyContext';
import { CellReviewPanel, PRIMARY, SECONDARY } from './CellReviewPanel';
import { useIngredientView, useRecipeView, type KindView } from './kindViews';
import { CELL_STYLE, cellLabel, partLabel } from './reviewUi';
import { useReviewQueue } from './useReviewQueue';

const GROUPINGS: { id: QueueGrouping; label: (b: BackofficeTexts) => string }[] = [
  { id: 'item', label: (b) => b.queueByItem },
  { id: 'step', label: (b) => b.queueByStep },
  { id: 'part', label: (b) => b.queueByPart },
  { id: 'language', label: (b) => b.queueByLanguage },
  { id: 'kind', label: (b) => b.queueByKind },
  { id: 'author', label: (b) => b.queueByAuthor },
];

const GROUPING_PARAM = 'groupe';

/**
 * /patron/a-valider — every cell waiting for the reviewer, grouped as chosen (item, step, part,
 * language, kind, author) with the counts of the whole queue. A group is reviewed in series: its
 * cells follow one another, across items, with the keyboard (V, C, →) or large buttons on a phone.
 */
export function QueuePage() {
  const b = useBackofficeText();
  const notify = useNotify();
  const { language } = useLanguage();
  const [params, setParams] = useSearchParams();
  const asked = params.get(GROUPING_PARAM) as QueueGrouping | null;
  const grouping: QueueGrouping = GROUPINGS.some((g) => g.id === asked) ? asked! : 'item';
  const { entries, counts, workflows } = useReviewQueue();
  const views: { [K in ReviewKind]: KindView<K> } = { recipe: useRecipeView(), ingredient: useIngredientView() };
  const stores = { recipe: useReview('recipe'), ingredient: useReview('ingredient') };
  const groups = useMemo(() => groupQueue(entries, grouping, workflows), [entries, grouping, workflows]);
  const [series, setSeries] = useState<{ title: string; cells: QueueCell[]; index: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const itemName = (kind: ReviewKind, id: string) => {
    const entry = stores[kind].entries.find((e) => e.copy.id === id);
    return entry ? (views[kind].name as (item: unknown) => string)(entry.copy.content) : id;
  };
  const kindLabel = (kind: ReviewKind) => (kind === 'recipe' ? b.recipes : b.ingredients);

  const groupTitle = (group: QueueGroup): string => {
    const kind = group.kind;
    // Item, step and part keys are "<kind>:<id>"
    const rest = group.key.includes(':') ? group.key.slice(group.key.indexOf(':') + 1) : group.key;
    switch (grouping) {
      case 'item':
        return `${itemName(kind!, rest)} · ${kindLabel(kind!)}`;
      case 'step': {
        const step = workflows[kind!].steps.find((s) => s.id === rest);
        return `${step ? pickLocalized(language, step.label) || step.id : rest} · ${kindLabel(kind!)}`;
      }
      case 'part':
        return `${cellLabel(b, kind!, rest)} · ${kindLabel(kind!)}`;
      case 'language':
        return group.key === 'common' ? b.reviewCommon : languageInfo(group.key as never).selectorLabel;
      case 'kind':
        return kindLabel(group.key as ReviewKind);
      default:
        return group.key === '?' ? '—' : group.key;
    }
  };

  /** Cells of a group that can be validated together (waiting, no blocking check failing). */
  const readyOf = (group: QueueGroup) =>
    group.cells.filter((c) => {
      const entry = stores[c.kind].entries.find((e) => e.copy.id === c.entry);
      const review = entry?.snapshot.cells[c.cell];
      return review && review.checks.every((check) => check.level !== 'blocking' || check.passed);
    });

  const approveGroup = async (group: QueueGroup) => {
    const ready = readyOf(group);
    const lines = ready.map((c) => `• ${itemName(c.kind, c.entry)} — ${cellLabel(b, c.kind, c.cell)}`).join('\n');
    if (!window.confirm(`${format(b.reviewApproveReady, { count: ready.length })} ?\n\n${lines}`)) return;
    setBusy(true);
    // One write per item, with all its cells of the group
    const byItem = new Map<string, QueueCell[]>();
    for (const c of ready) byItem.set(`${c.kind}:${c.entry}`, [...(byItem.get(`${c.kind}:${c.entry}`) ?? []), c]);
    let error = '';
    for (const cells of byItem.values()) {
      const { kind, entry } = cells[0];
      const result = await stores[kind].store.decide(
        entry,
        cells.map((c) => c.cell),
        'approved'
      );
      if (!result.ok) error = result.error;
    }
    setBusy(false);
    notify(error || b.reviewApproved, !!error);
  };

  if (series) {
    const current = series.cells[series.index];
    if (!current) {
      return (
        <div className="space-y-3">
          <p className="p-4 rounded-2xl bg-card border border-line text-sm font-bold text-emerald-700 dark:text-emerald-300">
            {b.queueSeriesDone}
          </p>
          <button type="button" className={SECONDARY} onClick={() => setSeries(null)}>
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {b.queueBack}
          </button>
        </div>
      );
    }
    const store = stores[current.kind];
    const entry = store.entries.find((e) => e.copy.id === current.entry);
    const next = () => setSeries({ ...series, index: series.index + 1 });
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" className={SECONDARY} onClick={() => setSeries(null)}>
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {b.queueBack}
          </button>
          <p className="text-xs font-semibold text-ink-muted">
            {series.title} ·{' '}
            <span className="tabular-nums">
              {series.index + 1} / {series.cells.length}
            </span>
          </p>
        </div>
        {entry ? (
          // Same panel as the item page; `key` gives each cell a fresh panel
          <CellReviewPanel
            key={`${current.kind}:${current.entry}:${current.cell}`}
            view={views[current.kind] as KindView<ReviewKind>}
            store={store.store as never}
            entry={entry as never}
            workflow={workflows[current.kind]}
            cellId={current.cell}
            title={itemName(current.kind, current.entry)}
            onDecided={next}
            onNext={next}
            shortcuts
          />
        ) : (
          <button type="button" className={SECONDARY} onClick={next}>
            {b.reviewNext}
          </button>
        )}
        <Link
          to={patronPath(views[current.kind].listPage, current.entry)}
          className="inline-block text-xs font-semibold text-ink-muted hover:text-ink underline"
        >
          {b.queueOpenItem}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          [b.queueCountPending, counts.pending],
          [b.queueCountItems, counts.items],
          [b.queueCountToFix, counts.toFix],
          [b.queueCountPublishable, counts.publishable],
        ].map(([label, value]) => (
          <div key={label} className="p-3 rounded-2xl bg-card border border-line">
            <p className="text-[11px] text-ink-muted">{label}</p>
            <p className="text-xl font-extrabold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1" role="group" aria-label={b.queueGroupBy}>
        <span className="shrink-0 self-center text-[11px] font-semibold text-ink-muted">{b.queueGroupBy}</span>
        {GROUPINGS.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={grouping === g.id}
            onClick={() => setParams({ [GROUPING_PARAM]: g.id }, { replace: true })}
            className={`shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition ${
              grouping === g.id
                ? 'bg-brand text-on-brand border-brand'
                : 'bg-card border-line text-ink hover:border-brand'
            }`}
          >
            {g.label(b)}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <p className="p-4 rounded-2xl bg-card border border-line text-sm text-ink-muted">{b.queueEmpty}</p>
      ) : (
        <ul className="space-y-2">
          {groups.map((group) => {
            const title = groupTitle(group);
            const ready = readyOf(group);
            const kindOfGroup = group.cells[0].kind;
            return (
              <li key={group.key} className="p-3 sm:p-4 rounded-2xl bg-card border border-line space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold min-w-0 truncate">{title}</p>
                  <span className="text-xs font-bold tabular-nums text-ink-muted">
                    {format(b.queueCells, { count: group.cells.length })}
                  </span>
                </div>
                {/* One segment per waiting cell, in the colour of its state */}
                <div className="flex gap-px h-1.5 rounded-full overflow-hidden">
                  {group.cells.map((c) => {
                    const state =
                      stores[c.kind].entries.find((e) => e.copy.id === c.entry)?.snapshot.cells[c.cell]?.state ??
                      'ready';
                    return <span key={`${c.entry}:${c.cell}`} className={`flex-1 ${CELL_STYLE[state].bar}`} />;
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={PRIMARY}
                    onClick={() => setSeries({ title, cells: group.cells, index: 0 })}
                  >
                    <PlayCircle className="w-3.5 h-3.5" /> {b.queueReview}
                  </button>
                  {workflows[kindOfGroup].batchApproval && ready.length > 1 && (
                    <button type="button" className={SECONDARY} disabled={busy} onClick={() => approveGroup(group)}>
                      <Check className="w-3.5 h-3.5" /> {format(b.reviewApproveReady, { count: ready.length })}
                    </button>
                  )}
                  {grouping === 'item' && (
                    <Link
                      to={patronPath(views[kindOfGroup].listPage, group.key.slice(group.key.indexOf(':') + 1))}
                      className={SECONDARY}
                    >
                      {b.queueOpenItem}
                    </Link>
                  )}
                </div>
                {grouping !== 'part' && grouping !== 'item' && (
                  <p className="text-[11px] text-ink-muted truncate">
                    {[...new Set(group.cells.map((c) => parseCellId(c.kind, c.cell)?.part ?? ''))]
                      .map((part) => partLabel(b, part, kindOfGroup))
                      .join(' · ')}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
