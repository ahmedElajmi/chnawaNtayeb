import { LANGUAGE_CODES, REFERENCE_LANGUAGE, isLanguage, type Language } from '../shared';
import { cellId, parseCellId, reviewCells, type ReviewKind } from './parts';
import { reviewRules, RULE_LEVELS, type RuleLevel } from './rules';

/** Name shown for a step, in any of the languages (the others fall back, see pickLocalized). */
export type StepLabel = Partial<Record<Language, string>>;

export interface WorkflowStep {
  id: string;
  label: StepLabel;
  /** Cells reviewed in this step, in order */
  cells: string[];
  /** Roles allowed to review this step; absent = every role allowed to review */
  reviewers?: string[];
}

/**
 * How a kind of content is validated: stored in the database and edited from the backoffice.
 * The code gives the vocabulary (parts, languages, checks); a workflow arranges it.
 */
export interface WorkflowDefinition {
  kind: ReviewKind;
  steps: WorkflowStep[];
  /** Cells that must be validated before the item can be published */
  requiredCells: string[];
  /** Level of each check (the rule's own level when absent) */
  ruleLevels: Record<string, RuleLevel>;
  /** Each step opens once the required cells of the previous ones are validated */
  sequential: boolean;
  /** Several ready cells can be validated at once (with a confirmation) */
  batchApproval: boolean;
  /** A language that is not required can be published later, on its own */
  partialLanguages: boolean;
}

/** Cell always required: the French name (an item cannot be online without it). */
export const ALWAYS_REQUIRED_CELL = cellId('identity', REFERENCE_LANGUAGE);

const LANGUAGE_STEP_LABEL: Record<Language, StepLabel> = {
  fr: { fr: 'Français', derja: 'Français', ar: 'الفرنسية' },
  derja: { fr: 'Derja (lettres latines)', derja: 'Derja', ar: 'الدارجة بالحروف اللاتينية' },
  derja_ar: { fr: 'Derja (lettres arabes)', derja: 'Derja bel 3arbi', ar: 'الدارجة بالحروف العربية' },
  ar: { fr: 'Arabe littéraire', derja: '3arbi fos7a', ar: 'العربية الفصحى' },
};

/** One step per translation (every language except the reference), with that language's cells. */
function translationSteps(kind: ReviewKind): WorkflowStep[] {
  return LANGUAGE_CODES.filter((l) => l !== REFERENCE_LANGUAGE).map((language) => ({
    id: `lang-${language}`,
    label: LANGUAGE_STEP_LABEL[language],
    cells: reviewCells(kind)
      .filter((c) => c.language === language)
      .map((c) => c.id),
  }));
}

const fr = (part: string) => cellId(part, REFERENCE_LANGUAGE);

/** Workflows used until the admin saves their own. */
export function defaultWorkflow(kind: ReviewKind): WorkflowDefinition {
  if (kind === 'recipe') {
    return {
      kind,
      steps: [
        {
          id: 'identity',
          label: { fr: 'Nom et description', derja: 'Esm w wasf', ar: 'الاسم والوصف' },
          cells: [fr('identity')],
        },
        { id: 'media', label: { fr: 'Médias', derja: 'Tsawer w vidéo', ar: 'الصور والفيديو' }, cells: ['media'] },
        {
          id: 'details',
          label: { fr: 'Infos et ingrédients', derja: 'Ma3loumet w ingrédients', ar: 'المعلومات والمكوّنات' },
          cells: ['details'],
        },
        { id: 'steps', label: { fr: 'Étapes', derja: 'El marahel', ar: 'المراحل' }, cells: [fr('steps')] },
        {
          id: 'tip',
          label: { fr: 'Astuce du chef', derja: 'Nasi7a mta3 el chef', ar: 'نصيحة الطاهي' },
          cells: [fr('tip')],
        },
        ...translationSteps(kind),
      ],
      requiredCells: [fr('identity'), 'media', 'details', fr('steps')],
      ruleLevels: {},
      sequential: false,
      batchApproval: true,
      partialLanguages: true,
    };
  }
  return {
    kind,
    steps: [
      {
        id: 'identity',
        label: { fr: 'Nom et catégorie', derja: 'Esm w catégorie', ar: 'الاسم والصنف' },
        cells: [fr('identity'), 'details'],
      },
      { id: 'price', label: { fr: 'Prix', derja: 'Soum', ar: 'السعر' }, cells: ['price'] },
      { id: 'media', label: { fr: 'Photo', derja: 'Taswira', ar: 'الصورة' }, cells: ['media'] },
      ...translationSteps(kind),
    ],
    requiredCells: [fr('identity'), 'details', 'price'],
    ruleLevels: {},
    sequential: false,
    batchApproval: true,
    partialLanguages: true,
  };
}

export interface WorkflowResolution {
  workflow: WorkflowDefinition;
  /** What was ignored or repaired while reading (shown to the admin) */
  warnings: string[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const cleanText = (v: unknown, max = 80) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const ID = /^[a-z0-9][a-z0-9_-]{0,39}$/;

function readLabel(raw: unknown): StepLabel {
  const label: StepLabel = {};
  if (!isRecord(raw)) return label;
  for (const [lang, value] of Object.entries(raw)) {
    const t = cleanText(value);
    if (isLanguage(lang) && t) label[lang] = t;
  }
  return label;
}

/**
 * Workflow read from outside (database, import): what is unknown is dropped with a warning and
 * the rest falls back to the default workflow, so a damaged document never blocks the backoffice.
 * The French name is always required (added back if missing).
 */
export function resolveWorkflow(kind: ReviewKind, raw: unknown): WorkflowResolution {
  const fallback = defaultWorkflow(kind);
  const warnings: string[] = [];
  if (!isRecord(raw)) return { workflow: fallback, warnings };

  const known = (id: unknown): id is string => typeof id === 'string' && parseCellId(kind, id) !== null;
  const seen = new Set<string>();
  let steps: WorkflowStep[] = fallback.steps;
  if (Array.isArray(raw.steps)) {
    steps = [];
    for (const s of raw.steps) {
      if (!isRecord(s) || typeof s.id !== 'string' || !ID.test(s.id) || steps.some((x) => x.id === s.id)) {
        warnings.push('Étape illisible ignorée');
        continue;
      }
      const cells: string[] = [];
      for (const c of Array.isArray(s.cells) ? s.cells : []) {
        if (!known(c)) warnings.push(`Case inconnue ignorée : ${String(c)}`);
        else if (seen.has(c)) warnings.push(`Case en double ignorée : ${c}`);
        else {
          seen.add(c);
          cells.push(c);
        }
      }
      const reviewers = Array.isArray(s.reviewers)
        ? s.reviewers.filter((r): r is string => typeof r === 'string' && ID.test(r))
        : undefined;
      steps.push({
        id: s.id,
        label: readLabel(s.label),
        cells,
        ...(reviewers?.length ? { reviewers } : {}),
      });
    }
  }

  let requiredCells = fallback.requiredCells;
  if (Array.isArray(raw.requiredCells)) {
    requiredCells = [...new Set(raw.requiredCells.filter(known))];
    if (requiredCells.length !== raw.requiredCells.length) warnings.push('Cases obligatoires inconnues ignorées');
  }
  if (!requiredCells.includes(ALWAYS_REQUIRED_CELL)) {
    requiredCells = [ALWAYS_REQUIRED_CELL, ...requiredCells];
    warnings.push('Le nom en français reste toujours obligatoire');
  }

  const ruleIds = new Set(reviewRules(kind).map((r) => r.id));
  const ruleLevels: Record<string, RuleLevel> = {};
  if (isRecord(raw.ruleLevels)) {
    for (const [rule, level] of Object.entries(raw.ruleLevels)) {
      if (ruleIds.has(rule) && RULE_LEVELS.includes(level as RuleLevel)) ruleLevels[rule] = level as RuleLevel;
      else warnings.push(`Réglage de contrôle ignoré : ${rule}`);
    }
  }

  const flag = (key: 'sequential' | 'batchApproval' | 'partialLanguages') =>
    typeof raw[key] === 'boolean' ? (raw[key] as boolean) : fallback[key];

  return {
    workflow: {
      kind,
      steps,
      requiredCells,
      ruleLevels,
      sequential: flag('sequential'),
      batchApproval: flag('batchApproval'),
      partialLanguages: flag('partialLanguages'),
    },
    warnings,
  };
}

/** Problems that prevent saving a workflow edited by the admin (empty = can be saved). */
export function validateWorkflow(workflow: WorkflowDefinition): string[] {
  const errors: string[] = [];
  if (workflow.steps.length === 0) errors.push('Le workflow doit avoir au moins une étape.');
  const placed = new Map<string, string>();
  for (const step of workflow.steps) {
    if (step.cells.length === 0) errors.push(`L’étape « ${step.label.fr ?? step.id} » ne contient aucune case.`);
    if (!step.label.fr?.trim()) errors.push(`L’étape « ${step.id} » n’a pas de nom en français.`);
    for (const cell of step.cells) {
      if (!parseCellId(workflow.kind, cell)) errors.push(`Case inconnue : ${cell}.`);
      else if (placed.has(cell)) errors.push(`La case ${cell} est dans deux étapes.`);
      else placed.set(cell, step.id);
    }
  }
  if (!workflow.requiredCells.includes(ALWAYS_REQUIRED_CELL))
    errors.push('Le nom en français doit rester obligatoire.');
  for (const cell of workflow.requiredCells) {
    if (!placed.has(cell)) errors.push(`La case obligatoire ${cell} n’est dans aucune étape.`);
  }
  return errors;
}

/** Cells of the workflow, in step order (the cells left out of every step are not reviewed). */
export function workflowCells(workflow: WorkflowDefinition): string[] {
  return workflow.steps.flatMap((s) => s.cells);
}

/** Step that holds a cell. */
export function stepOfCell(workflow: WorkflowDefinition, cell: string): WorkflowStep | undefined {
  return workflow.steps.find((s) => s.cells.includes(cell));
}
