import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Check, Eye, Pencil, Play, RotateCcw, Send, Undo2, X } from 'lucide-react';
import { normalizeSteps, type Recipe } from '@/core/catalog';
import {
  batchApprovableCells,
  cellHash,
  composePublication,
  isStepOpen,
  itemStatus,
  parseCellId,
  stepOfCell,
  workflowCells,
} from '@/core/review';
import { useCatalog, useReview } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { patronPath, PATRON_PAGES } from '@/shared/paths';
import { RecipeDetailModal } from '@/features/recipes/components/RecipeDetailModal';
import { format, type BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { useNotify } from '../shell/NotifyContext';
import { useRecipeEditor } from '../shell/RecipeEditorContext';
import { RecipeCellContent } from './RecipeCellContent';
import { CELL_STYLE, SegmentedProgress, StatusBadge, StepTrail, ValidationGrid, cellLabel } from './reviewUi';

const RULE_LABEL: Record<string, (b: BackofficeTexts) => string> = {
  'recipe.name': (b) => b.ruleName,
  'recipe.description': (b) => b.ruleDescription,
  'recipe.photo': (b) => b.rulePhoto,
  'recipe.video': (b) => b.ruleVideo,
  'recipe.ingredients': (b) => b.ruleIngredients,
  'recipe.key-ingredient': (b) => b.ruleKeyIngredient,
  'recipe.known-ingredients': (b) => b.ruleKnownIngredients,
  'recipe.published-ingredients': (b) => b.rulePublishedIngredients,
  'recipe.times': (b) => b.ruleTimes,
  'recipe.steps': (b) => b.ruleSteps,
  'recipe.tip': (b) => b.ruleTip,
};

const BUTTON =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50';
const PRIMARY = `${BUTTON} bg-brand text-on-brand hover:bg-brand-strong`;
const SECONDARY = `${BUTTON} bg-card border border-line text-ink hover:border-brand`;

/**
 * /patron/recettes/:id — validation of one recipe, step by step and part by part: the step trail,
 * the progress bar, the part × language grid, and the selected cell with its checks, what changed
 * since the version online, and the decision. "Resume" opens the first cell not validated yet.
 */
export function RecipeReviewPage() {
  const { id = '' } = useParams();
  const b = useBackofficeText();
  const notify = useNotify();
  const { getRecipeName } = useLanguage();
  const { recipes, ingredients } = useCatalog();
  const { entries, workflow, store } = useReview('recipe');
  const { editRecipe } = useRecipeEditor();
  const entry = entries.find((e) => e.copy.id === id);
  const online = recipes.find((r) => r.id === id && r.is_published !== false) ?? null;
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  useCloseOnBack(preview, () => setPreview(false));

  const back = (
    <Link
      to={patronPath(PATRON_PAGES.recipes)}
      className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink"
    >
      <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
      {b.reviewBack}
    </Link>
  );

  if (!entry) {
    // Online but not in the workspace yet: opening it starts from the version online, validated
    return (
      <div className="space-y-3">
        {back}
        {online ? (
          <div className="p-4 rounded-2xl bg-card border border-line space-y-3">
            <p className="text-sm font-bold">{getRecipeName(online)}</p>
            <button
              type="button"
              className={PRIMARY}
              onClick={async () => {
                const result = await store.save(online);
                if (!result.ok) notify(result.error, true);
              }}
            >
              <Play className="w-3.5 h-3.5" /> {b.reviewTitle}
            </button>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">{b.reviewNotFound}</p>
        )}
      </div>
    );
  }

  const { copy, snapshot } = entry;
  const recipe = copy.content;
  const cells = workflowCells(workflow).filter((c) => snapshot.cells[c]);
  const selected = picked && snapshot.cells[picked] ? picked : (snapshot.nextCell ?? cells[0] ?? null);
  const status = itemStatus(snapshot, entry.online, entry.pending);
  const ready = workflow.batchApproval ? batchApprovableCells(snapshot) : [];
  const nextAfter = (cell: string) => {
    const from = cells.indexOf(cell);
    return (
      [...cells.slice(from + 1), ...cells.slice(0, from)].find((c) => snapshot.cells[c].state !== 'approved') ?? null
    );
  };

  const run = async (action: () => Promise<{ ok: boolean; error?: string; local?: boolean }>, success: string) => {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result.ok) notify(success);
    else notify(result.error ?? '', true);
    return result.ok || !!result.local;
  };

  const decide = async (cell: string, verdict: 'approved' | 'rejected', text?: string) => {
    const done = await run(
      () => store.decide(id, [cell], verdict, text),
      verdict === 'approved' ? b.reviewApproved : b.reviewSentBack
    );
    if (done) {
      setNote(null);
      if (verdict === 'approved') setPicked(nextAfter(cell));
    }
  };

  const approveReady = async () => {
    const list = ready.map((c) => `• ${cellLabel(b, 'recipe', c)}`).join('\n');
    if (!window.confirm(`${format(b.reviewApproveReady, { count: ready.length })} ?\n\n${list}`)) return;
    await run(() => store.decide(id, ready, 'approved'), b.reviewApproved);
  };

  const publish = async () => {
    if (!window.confirm(`${b.reviewPublish} « ${getRecipeName(recipe)} » ?\n\n${b.reviewPublishHint}`)) return;
    await run(() => store.publish(id), b.reviewPublished);
  };

  const cell = selected ? parseCellId('recipe', selected) : null;
  const review = selected ? snapshot.cells[selected] : null;
  const decision = selected ? copy.decisions[selected] : undefined;
  const step = selected ? stepOfCell(workflow, selected) : undefined;
  const locked = step ? !isStepOpen(workflow, snapshot, step.id) : false;
  // What is online for this cell differs from the work copy: show both
  const differs = !!(cell && online && review && cellHash('recipe', online, cell) !== review.hash);
  const previewRecipe: Recipe = composePublication('recipe', recipe, online, snapshot, workflow) ?? {
    ...recipe,
    steps: normalizeSteps(recipe.steps),
  };

  return (
    <div className="space-y-4">
      {back}

      <div className="p-4 rounded-2xl bg-card border border-line space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold truncate">{getRecipeName(recipe)}</h2>
            <div className="mt-1">
              <StatusBadge status={status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={SECONDARY} onClick={() => editRecipe(recipe)}>
              <Pencil className="w-3.5 h-3.5" /> {b.reviewEdit}
            </button>
            <button type="button" className={SECONDARY} onClick={() => setPreview(true)}>
              <Eye className="w-3.5 h-3.5" /> {b.reviewPreview}
            </button>
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
        <SegmentedProgress kind="recipe" snapshot={snapshot} workflow={workflow} />
        <StepTrail
          workflow={workflow}
          snapshot={snapshot}
          currentStep={step?.id ?? snapshot.currentStep}
          onSelect={(stepId) => {
            const s = workflow.steps.find((x) => x.id === stepId)!;
            setPicked(s.cells.find((c) => snapshot.cells[c]?.state !== 'approved') ?? s.cells[0] ?? null);
            setNote(null);
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
            kind="recipe"
            snapshot={snapshot}
            workflow={workflow}
            selected={selected}
            onSelect={(c) => {
              setPicked(c);
              setNote(null);
            }}
          />
        </div>

        {selected && cell && review ? (
          <section className="p-4 rounded-2xl bg-card border border-line space-y-3" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold">{cellLabel(b, 'recipe', selected)}</h3>
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
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                  {b.reviewWorkVersion}
                </p>
                <RecipeCellContent recipe={recipe} part={cell.part} language={cell.language} />
              </div>
              {differs && online && (
                <div className="min-w-0 p-3 rounded-xl border border-dashed border-line">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                    {b.reviewOnlineVersion}
                  </p>
                  <RecipeCellContent recipe={online} part={cell.part} language={cell.language} />
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
                      <span>{RULE_LABEL[c.rule]?.(b) ?? c.rule}</span>
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
                  <button
                    type="button"
                    className={PRIMARY}
                    disabled={busy || locked || review.state === 'approved' || review.state === 'incomplete'}
                    onClick={() => decide(selected, 'approved')}
                  >
                    <Check className="w-3.5 h-3.5" /> {b.reviewApprove}
                  </button>
                  <button type="button" className={SECONDARY} disabled={busy || locked} onClick={() => setNote('')}>
                    <RotateCcw className="w-3.5 h-3.5" /> {b.reviewReject}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={PRIMARY}
                    disabled={busy || !note.trim()}
                    onClick={() => decide(selected, 'rejected', note)}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {b.reviewSendBack}
                  </button>
                  <button type="button" className={SECONDARY} onClick={() => setNote(null)}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              {nextAfter(selected) && (
                <button type="button" className={SECONDARY} onClick={() => setPicked(nextAfter(selected))}>
                  {b.reviewNext}
                </button>
              )}
            </div>
          </section>
        ) : (
          <p className="text-sm text-ink-muted">{b.reviewSelectCell}</p>
        )}
      </div>

      {preview && (
        <RecipeDetailModal
          recipe={previewRecipe}
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
