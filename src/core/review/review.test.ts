import { describe, expect, it } from 'vitest';
import { initialIngredients, initialRecipes, type Recipe } from '@/core/catalog';
import {
  ALWAYS_REQUIRED_CELL,
  ADMIN_ROLE_ID,
  DEFAULT_ROLES,
  batchApprovableCells,
  canPerform,
  canReviewCell,
  cellHash,
  cellHashes,
  cellState,
  composePublication,
  contentHash,
  decideCell,
  defaultWorkflow,
  groupQueue,
  isStepOpen,
  parseCellDecisions,
  parseCellId,
  queueCounts,
  resolveRoles,
  resolveWorkflow,
  reviewCells,
  reviewSnapshot,
  validateRoles,
  validateWorkflow,
  workflowImpact,
  type CellDecisions,
  type ReviewContext,
} from './index';

const ctx: ReviewContext = { ingredients: initialIngredients };
const recipe: Recipe = structuredClone(initialRecipes[0]);
const workflow = defaultWorkflow('recipe');

/** Decisions approving every cell of the workflow for this recipe. */
function approveAll(item: Recipe, wf = workflow): CellDecisions {
  let decisions: CellDecisions = {};
  for (const step of wf.steps) {
    for (const id of step.cells) {
      decisions = decideCell(decisions, id, {
        verdict: 'approved',
        hash: cellHash('recipe', item, parseCellId('recipe', id)!),
        by: 'admin',
        at: 1,
      });
    }
  }
  return decisions;
}

describe('content hash', () => {
  it('ignores key order and undefined values', () => {
    expect(contentHash({ a: 1, b: [1, { c: 'x' }] })).toBe(contentHash({ b: [1, { c: 'x' }], a: 1, d: undefined }));
    expect(contentHash({ a: 1 })).not.toBe(contentHash({ a: 2 }));
  });
});

describe('cells of the grid', () => {
  it('splits text parts by language and keeps the others common', () => {
    const ids = reviewCells('recipe').map((c) => c.id);
    expect(ids).toContain('identity:fr');
    expect(ids).toContain('steps:derja_ar');
    expect(ids).toContain('media');
    expect(ids).not.toContain('media:fr');
    expect(parseCellId('recipe', 'media:fr')).toBeNull();
    expect(parseCellId('recipe', 'steps:xx')).toBeNull();
    expect(parseCellId('ingredient', 'price')).toEqual({ id: 'price', part: 'price' });
  });

  it('changes only the cells of the language that was edited', () => {
    const before = cellHashes('recipe', recipe);
    const edited = structuredClone(recipe);
    edited.steps[0].instruction_derja = `${edited.steps[0].instruction_derja} (bdel)`;
    const after = cellHashes('recipe', edited);
    const changed = Object.keys(before).filter((k) => before[k] !== after[k]);
    expect(changed).toEqual(['steps:derja']);
  });

  it('keeps the other languages when a French text changes', () => {
    const before = cellHashes('recipe', recipe);
    const edited = { ...recipe, name_fr: `${recipe.name_fr} maison` };
    const after = cellHashes('recipe', edited);
    expect(Object.keys(before).filter((k) => before[k] !== after[k])).toEqual(['identity:fr']);
  });

  it('does not touch the other languages when an empty step is added', () => {
    const before = cellHashes('recipe', recipe);
    const edited: Recipe = {
      ...recipe,
      steps: [
        ...recipe.steps,
        {
          step_number: recipe.steps.length + 1,
          instruction_fr: 'Servir chaud.',
          instruction_derja: '',
          instruction_ar: '',
        },
      ],
    };
    const after = cellHashes('recipe', edited);
    expect(Object.keys(before).filter((k) => before[k] !== after[k])).toEqual(['steps:fr']);
  });
});

describe('cell states', () => {
  it('follows the decision and the fingerprint', () => {
    const approved = { verdict: 'approved' as const, hash: 'h1', by: 'a', at: 1 };
    expect(cellState('h1', undefined, 0)).toBe('ready');
    expect(cellState('h1', undefined, 2)).toBe('incomplete');
    expect(cellState('h1', approved, 0)).toBe('approved');
    expect(cellState('h2', approved, 0)).toBe('changed');
    expect(cellState('h1', { ...approved, verdict: 'rejected' }, 0)).toBe('to_fix');
    // Edited after being sent back: back in the queue
    expect(cellState('h2', { ...approved, verdict: 'rejected' }, 0)).toBe('ready');
  });

  it('reads stored decisions back, dropping broken entries', () => {
    expect(
      parseCellDecisions({
        media: { verdict: 'approved', hash: 'x', by: 'admin', at: 3, note: '  ' },
        details: { verdict: 'maybe', hash: 'x', by: 'admin', at: 3 },
        tip: 'nope',
      })
    ).toEqual({ media: { verdict: 'approved', hash: 'x', by: 'admin', at: 3 } });
  });
});

describe('snapshot of an item', () => {
  it('starts with nothing validated and resumes at the first cell', () => {
    const s = reviewSnapshot('recipe', recipe, {}, workflow, ctx);
    expect(s.approvedRequired).toBe(0);
    expect(s.percent).toBe(0);
    expect(s.publishable).toBe(false);
    expect(s.currentStep).toBe('identity');
    expect(s.nextCell).toBe('identity:fr');
    expect(s.completeness).toBeGreaterThan(50);
  });

  it('remembers what was validated, step by step', () => {
    const decisions = Object.fromEntries(
      Object.entries(approveAll(recipe)).filter(([id]) => id === 'identity:fr' || id === 'media')
    );
    const s = reviewSnapshot('recipe', recipe, decisions, workflow, ctx);
    expect(s.cells['identity:fr'].state).toBe('approved');
    expect(s.cells.media.state).toBe('approved');
    expect(s.nextCell).toBe('details');
    expect(s.percent).toBe(50);
  });

  it('is publishable once every required cell is validated, and only a changed cell goes back', () => {
    const decisions = approveAll(recipe);
    expect(reviewSnapshot('recipe', recipe, decisions, workflow, ctx).publishable).toBe(true);
    const edited = { ...recipe, name_derja: `${recipe.name_derja}!` };
    const s = reviewSnapshot('recipe', edited, decisions, workflow, ctx);
    expect(s.cells['identity:derja'].state).toBe('changed');
    expect(Object.values(s.cells).filter((c) => c.state !== 'approved')).toHaveLength(1);
    expect(s.publishable).toBe(true); // derja is not required by default
  });

  it('flags a recipe without photo as incomplete', () => {
    const s = reviewSnapshot('recipe', { ...recipe, image_url: '' }, {}, workflow, ctx);
    expect(s.cells.media.state).toBe('incomplete');
    expect(batchApprovableCells(s)).not.toContain('media');
    expect(batchApprovableCells(s)).toContain('identity:fr');
  });

  it('requires published ingredients when the context knows them', () => {
    const s = reviewSnapshot('recipe', recipe, {}, workflow, { ...ctx, publishedIngredientIds: new Set() });
    expect(s.cells.details.state).toBe('incomplete');
  });

  it('applies the levels set by the workflow', () => {
    const wf = { ...workflow, ruleLevels: { 'recipe.photo': 'off' as const } };
    expect(reviewSnapshot('recipe', { ...recipe, image_url: '' }, {}, wf, ctx).cells.media.state).toBe('ready');
  });

  it('opens the steps one after the other in a sequential workflow', () => {
    const wf = { ...workflow, sequential: true };
    const s = reviewSnapshot('recipe', recipe, {}, wf, ctx);
    expect(isStepOpen(wf, s, 'identity')).toBe(true);
    expect(isStepOpen(wf, s, 'media')).toBe(false);
    expect(isStepOpen(workflow, s, 'media')).toBe(true);
  });
});

describe('publication', () => {
  it('publishes validated cells and keeps the online text of a language not validated yet', () => {
    const online = recipe;
    const draft = { ...recipe, name_fr: 'Nouveau nom', name_derja: 'Esm jdid' };
    const decisions = approveAll(draft);
    delete (decisions as Record<string, unknown>)['identity:derja'];
    const s = reviewSnapshot('recipe', draft, decisions, workflow, ctx);
    const published = composePublication('recipe', draft, online, s, workflow)!;
    expect(published.name_fr).toBe('Nouveau nom');
    expect(published.name_derja).toBe(online.name_derja);
  });

  it('empties a language not validated when nothing is online yet', () => {
    const decisions = approveAll(recipe);
    delete (decisions as Record<string, unknown>)['steps:ar'];
    const s = reviewSnapshot('recipe', recipe, decisions, workflow, ctx);
    const published = composePublication('recipe', recipe, null, s, workflow)!;
    expect(published.steps.every((step) => step.instruction_ar === '')).toBe(true);
    expect(published.steps[0].instruction_fr).toBe(recipe.steps[0].instruction_fr);
  });

  it('refuses while a required cell is not validated, or a language cannot wait', () => {
    expect(
      composePublication('recipe', recipe, null, reviewSnapshot('recipe', recipe, {}, workflow, ctx), workflow)
    ).toBeNull();
    const decisions = approveAll(recipe);
    delete (decisions as Record<string, unknown>)['tip:ar'];
    const strict = { ...workflow, partialLanguages: false };
    const s = reviewSnapshot('recipe', recipe, decisions, strict, ctx);
    expect(composePublication('recipe', recipe, null, s, strict)).toBeNull();
  });
});

describe('workflow definition', () => {
  it('has a valid default for every kind', () => {
    expect(validateWorkflow(defaultWorkflow('recipe'))).toEqual([]);
    expect(validateWorkflow(defaultWorkflow('ingredient'))).toEqual([]);
    expect(defaultWorkflow('recipe').steps.map((s) => s.id)).toEqual([
      'identity',
      'media',
      'details',
      'steps',
      'tip',
      'lang-ar',
      'lang-derja',
      'lang-derja_ar',
    ]);
  });

  it('reads a stored workflow, dropping what is unknown and keeping the French name required', () => {
    const { workflow: wf, warnings } = resolveWorkflow('recipe', {
      steps: [
        { id: 'all', label: { fr: 'Tout', xx: 'no' }, cells: ['identity:fr', 'media', 'bogus', 'media'] },
        { id: 'BAD ID', cells: [] },
      ],
      requiredCells: ['media', 'nope'],
      ruleLevels: { 'recipe.video': 'blocking', 'recipe.unknown': 'off', 'recipe.photo': 'loud' },
      sequential: true,
    });
    expect(wf.steps).toEqual([{ id: 'all', label: { fr: 'Tout' }, cells: ['identity:fr', 'media'] }]);
    expect(wf.requiredCells).toEqual([ALWAYS_REQUIRED_CELL, 'media']);
    expect(wf.ruleLevels).toEqual({ 'recipe.video': 'blocking' });
    expect(wf.sequential).toBe(true);
    expect(wf.batchApproval).toBe(true);
    expect(warnings.length).toBeGreaterThanOrEqual(5);
  });

  it('falls back to the default for an unreadable document', () => {
    expect(resolveWorkflow('ingredient', 'garbage').workflow).toEqual(defaultWorkflow('ingredient'));
  });

  it('refuses to save a workflow that loses a required cell or the French name', () => {
    const wf = { ...workflow, steps: workflow.steps.filter((s) => s.id !== 'media') };
    expect(validateWorkflow(wf)).toContain('La case obligatoire media n’est dans aucune étape.');
    expect(validateWorkflow({ ...workflow, requiredCells: ['media'] })).toContain(
      'Le nom en français doit rester obligatoire.'
    );
    expect(validateWorkflow({ ...workflow, steps: [] })).toContain('Le workflow doit avoir au moins une étape.');
  });

  it('measures the effect of a new workflow on items online', () => {
    const decisions = approveAll(recipe);
    delete (decisions as Record<string, unknown>)['identity:derja'];
    const stricter = { ...workflow, requiredCells: [...workflow.requiredCells, 'identity:derja'] };
    expect(workflowImpact('recipe', [{ id: recipe.id, item: recipe, decisions }], workflow, ctx)).toEqual([]);
    expect(workflowImpact('recipe', [{ id: recipe.id, item: recipe, decisions }], stricter, ctx)).toEqual([recipe.id]);
  });
});

describe('roles', () => {
  const role = (id: string) => DEFAULT_ROLES.find((r) => r.id === id)!;
  const derjaCell = parseCellId('recipe', 'steps:derja')!;
  const media = parseCellId('recipe', 'media')!;

  it('gives the admin every right', () => {
    expect(canPerform(role(ADMIN_ROLE_ID), 'manage_workflows')).toBe(true);
    expect(canReviewCell(role(ADMIN_ROLE_ID), { id: 's', label: {}, cells: [], reviewers: ['reviewer'] }, media)).toBe(
      true
    );
  });

  it('limits an editor and a translator', () => {
    expect(canPerform(role('editor'), 'publish')).toBe(false);
    expect(canPerform(role('translator'), 'edit', derjaCell)).toBe(true);
    expect(canPerform(role('translator'), 'edit', media)).toBe(false);
    expect(canReviewCell(role('reviewer'), { id: 's', label: {}, cells: [], reviewers: ['other'] }, media)).toBe(false);
    expect(canReviewCell(role('reviewer'), undefined, media)).toBe(true);
  });

  it('always keeps the admin when reading roles', () => {
    const roles = resolveRoles([
      { id: 'admin', permissions: [] },
      { id: 'chef', label: { fr: 'Chef' }, permissions: ['review', 'fly'], languages: ['derja', 'xx'] },
    ]);
    expect(roles.map((r) => r.id)).toEqual(['admin', 'chef']);
    expect(roles[0].permissions).toContain('manage_roles');
    expect(roles[1]).toEqual({ id: 'chef', label: { fr: 'Chef' }, permissions: ['review'], languages: ['derja'] });
    expect(validateRoles(roles.slice(1))).toContain('Le rôle administrateur doit rester présent avec tous les droits.');
    expect(validateRoles([...DEFAULT_ROLES])).toEqual([]);
  });
});

describe('review queue', () => {
  const ing = initialIngredients[0];
  const entries = [
    {
      id: recipe.id,
      kind: 'recipe' as const,
      snapshot: reviewSnapshot('recipe', recipe, {}, workflow, ctx),
      updatedAt: 2,
      author: 'sara',
    },
    {
      id: ing.id,
      kind: 'ingredient' as const,
      snapshot: reviewSnapshot('ingredient', ing, {}, defaultWorkflow('ingredient'), ctx),
      updatedAt: 1,
    },
  ];
  const workflows = { recipe: workflow, ingredient: defaultWorkflow('ingredient') };

  it('groups the waiting cells by language, part or item, with full counts', () => {
    const byLanguage = groupQueue(entries, 'language', workflows);
    // Derja (Latin letters) is written in the built-in catalog: every cell waits for the reviewer
    const derja = byLanguage.find((g) => g.key === 'derja')!;
    expect(derja.cells.map((c) => `${c.kind}.${c.cell}`).sort()).toEqual(
      ['ingredient.identity:derja', 'recipe.identity:derja', 'recipe.steps:derja', 'recipe.tip:derja'].sort()
    );
    // Derja in Arabic letters is not written yet: those cells are incomplete, not waiting
    const derjaAr = byLanguage.find((g) => g.key === 'derja_ar')!;
    expect(derjaAr.cells.map((c) => c.cell)).toEqual(['tip:derja_ar']);
    const byItem = groupQueue(entries, 'item', workflows);
    expect(byItem.map((g) => g.key).sort()).toEqual([`ingredient:${ing.id}`, `recipe:${recipe.id}`].sort());
    expect(groupQueue(entries, 'part', workflows).find((g) => g.key === 'recipe:media')!.cells).toHaveLength(1);
  });

  it('counts what waits for the reviewer', () => {
    const counts = queueCounts(entries);
    expect(counts.items).toBe(2);
    expect(counts.publishable).toBe(0);
    expect(counts.pending).toBe(groupQueue(entries, 'kind', workflows).reduce((n, g) => n + g.cells.length, 0));
    expect(counts.pending).toBeGreaterThan(0);
  });
});
