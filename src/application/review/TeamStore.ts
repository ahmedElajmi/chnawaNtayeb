import {
  ADMIN_ROLE_ID,
  isEmail,
  memberRights,
  membersToRefresh,
  parseTeamMember,
  roleOfMember,
  type RoleDefinition,
  type TeamMember,
} from '@/core/review';
import type { TeamRepository, WriteResult } from '../ports';
import { Store } from '../store';

export interface TeamState {
  /** Every member (followed by managers only) */
  members: TeamMember[];
  /** The member record of the account signed in on this device (null: not a member or nobody) */
  me: TeamMember | null;
  /** 'checking' while the record of the signed-in account is read */
  meStatus: 'checking' | 'known';
}

/**
 * The team: accounts given a role by the admin. A member signs in on the site with their own
 * account and works in the backoffice with the rights of their role (checked here, by the
 * ReviewStore, and by the database rules through the rights copied on their record).
 */
export class TeamStore extends Store<TeamState> {
  private uid: string | null = null;

  constructor(
    private readonly repo: TeamRepository,
    private readonly deps: { now: () => number; roles: () => readonly RoleDefinition[] }
  ) {
    super({ members: [], me: null, meStatus: 'known' });
  }

  /** Account signed in on this device (null when nobody): reads its member record. */
  async identify(uid: string | null): Promise<void> {
    this.uid = uid;
    if (!uid) {
      this.setState({ me: null, meStatus: 'known' });
      return;
    }
    this.setState({ meStatus: 'checking' });
    const raw = await this.repo.getMember(uid).catch(() => null);
    if (this.uid !== uid) return;
    this.setState({ me: parseTeamMember(raw), meStatus: 'known' });
  }

  /** Role of the signed-in member (null: not a member). */
  myRole(): RoleDefinition | null {
    return roleOfMember(this.getState().me, this.deps.roles());
  }

  /** Follows every member (managers); returns the stop function. */
  start(): () => void {
    return this.repo.follow(
      (raw) =>
        this.setState({
          members: raw
            .map(parseTeamMember)
            .filter((m): m is TeamMember => m !== null)
            .sort((a, b) => a.email.localeCompare(b.email)),
        }),
      () => {}
    );
  }

  /** Adds the account that signed in on the site with this e-mail, with a role. */
  async add(email: string, roleId: string, by: string): Promise<WriteResult> {
    if (!isEmail(email)) return { ok: false, error: 'Adresse e-mail invalide.' };
    if (roleId === ADMIN_ROLE_ID) return { ok: false, error: 'Le rôle administrateur ne se donne pas.' };
    const role = this.deps.roles().find((r) => r.id === roleId);
    if (!role) return { ok: false, error: 'Rôle inconnu.' };
    const account = await this.repo.findAccountByEmail(email.trim().toLowerCase()).catch(() => null);
    if (!account)
      return {
        ok: false,
        error: 'Aucun compte avec cette adresse : la personne doit d’abord se connecter une fois sur le site.',
      };
    const member: TeamMember = {
      uid: account.uid,
      email: account.email,
      role: roleId,
      ...memberRights(role),
      added_by: by,
      added_at: this.deps.now(),
    };
    return this.repo.put(member);
  }

  async setRole(uid: string, roleId: string): Promise<WriteResult> {
    const member = this.getState().members.find((m) => m.uid === uid);
    const role = this.deps.roles().find((r) => r.id === roleId);
    if (!member || !role || roleId === ADMIN_ROLE_ID) return { ok: false, error: 'Rôle inconnu.' };
    return this.repo.put({ ...member, role: roleId, ...memberRights(role) });
  }

  remove(uid: string): Promise<WriteResult> {
    return this.repo.remove(uid);
  }

  /** After roles were edited: the rights copied on each member follow their role again. */
  async refreshRights(roles: readonly RoleDefinition[]): Promise<WriteResult> {
    for (const member of membersToRefresh(this.getState().members, roles)) {
      const result = await this.repo.put(member);
      if (!result.ok) return result;
    }
    return { ok: true };
  }
}
