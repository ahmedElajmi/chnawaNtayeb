/**
 * The conflict vocabulary of the SQL layer (lot 1.4): what a contended write can raise,
 * named once so every adapter classifies identically and the retry budget is uniform.
 * The engine-specific error codes and messages stay inside each adapter — this module is
 * the shared contract-level vocabulary, not a per-engine matcher.
 */

/** A conflict class is a clean lost race the caller may retry — never a storage failure. */
export type SqlConflictClass =
  /** The compare-and-swap on the row revision failed: the row changed since the read. */
  | 'cas_lost'
  /** The write lock was lost to a concurrent transaction (lock wait, serialisation failure). */
  | 'lock_lost'
  /** A plain insert lost the race for a row that did not exist yet (primary key). */
  | 'unique_lost';

/** One attempt plus at most 3 rejeux (validated micro-arbitrage 1, plan § 5 « rejeu ≤ 3 »):
 * beyond the budget, the contention is abnormal and surfaces as a clean storage error. */
export const TRANSACT_REJEUX = 3;

/**
 * Runs a pure read-merge-write attempt under the shared retry budget. The operation is pure
 * (contract requirement), so re-running it over the fresh state is always safe. A conflict
 * past the budget is rethrown: the caller turns it into a storage error, never a silent loss.
 *
 * Between rejeux the loop yields with a small backoff: a synchronous engine's wait (better-
 * sqlite3) blocks the whole event loop, so releasing it lets the current lock holder commit
 * before the next attempt — a retry that never yields would starve it.
 */
export async function withTransactRetries<T>(
  attempt: () => Promise<T>,
  isConflict: (error: unknown) => boolean
): Promise<T> {
  for (let rejeu = 0; ; rejeu++) {
    try {
      return await attempt();
    } catch (error) {
      if (rejeu < TRANSACT_REJEUX && isConflict(error)) {
        await new Promise((resolve) => setTimeout(resolve, rejeu * 10 + Math.floor(Math.random() * 10)));
        continue;
      }
      throw error;
    }
  }
}
