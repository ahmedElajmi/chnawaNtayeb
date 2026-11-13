import { useEffect, useState } from 'react';
import { Check, RotateCcw, SkipForward, X } from 'lucide-react';
import { cellHash, isStepOpen, parseCellId, stepOfCell, type ReviewKind, type WorkflowDefinition } from '@/core/review';
import type { ReviewEntry, ReviewStore } from '@/application';
import { format } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { useNotify } from '../shell/NotifyContext';
import type { KindView } from './kindViews';
import { CELL_STYLE, cellLabel, ruleLabel } from './reviewUi';

export const BUTTON =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50';
export const PRIMARY = `${BUTTON} bg-brand text-on-brand hover:bg-brand-strong`;
export const SECONDARY = `${BUTTON} bg-card border border-line text-ink hover:border-brand`;

/**
 * One cell under review: its content in the workspace (and online beside it when they differ), the
 * note it was sent back with, its checks, and the decision. Used by the item page and by the serial
 * review of the "To validate" page (with keyboard shortcuts: V validate, C send back, → next).
 */
export function CellReviewPanel<K extends ReviewKind>({
  view,
  store,
  entry,
  workflow,
  cellId,
  onDecided,
  onNext,
  shortcuts = false,
  title,
}: {
  view: KindView<K>;
  store: ReviewStore<K>;
  entry: ReviewEntry<K>;
  workflow: WorkflowDefinition;
  cellId: string;
  onDecided?: (verdict: 'approved' | 'rejected') => void;
  onNext?: () => void;
  shortcuts?: boolean;
  /** Shown above the cell name (the item, in the serial review) */
  title?: string;
}) {
  const b = useBackofficeText();
  const notify = useNotify();
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { copy, snapshot } = entry;
  const cell = parseCellId(view.kind, cellId);
  const review = snapshot.cells[cellId];
  const decision = copy.decisions[cellId];
  const step = stepOfCell(workflow, cellId);
  const locked = step ? !isStepOpen(workflow, snapshot, step.id) : false;
  const online = view.online(copy.id);
  const differs = !!(cell && online && review && cellHash(view.kind, online, cell) !== review.hash);
  const canApprove = !busy && !locked && review?.state !== 'approved' && review?.state !== 'incomplete';

  // A new cell starts without a note being written
  const [noteFor, setNoteFor] = useState(cellId);
  if (noteFor !== cellId) {
    setNoteFor(cellId);
    setNote(null);
  }

  const decide = async (verdict: 'approved' | 'rejected', text?: string) => {
    setBusy(true);
    const result = await store.decide(copy.id, [cellId], verdict, text);
    setBusy(false);
    notify(result.ok ? (verdict === 'approved' ? b.reviewApproved : b.reviewSentBack) : result.error, !result.ok);
    if (result.ok || result.local) {
      setNote(null);
      onDecided?.(verdict);
    }
  };

  useEffect(() => {
    if (!shortcuts) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === 'v' || e.key === 'V') {
        if (canApprove) void decide('approved');
      } else if (e.key === 'c' || e.key === 'C') setNote('');
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') onNext?.();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!cell || !review) return <p className="text-sm text-ink-muted">{b.reviewSelectCell}</p>;

  return (
    <section className="p-4 rounded-2xl bg-card border border-line space-y-3" aria-live="polite">
      {title && <p className="text-xs font-semibold text-ink-muted truncate">{title}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold">{cellLabel(b, view.kind, cellId)}</h3>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${CELL_STYLE[review.state].box}`}
        >
          {CELL_STYLE[review.state].label(b)}
        </span>
      </div>

      {review.state === 'changed' && (
        <p className="text-[11px] text-amber-800 dark:text-amber-200">{b.reviewChangedSinceValidation}</p>
      )}
      {decision?.verdict === 'rejected' && decision.note && (
        <p className="text-[11px] p-2 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {format(b.reviewNoteFrom, { note: decision.note })}
        </p>
      )}
      {locked && <p className="text-[11px] text-ink-muted">{b.reviewStepLocked}</p>}

      <div className={`grid gap-3 ${differs ? 'sm:grid-cols-2' : ''}`}>
        <div className="min-w-0 p-3 rounded-xl border border-line bg-surface">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">{b.reviewWorkVersion}</p>
          {view.content(copy.content, cell.part, cell.language)}
        </div>
        {differs && online && (
          <div className="min-w-0 p-3 rounded-xl border border-dashed border-line">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              {b.reviewOnlineVersion}
            </p>
            {view.content(online, cell.part, cell.language)}
          </div>
        )}
      </div>
      {!online && <p className="text-[11px] text-ink-muted">{b.reviewNothingOnline}</p>}

      <div>
        <p className="text-[11px] font-bold text-ink-muted mb-1">{b.reviewChecks}</p>
        {review.checks.length ? (
          <ul className="space-y-0.5">
            {review.checks.map((c) => (
              <li key={c.rule} className="flex items-center gap-1.5 text-xs">
                {c.passed ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                ) : (
                  <X className={`w-3.5 h-3.5 ${c.level === 'blocking' ? 'text-rose-600' : 'text-amber-600'}`} />
                )}
                <span>{ruleLabel(b, c.rule)}</span>
                <span className="text-[10px] text-ink-muted">
                  ({c.level === 'blocking' ? b.reviewBlocking : b.reviewAdvice})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ink-muted">{b.reviewNoChecks}</p>
        )}
      </div>

      {note !== null && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={b.reviewNotePlaceholder}
          rows={2}
          autoFocus
          maxLength={500}
          className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-line"
        />
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {note === null ? (
          <>
            <button type="button" className={PRIMARY} disabled={!canApprove} onClick={() => decide('approved')}>
              <Check className="w-3.5 h-3.5" /> {b.reviewApprove}
              {shortcuts && <kbd className="hidden sm:inline text-[10px] opacity-70">V</kbd>}
            </button>
            <button type="button" className={SECONDARY} disabled={busy || locked} onClick={() => setNote('')}>
              <RotateCcw className="w-3.5 h-3.5" /> {b.reviewReject}
              {shortcuts && <kbd className="hidden sm:inline text-[10px] opacity-70">C</kbd>}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={PRIMARY}
              disabled={busy || !note.trim()}
              onClick={() => decide('rejected', note)}
            >
              <RotateCcw className="w-3.5 h-3.5" /> {b.reviewSendBack}
            </button>
            <button type="button" className={SECONDARY} onClick={() => setNote(null)} aria-label={b.reviewCancel}>
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        {onNext && (
          <button type="button" className={SECONDARY} onClick={onNext}>
            <SkipForward className="w-3.5 h-3.5 rtl:rotate-180" /> {b.reviewNext}
            {shortcuts && <kbd className="hidden sm:inline text-[10px] opacity-70">→</kbd>}
          </button>
        )}
      </div>
    </section>
  );
}
