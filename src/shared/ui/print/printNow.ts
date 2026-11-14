/**
 * Triggers the browser's native print dialog (used to produce a PDF via
 * "Save as PDF"). Safe to call in non-browser environments.
 */
export function printNow(): void {
  if (typeof window === 'undefined') return;
  if (typeof window.print !== 'function') return;
  window.print();
}
