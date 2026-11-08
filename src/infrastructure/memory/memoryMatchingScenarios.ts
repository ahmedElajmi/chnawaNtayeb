import type { MatchingScenario } from '@/core/matching';
import type { MatchingScenarioRepository } from '@/application';

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/**
 * Scenarios kept in memory: reference implementation of the port (it defines the expected
 * behaviour together with the contract tests), usable for demos, tests or a backend-free setup.
 */
export function createMemoryMatchingScenarios(initial: MatchingScenario[] = []): MatchingScenarioRepository {
  let rows = copy(initial);
  return {
    async list() {
      return copy(rows);
    },
    async save(scenario) {
      const exists = rows.some((s) => s.id === scenario.id);
      rows = exists ? rows.map((s) => (s.id === scenario.id ? copy(scenario) : s)) : [...rows, copy(scenario)];
      return { ok: true };
    },
    async remove(scenarioId) {
      rows = rows.filter((s) => s.id !== scenarioId);
      return { ok: true };
    },
    async replaceAll(scenarios) {
      rows = copy(scenarios);
      return { ok: true };
    },
  };
}
