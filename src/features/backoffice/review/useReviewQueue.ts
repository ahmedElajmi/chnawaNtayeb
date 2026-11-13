import { useMemo } from 'react';
import { queueCounts, type QueueEntry, type ReviewKind, type WorkflowDefinition } from '@/core/review';
import { useReview } from '@/app/ContainerContext';

/** The review queue of every kind of content, its counts and the workflows to read it with. */
export function useReviewQueue() {
  const recipes = useReview('recipe');
  const ingredients = useReview('ingredient');
  return useMemo(() => {
    const entries: QueueEntry[] = [...recipes.store.queue(), ...ingredients.store.queue()];
    const workflows: Record<ReviewKind, WorkflowDefinition> = {
      recipe: recipes.workflow,
      ingredient: ingredients.workflow,
    };
    // Ready to publish = every required cell validated and something not online yet
    const publishable = [...recipes.entries, ...ingredients.entries].filter(
      (e) => e.snapshot.publishable && (e.pending || !e.online)
    ).length;
    return { entries, counts: { ...queueCounts(entries), publishable }, workflows };
    // The entries change with the stores' state
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes.entries, ingredients.entries, recipes.workflow, ingredients.workflow]);
}
