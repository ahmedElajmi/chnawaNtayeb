import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  writeBatch,
  type WriteBatch,
} from 'firebase/firestore';
import type { MatchingScenario } from '@/core/matching';
import type { MatchingScenarioRepository, WriteResult } from '@/application';
import { db, handleFirestoreError, OperationType } from '@/infrastructure/firebase/client';

/**
 * Firestore layout (see firestore.rules):
 *   matching_scenarios/{id}   one chef's scenario (admin only), ordered by `created_at`
 */
const NAME = 'matching_scenarios';
const SCENARIOS = collection(db, NAME);
/** Firestore limit is 500 writes per batch */
const BATCH_SIZE = 400;
type Write = (batch: WriteBatch) => void;

interface ScenarioDoc extends Omit<MatchingScenario, 'id'> {
  created_at: string;
  updated_at: string;
}

function toDoc(scenario: MatchingScenario, createdAt: string, updatedAt: string): ScenarioDoc {
  const { id: _id, ...data } = scenario;
  // Plain JSON only (Firestore refuses `undefined`)
  return { ...JSON.parse(JSON.stringify(data)), created_at: createdAt, updated_at: updatedAt };
}

function failure(error: unknown, operation: OperationType, path: string): WriteResult {
  const info = handleFirestoreError(error, operation, path);
  return {
    ok: false,
    error: /permission|insufficient/i.test(info.error)
      ? 'La base a refusé l’enregistrement (session superAdmin non reliée à Firebase, ou règles Firestore non déployées).'
      : 'La base de données est injoignable, réessaie plus tard.',
  };
}

export const firestoreMatchingScenarios: MatchingScenarioRepository = {
  async list() {
    try {
      const snap = await getDocs(query(SCENARIOS, orderBy('created_at', 'asc')));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, NAME);
      return null;
    }
  },

  async save(scenario) {
    const ref = doc(SCENARIOS, scenario.id);
    try {
      await runTransaction(db, async (tx) => {
        const current = await tx.get(ref);
        const now = new Date().toISOString();
        const createdAt = (current.data() as ScenarioDoc | undefined)?.created_at ?? now;
        tx.set(ref, toDoc(scenario, createdAt, now));
      });
      return { ok: true };
    } catch (error) {
      return failure(error, OperationType.WRITE, `${NAME}/${scenario.id}`);
    }
  },

  async remove(scenarioId) {
    try {
      await deleteDoc(doc(SCENARIOS, scenarioId));
      return { ok: true };
    } catch (error) {
      return failure(error, OperationType.DELETE, `${NAME}/${scenarioId}`);
    }
  },

  async replaceAll(scenarios) {
    try {
      const existing = await getDocs(SCENARIOS);
      const keep = new Set(scenarios.map((s) => s.id));
      const start = Date.now();
      const now = new Date(start).toISOString();
      const writes: Write[] = [
        ...existing.docs
          .filter((d) => !keep.has(d.id))
          .map(
            (d): Write =>
              (b) =>
                b.delete(d.ref)
          ),
        // One millisecond apart so the list keeps the order of the file
        ...scenarios.map(
          (s, i): Write =>
            (b) =>
              b.set(doc(SCENARIOS, s.id), toDoc(s, new Date(start + i).toISOString(), now))
        ),
      ];
      for (let i = 0; i < writes.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        writes.slice(i, i + BATCH_SIZE).forEach((write) => write(batch));
        await batch.commit();
      }
      return { ok: true };
    } catch (error) {
      return failure(error, OperationType.WRITE, NAME);
    }
  },
};
