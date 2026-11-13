import { describe, expect, it } from 'vitest';
import { DEFAULT_ROLES, type RoleDefinition } from '@/core/review';
import { createMemoryTeam } from '@/infrastructure/memory/memoryTeam';
import { TeamStore } from './TeamStore';

function setup(roles: RoleDefinition[] = [...DEFAULT_ROLES]) {
  const repo = createMemoryTeam([{ uid: 'u1', email: 'sara@example.com' }]);
  let current = roles;
  const team = new TeamStore(repo, { now: () => 5, roles: () => current });
  team.start();
  return { team, setRoles: (r: RoleDefinition[]) => (current = r) };
}

describe('TeamStore', () => {
  it('adds an account found by its e-mail, with the rights of its role', async () => {
    const { team } = setup();
    expect((await team.add('nobody@example.com', 'editor', 'patron')).ok).toBe(false);
    expect((await team.add('sara@example.com', 'admin', 'patron')).ok).toBe(false);
    expect(await team.add(' Sara@example.com ', 'reviewer', 'patron')).toEqual({ ok: true });
    expect(team.getState().members).toEqual([
      expect.objectContaining({ uid: 'u1', role: 'reviewer', can_publish: true, can_manage: false }),
    ]);
  });

  it('knows the role of the account signed in on this device', async () => {
    const { team } = setup();
    await team.add('sara@example.com', 'translator', 'patron');
    await team.identify('u1');
    expect(team.myRole()?.id).toBe('translator');
    await team.identify('someone-else');
    expect(team.myRole()).toBeNull();
    await team.identify(null);
    expect(team.getState().me).toBeNull();
  });

  it('refreshes the rights copied on members when a role changes', async () => {
    const { team, setRoles } = setup();
    await team.add('sara@example.com', 'editor', 'patron');
    expect(team.getState().members[0].can_publish).toBe(false);
    const roles = DEFAULT_ROLES.map((r) =>
      r.id === 'editor' ? { ...r, permissions: [...r.permissions, 'publish' as const] } : r
    );
    setRoles(roles);
    await team.refreshRights(roles);
    expect(team.getState().members[0].can_publish).toBe(true);
    await team.setRole('u1', 'translator');
    expect(team.getState().members[0]).toMatchObject({ role: 'translator', can_publish: false });
    await team.remove('u1');
    expect(team.getState().members).toEqual([]);
  });
});
