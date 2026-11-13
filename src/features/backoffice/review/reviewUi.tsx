import { AlertTriangle, Check, CircleDashed, Lock, PencilLine, RotateCcw } from 'lucide-react';
import {
  isStepOpen,
  parseCellId,
  reviewParts,
  type CellState,
  type ItemStatus,
  type ReviewKind,
  type ReviewSnapshot,
  type WorkflowDefinition,
} from '@/core/review';
import { EDITING_ORDER, languageInfo, pickLocalized } from '@/core/shared';
import { useLanguage } from '@/app/providers/LanguageContext';
import type { BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';

/** Look of each cell state (same colours everywhere: grid, bar, step trail). */
export const CELL_STYLE: Record<CellState, { box: string; bar: string; label: (b: BackofficeTexts) => string }> = {
  approved: {
    box: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800',
    bar: 'bg-emerald-500',
    label: (b) => b.stateApproved,
  },
  ready: {
    box: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-800',
    bar: 'bg-sky-500',
    label: (b) => b.stateReady,
  },
  changed: {
    box: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800',
    bar: 'bg-amber-500',
    label: (b) => b.stateChanged,
  },
  to_fix: {
    box: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800',
    bar: 'bg-rose-500',
    label: (b) => b.stateToFix,
  },
  incomplete: {
    box: 'bg-slate-50 text-slate-600 border-slate-300 border-dashed dark:bg-slate-900 dark:text-slate-300 dark:border-slate-600',
    bar: 'bg-slate-300 dark:bg-slate-600',
    label: (b) => b.stateIncomplete,
  },
};

export const CELL_ICON: Record<CellState, typeof Check> = {
  approved: Check,
  ready: CircleDashed,
  changed: PencilLine,
  to_fix: RotateCcw,
  incomplete: AlertTriangle,
};

const STATUS_STYLE: Record<ItemStatus, { cls: string; label: (b: BackofficeTexts) => string }> = {
  online: { cls: CELL_STYLE.approved.box, label: (b) => b.itemOnline },
  online_pending: { cls: CELL_STYLE.changed.box, label: (b) => b.itemOnlinePending },
  to_fix: { cls: CELL_STYLE.to_fix.box, label: (b) => b.itemToFix },
  publishable: { cls: CELL_STYLE.ready.box, label: (b) => b.itemPublishable },
  in_review: { cls: CELL_STYLE.ready.box, label: (b) => b.itemInReview },
  incomplete: { cls: CELL_STYLE.incomplete.box, label: (b) => b.itemIncomplete },
  ready: { cls: CELL_STYLE.ready.box, label: (b) => b.itemReady },
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  const b = useBackofficeText();
  const { cls, label } = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${cls}`}
    >
      {label(b)}
    </span>
  );
}

const PART_LABEL: Record<string, (b: BackofficeTexts) => string> = {
  identity: (b) => b.partIdentity,
  media: (b) => b.partMedia,
  details: (b) => b.partDetails,
  steps: (b) => b.partSteps,
  tip: (b) => b.partTip,
};

export const partLabel = (b: BackofficeTexts, part: string) => PART_LABEL[part]?.(b) ?? part;

/** Name of a cell: "Étapes · Derja", "Médias". */
export function cellLabel(b: BackofficeTexts, kind: ReviewKind, id: string): string {
  const cell = parseCellId(kind, id);
  if (!cell) return id;
  return cell.language ? `${partLabel(b, cell.part)} · ${languageInfo(cell.language).short}` : partLabel(b, cell.part);
}

/**
 * One segment per cell of the workflow, in the colour of its state: what is missing shows at a glance,
 * not only how much.
 */
export function SegmentedProgress({
  kind,
  snapshot,
  workflow,
  compact = false,
}: {
  kind: ReviewKind;
  snapshot: ReviewSnapshot;
  workflow: WorkflowDefinition;
  compact?: boolean;
}) {
  const b = useBackofficeText();
  const cells = workflow.steps.flatMap((s) => s.cells).filter((c) => snapshot.cells[c]);
  return (
    <div className="min-w-0">
      <div
        className={`flex gap-px ${compact ? 'h-1.5 w-24' : 'h-2.5'} rounded-full overflow-hidden`}
        role="img"
        aria-label={`${b.reviewValidated.replace('{percent}', String(snapshot.percent))}`}
      >
        {cells.map((c) => (
          <span
            key={c}
            title={`${cellLabel(b, kind, c)} : ${CELL_STYLE[snapshot.cells[c].state].label(b)}`}
            className={`flex-1 ${CELL_STYLE[snapshot.cells[c].state].bar} ${
              workflow.requiredCells.includes(c) ? '' : 'opacity-60'
            }`}
          />
        ))}
      </div>
      {!compact && (
        <p className="mt-1 text-[11px] text-ink-muted">
          <span className="font-bold text-ink">{b.reviewValidated.replace('{percent}', String(snapshot.percent))}</span>
          {' · '}
          {b.reviewCompleteness.replace('{percent}', String(snapshot.completeness))}
        </p>
      )}
    </div>
  );
}

/** State of a step: validated, holding a cell sent back, closed (sequential workflow), or still to do. */
function stepState(workflow: WorkflowDefinition, snapshot: ReviewSnapshot, stepId: string) {
  const step = workflow.steps.find((s) => s.id === stepId)!;
  const states = step.cells.map((c) => snapshot.cells[c]?.state).filter(Boolean) as CellState[];
  if (states.length && states.every((s) => s === 'approved')) return 'done';
  if (states.includes('to_fix')) return 'to_fix';
  if (!isStepOpen(workflow, snapshot, stepId)) return 'locked';
  return 'todo';
}

/** The steps of the workflow, in order: done, current, to do (each one opens its first cell). */
export function StepTrail({
  workflow,
  snapshot,
  currentStep,
  onSelect,
}: {
  workflow: WorkflowDefinition;
  snapshot: ReviewSnapshot;
  currentStep: string | null;
  onSelect: (stepId: string) => void;
}) {
  const { language } = useLanguage();
  return (
    <ol className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5">
      {workflow.steps.map((step, index) => {
        const state = stepState(workflow, snapshot, step.id);
        const active = step.id === currentStep;
        return (
          <li key={step.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect(step.id)}
              disabled={state === 'locked'}
              aria-current={active ? 'step' : undefined}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-semibold transition disabled:opacity-50 ${
                state === 'done'
                  ? CELL_STYLE.approved.box
                  : state === 'to_fix'
                    ? CELL_STYLE.to_fix.box
                    : active
                      ? 'bg-brand text-on-brand border-brand'
                      : 'bg-card border-line text-ink'
              }`}
            >
              {state === 'done' ? (
                <Check className="w-3 h-3 stroke-[3]" />
              ) : state === 'locked' ? (
                <Lock className="w-3 h-3" />
              ) : (
                <span className="tabular-nums">{index + 1}</span>
              )}
              {pickLocalized(language, step.label) || step.id}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The validation grid: parts × languages (common parts take the whole row). Each cell shows its
 * state and opens on a click: the detailed view of what was validated and what is left.
 */
export function ValidationGrid({
  kind,
  snapshot,
  workflow,
  selected,
  onSelect,
}: {
  kind: ReviewKind;
  snapshot: ReviewSnapshot;
  workflow: WorkflowDefinition;
  selected: string | null;
  onSelect: (cell: string) => void;
}) {
  const b = useBackofficeText();
  const languages = EDITING_ORDER;
  const parts = reviewParts(kind).filter((p) =>
    p.perLanguage ? languages.some((l) => snapshot.cells[`${p.id}:${l}`]) : snapshot.cells[p.id]
  );
  const cellButton = (id: string, wide = false) => {
    const review = snapshot.cells[id];
    if (!review) return <span key={id} className="rounded-lg border border-dashed border-line" />;
    const Icon = CELL_ICON[review.state];
    const required = workflow.requiredCells.includes(id);
    return (
      <button
        key={id}
        type="button"
        onClick={() => onSelect(id)}
        aria-pressed={selected === id}
        title={`${cellLabel(b, kind, id)} : ${CELL_STYLE[review.state].label(b)}`}
        className={`min-w-0 min-h-9 px-1.5 py-1 rounded-lg border text-[10px] font-bold inline-flex items-center justify-center gap-1 transition ${
          CELL_STYLE[review.state].box
        } ${selected === id ? 'ring-2 ring-brand ring-offset-1 ring-offset-surface' : ''} ${wide ? 'col-span-4' : ''}`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {wide ? (
          <span className="truncate">{CELL_STYLE[review.state].label(b)}</span>
        ) : (
          <span className="sr-only">{CELL_STYLE[review.state].label(b)}</span>
        )}
        {required && <span aria-hidden>*</span>}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-[minmax(4.5rem,auto)_repeat(4,minmax(0,1fr))] gap-1 items-stretch text-ink">
      <span className="text-[10px] font-bold text-ink-muted self-end">{b.reviewPart}</span>
      {languages.map((l) => (
        <span key={l} lang={languageInfo(l).htmlLang} className="text-[11px] font-bold text-center self-end truncate">
          {languageInfo(l).short}
        </span>
      ))}
      {parts.map((part) => (
        <div key={part.id} className="contents">
          <span className="text-[11px] font-semibold self-center leading-tight">{partLabel(b, part.id)}</span>
          {part.perLanguage ? languages.map((l) => cellButton(`${part.id}:${l}`)) : cellButton(part.id, true)}
        </div>
      ))}
    </div>
  );
}
