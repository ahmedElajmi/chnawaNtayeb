/**
 * Adaptive rhythm of the update checks (page visible only): while versions keep being
 * found (a deploy-heavy period) the rhythm stays tight, then it relaxes step by step
 * up to the hourly ceiling. The caller counts the checks that found nothing.
 */

/** Base delay between two update checks while versions are being found (5 minutes). */
export const UPDATE_CHECK_BASE_DELAY_MS = 5 * 60 * 1000;

/** Ceiling of the adaptive rhythm (1 hour). */
export const UPDATE_CHECK_MAX_DELAY_MS = 60 * 60 * 1000;

/** Multipliers of the base delay per check that found nothing: 5 -> 15 -> 30 -> 60 min. */
const GROWTH = [1, 3, 6, 12];

/** The delay before the next update check, from the number of consecutive checks that
 * found nothing (0 = an update was just found or this is the first check). */
export function nextUpdateCheckDelayMs(roundsWithoutUpdate: number): number {
  const step = Math.min(Math.max(Math.trunc(roundsWithoutUpdate), 0), GROWTH.length - 1);
  return Math.min(UPDATE_CHECK_BASE_DELAY_MS * GROWTH[step], UPDATE_CHECK_MAX_DELAY_MS);
}
