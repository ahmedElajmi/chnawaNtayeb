import {
  parseScenario,
  parseScenarioList,
  scenarioIdFromTitle,
  validateScenario,
  type MatchingScenario,
  type ScenarioCatalog,
} from '@/core/matching';
import type { MatchingScenarioRepository, WriteResult } from '../ports';
import { Store } from '../store';

export interface MatchingScenariosState {
  scenarios: MatchingScenario[];
  /** idle = never loaded; error = database unreachable (the list may be outdated) */
  status: 'idle' | 'loading' | 'ready' | 'error';
}

export interface MatchingScenariosDeps {
  /** Random suffix of a new scenario id */
  randomSuffix: () => string;
  /** Current date as an ISO string */
  now: () => string;
}

/**
 * The chef's scenarios ("with this fridge, we must see these dishes"), managed in the backoffice.
 * The database is the only source; a JSON file is only used to export or restore the list.
 */
export class MatchingScenariosStore extends Store<MatchingScenariosState> {
  constructor(
    private readonly repo: MatchingScenarioRepository,
    private readonly deps: MatchingScenariosDeps
  ) {
    super({ scenarios: [], status: 'idle' });
  }

  async load(): Promise<void> {
    this.setState({ status: 'loading' });
    const raw = await this.repo.list();
    if (!raw) {
      this.setState({ status: 'error' });
      return;
    }
    const scenarios = raw.map(parseScenario).filter((s): s is MatchingScenario => s !== null);
    this.setState({ scenarios, status: 'ready' });
  }

  /** Id for a new scenario, unique in the current list. */
  newId(title: string): string {
    const taken = new Set(this.getState().scenarios.map((s) => s.id));
    let id = scenarioIdFromTitle(title, this.deps.randomSuffix());
    while (taken.has(id)) id = scenarioIdFromTitle(title, this.deps.randomSuffix());
    return id;
  }

  /** Creates or updates a scenario after validation. */
  async save(scenario: MatchingScenario, catalog?: ScenarioCatalog): Promise<WriteResult> {
    const clean = parseScenario(scenario);
    if (!clean) return { ok: false, error: 'Scénario invalide.' };
    const errors = validateScenario(clean, catalog);
    if (errors.length) return { ok: false, error: errors.join(' ') };
    const result = await this.repo.save(clean);
    if (!result.ok) return result;
    this.setState(({ scenarios }) => ({
      scenarios: scenarios.some((s) => s.id === clean.id)
        ? scenarios.map((s) => (s.id === clean.id ? clean : s))
        : [...scenarios, clean],
    }));
    return { ok: true };
  }

  async remove(scenarioId: string): Promise<WriteResult> {
    const result = await this.repo.remove(scenarioId);
    if (result.ok) this.setState(({ scenarios }) => ({ scenarios: scenarios.filter((s) => s.id !== scenarioId) }));
    return result;
  }

  /** Backup of every scenario as JSON text (dump). */
  exportJson(): string {
    return JSON.stringify({ exported_at: this.deps.now(), scenarios: this.getState().scenarios }, null, 2);
  }

  /**
   * Restores an export: the list in the database is replaced by the file's scenarios.
   * Incomplete scenarios are skipped (`skipped`).
   */
  async importJson(text: string): Promise<WriteResult & { count?: number; skipped?: number }> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    const list = parseScenarioList(parsed);
    if (!list) return { ok: false, error: 'Fichier illisible : ce n’est pas un export de scénarios.' };
    const scenarios = list.filter((s) => validateScenario(s).length === 0);
    const result = await this.repo.replaceAll(scenarios);
    if (!result.ok) return result;
    this.setState({ scenarios, status: 'ready' });
    return { ok: true, count: scenarios.length, skipped: list.length - scenarios.length };
  }
}
