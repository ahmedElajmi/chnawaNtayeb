import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Check, Eye, History, Pencil, Play, Send, Undo2 } from 'lucide-react';
import { normalizeSteps, type Recipe } from '@/core/catalog';
import {
  batchApprovableCells,
  composePublication,
  itemStatus,
  workflowCells,
  type ContentCompleteness,
  type PublishedVersion,
  type ReviewKind,
} from '@/core/review';
import { useCatalog, useReview } from '@/app/ContainerContext';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { patronPath } from '@/shared/paths';
import { RecipeDetailModal } from '@/features/recipes/components/RecipeDetailModal';
import { format } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { useNotify } from '../shell/NotifyContext';
import { CellReviewPanel, PRIMARY, SECONDARY } from './CellReviewPanel';
import { useIngredientView, useRecipeView, type KindView } from './kindViews';
import {
  CompletenessMeter,
  SegmentedProgress,
  StatusBadge,
  StepTrail,
  ValidationGrid,
  cellLabel,
  ruleLabel,
} from './reviewUi';

/** /patron/recettes/:id */
export function RecipeReviewRoute() {
  return <ReviewPage view={useRecipeView()} />;
}

/** /patron/ingredients/:id */
export function IngredientReviewRoute() {
  return <ReviewPage view={useIngredientView()} />;
}

/**
 * Validation of one item, step by step and part by part: the step trail, the progress bar, the
 * part × language grid, and the selected cell (CellReviewPanel). "Resume" opens the first cell not
 * validated yet; the page has its own address, so the review can stop and go on later.
 */
function ReviewPage<K extends ReviewKind>({ view }: { view: KindView<K> }) {
  const { id = '' } = useParams();
  const b = useBackofficeText();
  const notify = useNotify();
  const { ingredients } = useCatalog();
  const { entries, workflow, store } = useReview(view.kind);
  const entry = entries.find((e) => e.copy.id === id);
  const online = view.online(id);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [versions, setVersions] = useState<PublishedVersion<K>[] | null>(null);
  useCloseOnBack(preview, () => setPreview(false));

  const back = (
    <Link
      to={patronPath(view.listPage)}
      className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
      {b.reviewBack}
    </Link>
  );

  const run = async (action: () => Promise<{ ok: boolean; error?: string; local?: boolean }>, success: string) => {
    setBusy(true);
    const result = await action();
    setBusy(false);
    notify(result.ok ? success : (result.error ?? ''), !result.ok);
    return result.ok || !!result.local;
  };

  if (!entry) {
    // Online but not in the workspace yet: opening it starts from the version online, validated
    return (
      <div className="space-y-3">
        {back}
        {online ? (
          <div className="p-4 rounded-2xl bg-card border border-line space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold">{view.name(online)}</p>
              <StatusBadge status="online" />
            </div>
            <p className="text-xs text-ink-muted">{b.reviewOnlineNoCopy}</p>
            <CompletenessMeter kind={view.kind} result={store.completeness(online)} />
            <button type="button" className={SECONDARY} onClick={() => view.edit(online)}>
              <Pencil className="w-3.5 h-3.5" /> {b.reviewEdit}
            </button>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">{b.reviewNotFound}</p>
        )}
      </div>
    );
  }

  const { copy, snapshot } = entry;
  const item = copy.content;
  const cells = workflowCells(workflow).filter((c) => snapshot.cells[c]);
  const selected = picked && snapshot.cells[picked] ? picked : (snapshot.nextCell ?? cells[0] ?? null);
  const status = itemStatus(snapshot, entry.online, entry.pending);
  const completeness = store.completeness(item);
  const ready = workflow.batchApproval ? batchApprovableCells(snapshot) : [];
  const nextAfter = (cell: string) => {
    const from = cells.indexOf(cell);
    return (
      [...cells.slice(from + 1), ...cells.slice(0, from)].find((c) => snapshot.cells[c].state !== 'approved') ?? null
    );
  };

  const approveReady = async () => {
    const list = ready.map((c) => `• ${cellLabel(b, view.kind, c)}`).join('\n');
    if (!window.confirm(`${format(b.reviewApproveReady, { count: ready.length })} ?\n\n${list}`)) return;
    await run(() => store.decide(id, ready, 'approved'), b.reviewApproved);
  };

  const publish = async () => {
    if (!window.confirm(`${b.reviewPublish} « ${view.name(item)} » ?\n\n${b.reviewPublishHint}`)) return;
    await run(() => store.publish(id), b.reviewPublished);
  };

  const previewRecipe = view.hasPreview
    ? ((composePublication(view.kind, item, online, snapshot, workflow) ?? item) as unknown as Recipe)
    : null;

  return (
    <div className="space-y-4">
      {back}

      <div className="p-4 rounded-2xl bg-card border border-line space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold truncate">{view.name(item)}</h2>
            <div className="mt-1">
              <StatusBadge status={status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={SECONDARY} onClick={() => view.edit(item)}>
              <Pencil className="w-3.5 h-3.5" /> {b.reviewEdit}
            </button>
            {view.hasPreview && (
              <button type="button" className={SECONDARY} onClick={() => setPreview(true)}>
                <Eye className="w-3.5 h-3.5" /> {b.reviewPreview}
              </button>
            )}
            {entry.online && (
              <button
                type="button"
                className={SECONDARY}
                disabled={busy}
                onClick={() => run(() => store.unpublish(id), b.reviewUnpublished)}
              >
                <Undo2 className="w-3.5 h-3.5" /> {b.reviewUnpublish}
              </button>
            )}
            {snapshot.publishable && (entry.pending || !entry.online) && (
              <button type="button" className={PRIMARY} disabled={busy} onClick={publish}>
                <Send className="w-3.5 h-3.5" /> {b.reviewPublish}
              </button>
            )}
          </div>
        </div>
        <SegmentedProgress kind={view.kind} snapshot={snapshot} workflow={workflow} />
        <CompletenessDetails kind={view.kind} result={completeness} onSelect={setPicked} cells={snapshot.cells} />
        <StepTrail
          workflow={workflow}
          snapshot={snapshot}
          currentStep={(selected && workflow.steps.find((s) => s.cells.includes(selected))?.id) ?? snapshot.currentStep}
          onSelect={(stepId) => {
            const s = workflow.steps.find((x) => x.id === stepId)!;
            setPicked(
              s.cells.find((c) => snapshot.cells[c] && snapshot.cells[c].state !== 'approved') ?? s.cells[0] ?? null
            );
          }}
        />
        <div className="flex flex-wrap gap-2">
          {snapshot.nextCell && snapshot.nextCell !== selected && (
            <button type="button" className={SECONDARY} onClick={() => setPicked(snapshot.nextCell)}>
              <Play className="w-3.5 h-3.5 rtl:rotate-180" /> {b.reviewResume}
            </button>
          )}
          {ready.length > 1 && (
            <button type="button" className={SECONDARY} disabled={busy} onClick={approveReady}>
              <Check className="w-3.5 h-3.5" /> {format(b.reviewApproveReady, { count: ready.length })}
            </button>
          )}
          {!snapshot.nextCell && (
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{b.reviewAllDone}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-start">
        <div className="p-3 sm:p-4 rounded-2xl bg-card border border-line">
          <ValidationGrid
            kind={view.kind}
            snapshot={snapshot}
            workflow={workflow}
            selected={selected}
            onSelect={setPicked}
          />
        </div>
        {selected ? (
          <CellReviewPanel
            view={view}
            store={store}
            entry={entry}
            workflow={workflow}
            cellId={selected}
            onDecided={(verdict) => verdict === 'approved' && setPicked(nextAfter(selected))}
            onNext={nextAfter(selected) ? () => setPicked(nextAfter(selected)) : undefined}
          />
        ) : (
          <p className="text-sm text-ink-muted">{b.reviewSelectCell}</p>
        )}
      </div>

      {/* History: what happened to the item, and the versions published (one can be brought back) */}
      <details
        className="p-4 rounded-2xl bg-card border border-line"
        onToggle={(e) => {
          if ((e.target as HTMLDetailsElement).open && !versions) void store.versions(id).then(setVersions);
        }}
      >
        <summary className="text-sm font-bold cursor-pointer inline-flex items-center gap-1.5">
          <History className="w-4 h-4" /> {b.reviewHistory}
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <ul className="space-y-1 text-xs">
            {copy.history.map((event, index) => (
              <li key={index} className="flex flex-wrap gap-x-1.5">
                <span className="text-ink-muted tabular-nums">{new Date(event.at).toLocaleString()}</span>
                <span className="font-semibold">{b[`event_${event.action}` as const]}</span>
                {event.cells && <span>· {event.cells.map((c) => cellLabel(b, view.kind, c)).join(', ')}</span>}
                {event.note && <span className="text-ink-muted">· {event.note}</span>}
              </li>
            ))}
          </ul>
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-ink-muted">{b.reviewVersions}</p>
            {versions === null ? (
              <p className="text-xs text-ink-muted">…</p>
            ) : versions.length === 0 ? (
              <p className="text-xs text-ink-muted">{b.reviewNoVersions}</p>
            ) : (
              versions.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>
                    {new Date(v.published_at).toLocaleString()}
                    {v.note && <span className="text-ink-muted"> · {v.note}</span>}
                  </span>
                  <button
                    type="button"
                    className={SECONDARY}
                    disabled={busy}
                    onClick={async () => {
                      if (!window.confirm(b.reviewRestoreConfirm)) return;
                      if (await run(() => store.restore(v), b.reviewPublished)) setVersions(null);
                    }}
                  >
                    {b.reviewRestore}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </details>

      {preview && previewRecipe && (
        <RecipeDetailModal
          recipe={{ ...previewRecipe, steps: normalizeSteps(previewRecipe.steps) }}
          isOpen
          onClose={() => setPreview(false)}
          isFavorite={false}
          onToggleFavorite={() => {}}
          allIngredients={ingredients}
          selectedFridgeIds={[]}
          pantryIds={[]}
          onAddMissingToGrocery={() => {}}
        />
      )}
    </div>
  );
}

/**
 * Completeness of the data, apart from the validation: what can still be filled in (optional
 * languages, video, tip…). Each missing piece opens its cell when the workflow has it.
 */
function CompletenessDetails({
  kind,
  result,
  cells,
  onSelect,
}: {
  kind: ReviewKind;
  result: ContentCompleteness;
  cells: Record<string, unknown>;
  onSelect: (cell: string) => void;
}) {
  const b = useBackofficeText();
  if (result.missing.length === 0) return <CompletenessMeter kind={kind} result={result} />;
  return (
    <details className="text-xs">
      <summary className="cursor-pointer inline-flex items-center gap-2" title={b.completenessHint}>
        <CompletenessMeter kind={kind} result={result} />
      </summary>
      <p className="mt-2 text-[11px] text-ink-muted">{b.completenessHint}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {result.missing.map((m) => (
          <li key={`${m.cell}|${m.rule}`}>
            <button
              type="button"
              disabled={!cells[m.cell]}
              onClick={() => onSelect(m.cell)}
              className="px-2 py-1 rounded-lg border border-dashed border-line text-[11px] hover:border-brand disabled:cursor-default"
            >
              {cellLabel(b, kind, m.cell)} · {ruleLabel(b, m.rule)}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
