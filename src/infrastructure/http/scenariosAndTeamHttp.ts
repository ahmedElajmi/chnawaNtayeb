import type { MatchingScenarioRepository, TeamRepository, WriteResult } from '@/application';
import type { MatchingScenario } from '@/core/matching';
import type { TeamMember } from '@/core/review';
import { withoutUndefined } from '@/core/shared';
import { dataHeaders, deleteDoc, fetchChanges, putDoc, replaceDocs } from './dataApi';
import { dataPoller } from './dataPoller';

/**
 * Matching scenarios and team members through the data endpoints: the scenarios are
 * manager-only, the team record lives in `admins` (read by proved managers, an employee
 * reads their own record through the single-document read).
 */

function writeResult(ok: boolean, unreachable = true): WriteResult {
  return ok
    ? { ok: true }
    : { ok: false, error: unreachable ? 'La base de données est injoignable.' : 'La base a refusé l’enregistrement.' };
}

/** The chef's quality scenarios, managed in the backoffice (port MatchingScenarioRepository). */
export const matchingScenariosHttp: MatchingScenarioRepository = {
  list: async () => {
    const delta = await fetchChanges({ matching_scenarios: 0 });
    return delta ? (delta.matching_scenarios?.items ?? []) : null;
  },
  save: async (scenario: MatchingScenario) => {
    const { id, ...doc } = scenario;
    const result = await putDoc('matching_scenarios', id, withoutUndefined(doc as Record<string, unknown>));
    if (result.ok) dataPoller.refresh();
    return writeResult(result.ok);
  },
  remove: async (scenarioId) => {
    const result = await deleteDoc('matching_scenarios', scenarioId);
    if (result.ok) dataPoller.refresh();
    return writeResult(result.ok);
  },
  replaceAll: async (scenarios) => {
    const result = await replaceDocs(
      'matching_scenarios',
      scenarios.map((s) => {
        const { id, ...doc } = s;
        return { id, ...withoutUndefined(doc as Record<string, unknown>) };
      })
    );
    if (result.ok) dataPoller.refresh();
    return writeResult(result.ok);
  },
};

/** Accounts of the team and their roles (port TeamRepository). */
export const teamHttp: TeamRepository = {
  follow(onChange, onError) {
    // The admins collection is small: the adapter keeps the full list and replays it whole
    const members = new Map<string, Record<string, unknown>>();
    dataPoller.follow(
      'admins',
      0,
      (changes) => {
        if (changes.complete) members.clear();
        for (const id of changes.removedIds) members.delete(id);
        for (const raw of changes.items) {
          const doc = raw as Record<string, unknown>;
          const uid = typeof doc.id === 'string' ? doc.id : '';
          if (uid) members.set(uid, doc);
        }
        onChange([...members.values()].map((d) => ({ ...d, uid: d.id })));
      },
      onError
    );
    return () => dataPoller.stop('admins');
  },
  getMember: async (uid) => {
    try {
      const res = await fetch(`/api/data/admins/${encodeURIComponent(uid)}`, { headers: dataHeaders() });
      if (!res.ok) return null;
      const data = (await res.json()) as { doc?: Record<string, unknown> | null };
      return data.doc ? { ...data.doc, uid } : null;
    } catch {
      return null;
    }
  },
  findAccountByEmail: async (email) => {
    try {
      const res = await fetch(`/admin/api/accounts/lookup?email=${encodeURIComponent(email)}`, {
        headers: dataHeaders(),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { account?: { uid: string; email: string } | null };
      return data.account ?? null;
    } catch {
      return null;
    }
  },
  put: async (member: TeamMember) => {
    const { uid, ...data } = member;
    const result = await putDoc('admins', uid, withoutUndefined(data as Record<string, unknown>));
    if (result.ok) dataPoller.refresh();
    return writeResult(result.ok);
  },
  remove: async (uid) => {
    const result = await deleteDoc('admins', uid);
    if (result.ok) dataPoller.refresh();
    return writeResult(result.ok);
  },
};
