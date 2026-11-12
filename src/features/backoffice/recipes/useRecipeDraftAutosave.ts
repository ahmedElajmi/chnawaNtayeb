import { useEffect, useRef, useState } from 'react';
import type { Recipe } from '@/core/catalog';
import { NEW_RECIPE_DRAFT_KEY, type RestoredRecipeDraft } from '@/application';
import { useContainer } from '@/app/ContainerContext';
import { useLatest } from '@/shared/hooks/useLatest';
import { isDraftChanged } from './recipeDraft';

const AUTOSAVE_DELAY_MS = 600;

/**
 * Keeps the editor content as a draft on this device while the chef types (and when the
 * editor closes, whatever the way), and offers the draft left by a previous session when
 * the same recipe (or a new one) is reopened.
 */
export function useRecipeDraftAutosave(opened: Recipe, isNew: boolean, current: Recipe) {
  const { recipeDrafts } = useContainer();
  const key = isNew ? NEW_RECIPE_DRAFT_KEY : opened.id;
  const [offer, setOffer] = useState<RestoredRecipeDraft | null>(() => {
    const restored = recipeDrafts.restore(key);
    return restored && isDraftChanged(opened, restored.recipe) ? restored : null;
  });
  const dirty = isDraftChanged(opened, current);
  /** Saved or abandoned: the draft must not be written again */
  const settled = useRef(false);
  const latest = useLatest({ dirty, current, offer, key });

  useEffect(() => {
    // While a previous draft is offered, nothing is written over it
    if (offer) return;
    const timer = window.setTimeout(() => {
      if (dirty) recipeDrafts.keep(key, current);
      else recipeDrafts.discard(key);
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [offer, dirty, current, key, recipeDrafts]);

  // Closing the editor (back button, close, cancel) keeps the very last changes
  useEffect(
    () => () => {
      const { dirty: changed, current: last, offer: pending, key: k } = latest.current;
      if (!settled.current && !pending && changed) recipeDrafts.keep(k, last);
    },
    [latest, recipeDrafts]
  );

  // Leaving the page (reload, closing the tab) with unsaved changes asks first
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return {
    dirty,
    offer,
    /** The chef takes the previous draft back (the caller puts it in the form) */
    acceptOffer: () => {
      const restored = offer;
      setOffer(null);
      return restored?.recipe ?? null;
    },
    declineOffer: () => {
      recipeDrafts.discard(key);
      setOffer(null);
    },
    /** After a successful save, or when the chef abandons the changes */
    discard: () => {
      settled.current = true;
      recipeDrafts.discard(key);
    },
  };
}
