import type { TeamMember } from '@/core/review';
import type { TeamRepository } from '@/application';

/** Team held in memory: reference implementation of TeamRepository (tests). */
export function createMemoryTeam(accounts: { uid: string; email: string }[] = []) {
  const members = new Map<string, TeamMember>();
  const listeners = new Set<(members: unknown[]) => void>();
  const send = () => listeners.forEach((l) => l(structuredClone([...members.values()])));
  const repo: TeamRepository = {
    follow(onChange) {
      listeners.add(onChange);
      onChange(structuredClone([...members.values()]));
      return () => listeners.delete(onChange);
    },
    async getMember(uid) {
      return members.has(uid) ? structuredClone(members.get(uid)!) : null;
    },
    async findAccountByEmail(email) {
      return accounts.find((a) => a.email === email) ?? null;
    },
    async put(member) {
      members.set(member.uid, structuredClone(member));
      send();
      return { ok: true };
    },
    async remove(uid) {
      members.delete(uid);
      send();
      return { ok: true };
    },
  };
  return repo;
}
