import { useMemo } from 'react';
import { queueCounts, type QueueEntry, type ReviewKind, type WorkflowDefinition } from '@/core/review';
import { expandCategories } from '@/core/categories';
import { useCategories, useReview } from '@/app/ContainerContext';

/** The review queue of every kind of content, its counts and the workflows to read it with. */
export function useReviewQueue() {
  const recipes = useReview('recipe');
  const ingredients = useReview('ingredient');
  const recipeTree = useCategories('recipe').tree;
  const ingredientTree = useCategories('ingredient').tree;
  return useMemo(() => {
    // Each item is grouped under its families (roots of its categories, ancestors included once)
    const families = (tree: typeof recipeTree, ids: readonly string[]) =>
      [...expandCategories(tree, ids)].filter((id) => tree.byId.get(id)?.depth === 1);
    const recipeCategories = new Map(recipes.entries.map((e) => [e.copy.id, e.copy.content.category_ids ?? []]));
    const ingredientCategories = new Map(ingredients.entries.map((e) => [e.copy.id, [e.copy.content.category]]));
    const entries: QueueEntry[] = [
      ...recipes.store
        .queue()
        .map((e) => ({ ...e, categories: families(recipeTree, recipeCategories.get(e.id) ?? []) })),
      ...ingredients.store
        .queue()
        .map((e) => ({ ...e, categories: families(ingredientTree, ingredientCategories.get(e.id) ?? []) })),
    ];
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
  }, [recipes.entries, ingredients.entries, recipes.workflow, ingredients.workflow, recipeTree, ingredientTree]);
}
