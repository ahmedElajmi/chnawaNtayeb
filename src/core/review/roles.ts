import { isLanguage, type Language } from '../shared';
import type { ReviewCell } from './parts';
import type { StepLabel, WorkflowStep } from './workflow';

/** What a member of the team may do. */
export type Permission = 'edit' | 'submit' | 'review' | 'publish' | 'manage_workflows' | 'manage_roles';
export const PERMISSIONS: readonly Permission[] = [
  'edit',
  'submit',
  'review',
  'publish',
  'manage_workflows',
  'manage_roles',
];

export interface RoleDefinition {
  id: string;
  label: StepLabel;
  permissions: Permission[];
  /** When set, this role only works on the cells of these languages (a translator) */
  languages?: Language[];
}

/** The admin: every right, cannot be removed nor limited. */
export const ADMIN_ROLE_ID = 'admin';

const ADMIN_ROLE: RoleDefinition = {
  id: ADMIN_ROLE_ID,
  label: { fr: 'Administrateur', derja: 'Admin', ar: 'المسؤول' },
  permissions: [...PERMISSIONS],
};

export const DEFAULT_ROLES: readonly RoleDefinition[] = [
  ADMIN_ROLE,
  {
    id: 'reviewer',
    label: { fr: 'Validateur', derja: 'Validateur', ar: 'المدقّق' },
    permissions: ['edit', 'submit', 'review', 'publish'],
  },
  { id: 'editor', label: { fr: 'Rédacteur', derja: 'Rédacteur', ar: 'المحرّر' }, permissions: ['edit', 'submit'] },
  {
    id: 'translator',
    label: { fr: 'Traducteur', derja: 'Traducteur', ar: 'المترجم' },
    permissions: ['edit', 'submit'],
    languages: ['derja', 'derja_ar', 'ar'],
  },
];

/**
 * Whether a role may do something; with a cell, a role limited to some languages may only act on
 * the cells of those languages (never on the parts common to every language).
 */
export function canPerform(role: RoleDefinition, permission: Permission, cell?: ReviewCell): boolean {
  if (role.id === ADMIN_ROLE_ID) return true;
  if (!role.permissions.includes(permission)) return false;
  if (cell && role.languages) return !!cell.language && role.languages.includes(cell.language);
  return true;
}

/** Whether a role may validate a cell of a step (the step may name its reviewers). */
export function canReviewCell(role: RoleDefinition, step: WorkflowStep | undefined, cell: ReviewCell): boolean {
  if (role.id === ADMIN_ROLE_ID) return true;
  if (!canPerform(role, 'review', cell)) return false;
  return !step?.reviewers || step.reviewers.includes(role.id);
}

const ID = /^[a-z0-9][a-z0-9_-]{0,39}$/;

/**
 * Roles read from outside: unreadable entries are dropped, and the admin is always there with every
 * right (whatever the stored document says).
 */
export function resolveRoles(raw: unknown): RoleDefinition[] {
  if (!Array.isArray(raw)) return [...DEFAULT_ROLES];
  const roles: RoleDefinition[] = [ADMIN_ROLE];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const v = r as Record<string, unknown>;
    if (typeof v.id !== 'string' || !ID.test(v.id) || v.id === ADMIN_ROLE_ID) continue;
    if (roles.some((x) => x.id === v.id)) continue;
    const permissions = Array.isArray(v.permissions)
      ? PERMISSIONS.filter((p) => (v.permissions as unknown[]).includes(p))
      : [];
    const label: StepLabel = {};
    if (v.label && typeof v.label === 'object') {
      for (const [lang, text] of Object.entries(v.label as Record<string, unknown>)) {
        if (isLanguage(lang) && typeof text === 'string' && text.trim()) label[lang] = text.trim().slice(0, 60);
      }
    }
    const languages = Array.isArray(v.languages) ? v.languages.filter(isLanguage) : undefined;
    roles.push({ id: v.id, label, permissions, ...(languages?.length ? { languages } : {}) });
  }
  return roles;
}

/** Problems that prevent saving the roles edited by the admin. */
export function validateRoles(roles: readonly RoleDefinition[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const role of roles) {
    if (!ID.test(role.id)) errors.push(`Identifiant de rôle invalide : ${role.id}.`);
    if (ids.has(role.id)) errors.push(`Rôle en double : ${role.id}.`);
    ids.add(role.id);
    if (!role.label.fr?.trim()) errors.push(`Le rôle ${role.id} n’a pas de nom en français.`);
  }
  const admin = roles.find((r) => r.id === ADMIN_ROLE_ID);
  if (!admin || PERMISSIONS.some((p) => !admin.permissions.includes(p)) || admin.languages)
    errors.push('Le rôle administrateur doit rester présent avec tous les droits.');
  return errors;
}
