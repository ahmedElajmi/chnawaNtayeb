import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, UserPlus } from 'lucide-react';
import {
  ADMIN_ROLE_ID,
  ALWAYS_REQUIRED_CELL,
  PERMISSIONS,
  REVIEW_KINDS,
  RULE_LEVELS,
  reviewCells,
  reviewRules,
  validateReviewSettings,
  type Permission,
  type ReviewKind,
  type ReviewSettings,
  type RoleDefinition,
  type RuleLevel,
  type StepLabel,
  type WorkflowDefinition,
  type WorkflowStep,
} from '@/core/review';
import { EDITING_ORDER, languageInfo, pickLocalized, slugify, type Language } from '@/core/shared';
import { useReview, useReviewSettings, useTeam } from '@/app/ContainerContext';
import { useContainer } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { format, type BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { useNotify } from '../shell/NotifyContext';
import { PRIMARY, SECONDARY } from '../review/CellReviewPanel';
import { cellLabel, partLabel, ruleLabel } from '../review/reviewUi';

const INPUT = 'w-full px-2.5 py-1.5 rounded-lg bg-surface border border-line text-xs text-ink';
const CARD = 'p-4 rounded-2xl bg-card border border-line space-y-3';
const LABEL_LANGUAGES: Language[] = ['fr', 'derja', 'ar'];

interface SettingsDraft {
  draft: ReviewSettings;
  setDraft: (next: ReviewSettings) => void;
  published: ReviewSettings;
  isDirty: boolean;
  errors: string[];
}

const DraftContext = createContext<SettingsDraft | null>(null);

/**
 * Draft of the review settings (workflows + roles), shared by the workflow sub-pages: moving between
 * steps and roles keeps it; it is checked by the domain (validateReviewSettings) before saving.
 */
export function ReviewSettingsDraftProvider({ children }: { children: ReactNode }) {
  const { settings } = useReviewSettings();
  const [draft, setDraft] = useState(settings);
  const [base, setBase] = useState(settings);
  if (base !== settings) {
    setBase(settings);
    setDraft(settings);
  }
  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings), [draft, settings]);
  const errors = useMemo(() => validateReviewSettings(draft), [draft]);
  return (
    <DraftContext.Provider value={{ draft, setDraft, published: settings, isDirty, errors }}>
      {children}
    </DraftContext.Provider>
  );
}

function useSettingsDraft(): SettingsDraft {
  const value = useContext(DraftContext);
  if (!value) throw new Error('useSettingsDraft must be used inside ReviewSettingsDraftProvider');
  return value;
}

/** Version in use, unsaved changes with their note and problems, history of the saved versions. */
export function WorkflowSaveBar() {
  const b = useBackofficeText();
  const notify = useNotify();
  const { version, updatedAt, warnings, reviewSettings } = useReviewSettings();
  const { team } = useTeam();
  const { draft, setDraft, published, isDirty, errors } = useSettingsDraft();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [versions, setVersions] = useState<Awaited<ReturnType<typeof reviewSettings.listVersions>> | null>(null);

  const save = async (settings: ReviewSettings, message: string) => {
    setBusy(true);
    const result = await reviewSettings.publish(settings, message);
    // Members' rights follow their role (the database rules read them on the member record)
    if (result.ok) await team.refreshRights(settings.roles);
    setBusy(false);
    notify(result.ok ? b.workflowsSaved : result.error, !result.ok);
    if (result.ok) {
      setNote('');
      setVersions(null);
    }
  };

  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-card border border-line space-y-3">
      <p className="text-xs text-ink-muted">
        {version ? format(b.workflowsVersion, { version }) : b.workflowsDefault}
        {updatedAt && ` · ${new Date(updatedAt).toLocaleString()}`}
      </p>
      {warnings.length > 0 && (
        <ul className="text-[11px] text-amber-800 dark:text-amber-200 list-disc ps-4">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      {isDirty ? (
        <div className="space-y-2 pt-3 border-t border-line">
          {errors.length > 0 && (
            <ul role="alert" className="text-[11px] text-rose-700 dark:text-rose-300 list-disc ps-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-accent-text">{b.engineDraft}</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder={b.workflowsNote}
              className={`${INPUT} flex-1 min-w-0 basis-48`}
            />
            <button type="button" className={SECONDARY} onClick={() => setDraft(published)}>
              {b.engineCancel}
            </button>
            <button
              type="button"
              className={PRIMARY}
              disabled={busy || errors.length > 0}
              onClick={() => save(draft, note)}
            >
              {b.workflowsSave}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-muted pt-3 border-t border-line">{b.workflowsIdle}</p>
      )}
      <details
        onToggle={(e) => {
          if ((e.target as HTMLDetailsElement).open && !versions) void reviewSettings.listVersions().then(setVersions);
        }}
      >
        <summary className="text-xs font-bold cursor-pointer">{b.reviewHistory}</summary>
        <ul className="mt-2 space-y-1.5">
          {(versions ?? []).map((v) => (
            <li key={v.version} className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>
                v{v.version} · {new Date(v.updatedAt).toLocaleString()}
                {v.note && <span className="text-ink-muted"> · {v.note}</span>}
              </span>
              <button type="button" className={SECONDARY} onClick={() => setDraft(v.resolved)}>
                {b.workflowsOpenVersion}
              </button>
            </li>
          ))}
          {versions?.length === 0 && <li className="text-xs text-ink-muted">{b.reviewNoVersions}</li>}
        </ul>
      </details>
    </div>
  );
}

/** Labels of a step or a role in the main languages (the variants fall back, see LANGUAGES). */
function LabelInputs({ value, onChange }: { value: StepLabel; onChange: (label: StepLabel) => void }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-3">
      {LABEL_LANGUAGES.map((lang) => {
        const info = languageInfo(lang);
        return (
          <input
            key={lang}
            value={value[lang] ?? ''}
            onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            placeholder={info.short}
            aria-label={info.description}
            lang={info.htmlLang}
            dir={info.dir}
            maxLength={80}
            className={INPUT}
          />
        );
      })}
    </div>
  );
}

const KIND_LABEL: Record<ReviewKind, (b: BackofficeTexts) => string> = {
  recipe: (b) => b.recipes,
  ingredient: (b) => b.ingredients,
};

const LEVEL_LABEL: Record<RuleLevel, (b: BackofficeTexts) => string> = {
  blocking: (b) => b.reviewBlocking,
  advice: (b) => b.reviewAdvice,
  off: (b) => b.workflowsRuleOff,
};

/** /patron/workflows/etapes — steps, cells, required parts, checks and options of each workflow. */
export function WorkflowStepsPage() {
  const b = useBackofficeText();
  const { language } = useLanguage();
  const { draft, setDraft } = useSettingsDraft();
  const [kind, setKind] = useState<ReviewKind>('recipe');
  const recipes = useReview('recipe');
  const ingredients = useReview('ingredient');
  const workflow = draft.workflows[kind];
  const impact = useMemo(
    () => (kind === 'recipe' ? recipes.store : ingredients.store).impactOf(workflow),
    // The impact changes with the workflow and the items
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [workflow, kind, recipes.entries, ingredients.entries]
  );
  const reviewers = draft.roles.filter((r) => r.id !== ADMIN_ROLE_ID && r.permissions.includes('review'));

  const update = (patch: Partial<WorkflowDefinition>) =>
    setDraft({ ...draft, workflows: { ...draft.workflows, [kind]: { ...workflow, ...patch } } });
  const setSteps = (steps: WorkflowStep[]) => update({ steps });
  const setStep = (index: number, patch: Partial<WorkflowStep>) =>
    setSteps(workflow.steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const move = (index: number, by: number) => {
    const steps = [...workflow.steps];
    const [step] = steps.splice(index, 1);
    steps.splice(index + by, 0, step);
    setSteps(steps);
  };
  const order = reviewCells(kind).map((c) => c.id);
  /** Puts a cell in a step (or in none), keeping the grid order inside each step. */
  const assign = (cell: string, stepId: string) =>
    setSteps(
      workflow.steps.map((s) => {
        const cells = s.cells.filter((c) => c !== cell);
        if (s.id === stepId) cells.push(cell);
        return { ...s, cells: cells.sort((x, y) => order.indexOf(x) - order.indexOf(y)) };
      })
    );
  const toggleRequired = (cell: string) =>
    update({
      requiredCells: workflow.requiredCells.includes(cell)
        ? workflow.requiredCells.filter((c) => c !== cell)
        : [...workflow.requiredCells, cell],
    });
  const addStep = () => {
    let n = workflow.steps.length + 1;
    while (workflow.steps.some((s) => s.id === `step-${n}`)) n++;
    setSteps([...workflow.steps, { id: `step-${n}`, label: { fr: `${b.workflowsNewStep} ${n}` }, cells: [] }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit" role="tablist">
        {REVIEW_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              kind === k ? 'bg-card text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {KIND_LABEL[k](b)}
          </button>
        ))}
      </div>

      <p
        className={`text-xs p-3 rounded-xl border ${
          impact.length
            ? 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
            : 'border-line bg-card text-ink-muted'
        }`}
      >
        {impact.length ? format(b.workflowsImpact, { count: impact.length }) : b.workflowsNoImpact}
      </p>

      <section className={CARD}>
        <h3 className="text-sm font-extrabold">{b.workflowsOptions}</h3>
        {(
          [
            ['sequential', b.workflowsSequential],
            ['batchApproval', b.workflowsBatch],
            ['partialLanguages', b.workflowsPartial],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-start gap-2 text-xs">
            <input type="checkbox" checked={workflow[key]} onChange={(e) => update({ [key]: e.target.checked })} />
            <span>{label}</span>
          </label>
        ))}
      </section>

      <section className={CARD}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold">{b.workflowsSteps}</h3>
          <button type="button" className={SECONDARY} onClick={addStep}>
            <Plus className="w-3.5 h-3.5" /> {b.workflowsAddStep}
          </button>
        </div>
        <ol className="space-y-3">
          {workflow.steps.map((step, index) => (
            <li key={step.id} className="p-3 rounded-xl border border-line bg-surface space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">
                  {index + 1}. {pickLocalized(language, step.label) || step.id}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-card disabled:opacity-30"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={b.workflowsMoveUp}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-card disabled:opacity-30"
                    disabled={index === workflow.steps.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={b.workflowsMoveDown}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30"
                    disabled={step.cells.some((c) => workflow.requiredCells.includes(c))}
                    title={b.workflowsDeleteStepHint}
                    onClick={() => setSteps(workflow.steps.filter((_, i) => i !== index))}
                    aria-label={b.workflowsDeleteStep}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <LabelInputs value={step.label} onChange={(label) => setStep(index, { label })} />
              <p className="text-[11px] text-ink-muted">
                {step.cells.length ? step.cells.map((c) => cellLabel(b, kind, c)).join(' · ') : b.workflowsNoCell}
              </p>
              {reviewers.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  <span className="text-ink-muted">{b.workflowsReviewers}</span>
                  {reviewers.map((role) => {
                    const on = step.reviewers?.includes(role.id) ?? false;
                    return (
                      <label key={role.id} className="inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => {
                            const next = on
                              ? (step.reviewers ?? []).filter((r) => r !== role.id)
                              : [...(step.reviewers ?? []), role.id];
                            const { reviewers: _old, ...rest } = step;
                            setSteps(
                              workflow.steps.map((s, i) =>
                                i === index ? (next.length ? { ...rest, reviewers: next } : rest) : s
                              )
                            );
                          }}
                        />
                        {pickLocalized(language, role.label) || role.id}
                      </label>
                    );
                  })}
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className={CARD}>
        <h3 className="text-sm font-extrabold">{b.workflowsCells}</h3>
        <p className="text-[11px] text-ink-muted">{b.workflowsCellsHint}</p>
        <div className="divide-y divide-line">
          {reviewCells(kind).map((cell) => {
            const stepId = workflow.steps.find((s) => s.cells.includes(cell.id))?.id ?? '';
            const required = workflow.requiredCells.includes(cell.id);
            return (
              <div key={cell.id} className="py-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="flex-1 min-w-40 font-semibold">{cellLabel(b, kind, cell.id)}</span>
                <select
                  value={stepId}
                  onChange={(e) => assign(cell.id, e.target.value)}
                  aria-label={`${b.workflowsStepOf} ${cellLabel(b, kind, cell.id)}`}
                  className={`${INPUT} w-auto max-w-48`}
                >
                  <option value="">{b.workflowsNotReviewed}</option>
                  {workflow.steps.map((s, i) => (
                    <option key={s.id} value={s.id}>
                      {i + 1}. {pickLocalized(language, s.label) || s.id}
                    </option>
                  ))}
                </select>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={required}
                    disabled={cell.id === ALWAYS_REQUIRED_CELL}
                    onChange={() => toggleRequired(cell.id)}
                  />
                  {b.workflowsRequired}
                </label>
              </div>
            );
          })}
        </div>
      </section>

      <section className={CARD}>
        <h3 className="text-sm font-extrabold">{b.reviewChecks}</h3>
        <div className="divide-y divide-line">
          {reviewRules(kind).map((rule) => (
            <div key={rule.id} className="py-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="flex-1 min-w-40">
                {ruleLabel(b, rule.id)} <span className="text-ink-muted">· {partLabel(b, rule.part, kind)}</span>
              </span>
              <select
                value={workflow.ruleLevels[rule.id] ?? rule.level}
                onChange={(e) => {
                  const level = e.target.value as RuleLevel;
                  const { [rule.id]: _old, ...others } = workflow.ruleLevels;
                  update({ ruleLevels: level === rule.level ? others : { ...others, [rule.id]: level } });
                }}
                aria-label={ruleLabel(b, rule.id)}
                className={`${INPUT} w-auto`}
              >
                {RULE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {LEVEL_LABEL[level](b)}
                    {level === rule.level ? ` (${b.workflowsDefaultLevel})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const PERMISSION_LABEL: Record<Permission, (b: BackofficeTexts) => string> = {
  edit: (b) => b.permEdit,
  submit: (b) => b.permSubmit,
  review: (b) => b.permReview,
  publish: (b) => b.permPublish,
  manage_workflows: (b) => b.permManageWorkflows,
  manage_roles: (b) => b.permManageRoles,
};

/** /patron/workflows/roles — what each role may do (the admin keeps every right). */
export function RolesEditorPage() {
  const b = useBackofficeText();
  const { language } = useLanguage();
  const { draft, setDraft } = useSettingsDraft();
  const { members } = useTeam();
  const [name, setName] = useState('');
  const setRole = (id: string, patch: Partial<RoleDefinition>) =>
    setDraft({ ...draft, roles: draft.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const addRole = () => {
    const base = slugify(name) || 'role';
    let id = base;
    for (let k = 2; draft.roles.some((r) => r.id === id); k++) id = `${base}-${k}`;
    setDraft({ ...draft, roles: [...draft.roles, { id, label: { fr: name.trim() }, permissions: ['edit'] }] });
    setName('');
  };

  return (
    <div className="space-y-3">
      {draft.roles.map((role) => {
        const admin = role.id === ADMIN_ROLE_ID;
        const used = members.filter((m) => m.role === role.id).length;
        return (
          <section key={role.id} className={CARD}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold">
                {pickLocalized(language, role.label) || role.id}
                <span className="ms-2 text-[11px] font-normal text-ink-muted">
                  {format(b.rolesMembers, { count: used })}
                </span>
              </h3>
              {!admin && (
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30"
                  disabled={used > 0}
                  title={used > 0 ? b.rolesInUse : b.rolesDelete}
                  aria-label={b.rolesDelete}
                  onClick={() => setDraft({ ...draft, roles: draft.roles.filter((r) => r.id !== role.id) })}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {admin ? (
              <p className="text-xs text-ink-muted">{b.rolesAdminHint}</p>
            ) : (
              <>
                <LabelInputs value={role.label} onChange={(label) => setRole(role.id, { label })} />
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                  {PERMISSIONS.map((p) => (
                    <label key={p} className="inline-flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={role.permissions.includes(p)}
                        onChange={(e) =>
                          setRole(role.id, {
                            permissions: e.target.checked
                              ? PERMISSIONS.filter((x) => x === p || role.permissions.includes(x))
                              : role.permissions.filter((x) => x !== p),
                          })
                        }
                      />
                      {PERMISSION_LABEL[p](b)}
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                  <span className="text-ink-muted">{b.rolesLanguages}</span>
                  {EDITING_ORDER.map((lang) => {
                    const on = role.languages?.includes(lang) ?? false;
                    return (
                      <label key={lang} className="inline-flex items-center gap-1.5" lang={languageInfo(lang).htmlLang}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => {
                            const next = on
                              ? (role.languages ?? []).filter((l) => l !== lang)
                              : EDITING_ORDER.filter((l) => l === lang || role.languages?.includes(l));
                            const { languages: _old, ...rest } = role;
                            setDraft({
                              ...draft,
                              roles: draft.roles.map((r) =>
                                r.id === role.id ? (next.length ? { ...rest, languages: next } : rest) : r
                              ),
                            });
                          }}
                        />
                        {languageInfo(lang).short}
                      </label>
                    );
                  })}
                </div>
                <p className="text-[11px] text-ink-muted">{b.rolesLanguagesHint}</p>
              </>
            )}
          </section>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={b.rolesNewName}
          maxLength={60}
          className={`${INPUT} flex-1 min-w-40`}
        />
        <button type="button" className={SECONDARY} disabled={!name.trim()} onClick={addRole}>
          <Plus className="w-3.5 h-3.5" /> {b.rolesAdd}
        </button>
      </div>
    </div>
  );
}

/** /patron/workflows/equipe — accounts of the team and their roles. */
export function TeamPage() {
  const b = useBackofficeText();
  const notify = useNotify();
  const { language } = useLanguage();
  const { members, team } = useTeam();
  const { settings } = useReviewSettings();
  const roles = settings.roles.filter((r) => r.id !== ADMIN_ROLE_ID);
  const { accountCreation } = useContainer();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState(roles[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  useEffect(() => team.start(), [team]);

  const report = (result: { ok: boolean; error?: string }, success: string) =>
    notify(result.ok ? success : (result.error ?? ''), !result.ok);

  // Employee without an account yet: the server creates it (temporary password, shown once)
  const createEmployee = async () => {
    setBusy(true);
    setTemporaryPassword(null);
    try {
      const created = await accountCreation.createEmployee({
        email: email.trim(),
        displayName: displayName.trim() || email.trim(),
      });
      if (!created.ok) {
        notify(format(b.teamCreateFailed, { reason: created.error }), true);
        return;
      }
      setTemporaryPassword(created.temporaryPassword);
      const added = await team.add(email.trim(), role, 'patron');
      report(added, b.teamAdded);
      if (added.ok) setEmail('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">{b.teamHint}</p>
      <form
        className={`${CARD} flex flex-wrap items-end gap-2 space-y-0`}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const result = await team.add(email, role, 'patron');
          setBusy(false);
          report(result, b.teamAdded);
          if (result.ok) setEmail('');
        }}
      >
        <label className="flex-1 min-w-48 text-[11px] font-semibold text-ink-muted">
          {b.teamEmail}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${INPUT} mt-1`}
            required
          />
        </label>
        <label className="flex-1 min-w-48 text-[11px] font-semibold text-ink-muted">
          {b.teamName}
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            className={`${INPUT} mt-1`}
          />
        </label>
        <label className="text-[11px] font-semibold text-ink-muted">
          {b.teamRole}
          <select value={role} onChange={(e) => setRole(e.target.value)} className={`${INPUT} mt-1`}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {pickLocalized(language, r.label) || r.id}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={PRIMARY} disabled={busy || !email.trim()}>
          <UserPlus className="w-3.5 h-3.5" /> {b.teamAdd}
        </button>
        <button type="button" onClick={createEmployee} className={SECONDARY} disabled={busy || !email.trim()}>
          <UserPlus className="w-3.5 h-3.5" /> {b.teamCreate}
        </button>
      </form>

      {temporaryPassword && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs space-y-1">
          <p className="font-bold text-emerald-800 dark:text-emerald-300">{b.teamCreatedTitle}</p>
          <p className="text-emerald-900 dark:text-emerald-200">{b.teamCreatedHint}</p>
          <p className="font-mono text-base font-bold text-emerald-900 dark:text-emerald-100" dir="ltr">
            {temporaryPassword}
          </p>
        </div>
      )}

      {members.length === 0 ? (
        <p className="text-xs text-ink-muted">{b.teamEmpty}</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl bg-card border border-line">
          {members.map((m) => (
            <li key={m.uid} className="p-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="flex-1 min-w-40 font-semibold break-all">{m.email || m.uid}</span>
              <select
                value={m.role}
                onChange={async (e) => report(await team.setRole(m.uid, e.target.value), b.teamUpdated)}
                aria-label={`${b.teamRole} : ${m.email}`}
                className={`${INPUT} w-auto`}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {pickLocalized(language, r.label) || r.id}
                  </option>
                ))}
                {!roles.some((r) => r.id === m.role) && <option value={m.role}>{m.role}</option>}
              </select>
              <button
                type="button"
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                aria-label={`${b.teamRemove} ${m.email}`}
                onClick={async () => {
                  if (!window.confirm(`${b.teamRemove} ${m.email} ?`)) return;
                  report(await team.remove(m.uid), b.teamRemoved);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
