import { ADMIN_ROLE_ID, canPerform, type RoleDefinition } from './roles';

/**
 * A member of the team: a signed-in account given a role by the admin. The database rules cannot read
 * the roles document, so the two rights they enforce are copied on the member (and refreshed when a
 * role changes): publishing (public collections) and managing (workflows, roles, team).
 */
export interface TeamMember {
  uid: string;
  email: string;
  role: string;
  can_publish: boolean;
  can_manage: boolean;
  added_by: string;
  added_at: number;
}

/** Rights of a role as the database rules read them. */
export function memberRights(role: RoleDefinition | undefined): Pick<TeamMember, 'can_publish' | 'can_manage'> {
  if (!role) return { can_publish: false, can_manage: false };
  return {
    can_publish: canPerform(role, 'publish'),
    can_manage: canPerform(role, 'manage_workflows') || canPerform(role, 'manage_roles'),
  };
}

/** Members whose stored rights no longer match their role (after a role was edited). */
export function membersToRefresh(members: readonly TeamMember[], roles: readonly RoleDefinition[]): TeamMember[] {
  return members.flatMap((m) => {
    const rights = memberRights(roles.find((r) => r.id === m.role));
    return rights.can_publish !== m.can_publish || rights.can_manage !== m.can_manage ? [{ ...m, ...rights }] : [];
  });
}

/** Role of a member, or none (unknown role: no rights at all). The admin role is never given to a member. */
export function roleOfMember(member: TeamMember | null, roles: readonly RoleDefinition[]): RoleDefinition | null {
  if (!member || member.role === ADMIN_ROLE_ID) return null;
  return roles.find((r) => r.id === member.role) ?? null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (value: string) => EMAIL.test(value.trim());

/** Member read back from the database (null when unusable). */
export function parseTeamMember(raw: unknown): TeamMember | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.uid !== 'string' || !v.uid || typeof v.role !== 'string') return null;
  return {
    uid: v.uid,
    email: typeof v.email === 'string' ? v.email : '',
    role: v.role,
    can_publish: v.can_publish === true,
    can_manage: v.can_manage === true,
    added_by: typeof v.added_by === 'string' ? v.added_by : '?',
    added_at: typeof v.added_at === 'number' ? v.added_at : 0,
  };
}
