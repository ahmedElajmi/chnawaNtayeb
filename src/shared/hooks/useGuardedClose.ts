import { useCallback } from 'react';

/**
 * Close handler for a dialog holding unsaved input: asks before losing it,
 * closes at once when nothing changed. Use it for the backdrop / Escape dismiss.
 */
export function useGuardedClose(dirty: boolean, onClose: () => void, question: string): () => void {
  return useCallback(() => {
    if (!dirty || window.confirm(question)) onClose();
  }, [dirty, onClose, question]);
}
