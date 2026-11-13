import { REVIEW_KINDS, type ReviewKind } from './parts';
import { DEFAULT_ROLES, resolveRoles, validateRoles, type RoleDefinition } from './roles';
import { defaultWorkflow, resolveWorkflow, validateWorkflow, type WorkflowDefinition } from './workflow';

/** Workflows of every kind and the roles of the team: one document, edited by the admin. */
export interface ReviewSettings {
  workflows: Record<ReviewKind, WorkflowDefinition>;
  roles: RoleDefinition[];
}

export function defaultReviewSettings(): ReviewSettings {
  return {
    workflows: Object.fromEntries(REVIEW_KINDS.map((k) => [k, defaultWorkflow(k)])) as Record<
      ReviewKind,
      WorkflowDefinition
    >,
    roles: [...DEFAULT_ROLES],
  };
}

/** Settings read from outside: always usable (defaults for what is missing), with what was repaired. */
export function resolveReviewSettings(raw: unknown): { settings: ReviewSettings; warnings: string[] } {
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const stored =
    value.workflows && typeof value.workflows === 'object' ? (value.workflows as Record<string, unknown>) : {};
  const warnings: string[] = [];
  const workflows = {} as Record<ReviewKind, WorkflowDefinition>;
  for (const kind of REVIEW_KINDS) {
    const resolved = resolveWorkflow(kind, stored[kind]);
    workflows[kind] = resolved.workflow;
    warnings.push(...resolved.warnings.map((w) => `${kind} : ${w}`));
  }
  return { settings: { workflows, roles: resolveRoles(value.roles) }, warnings };
}

/** Problems that prevent saving the settings (empty = can be saved). */
export function validateReviewSettings(settings: ReviewSettings): string[] {
  return [
    ...REVIEW_KINDS.flatMap((kind) => validateWorkflow(settings.workflows[kind]).map((e) => `${kind} : ${e}`)),
    ...validateRoles(settings.roles),
  ];
}
