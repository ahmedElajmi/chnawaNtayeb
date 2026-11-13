import { useMemo } from 'react';
import type { Recipe } from '@/core/catalog';
import { useCatalog, useReview } from '@/app/ContainerContext';

/** Recipes as the team sees them: the work copies, then the recipes online that have none. */
export function useTeamRecipes(): Recipe[] {
  const { recipes: online } = useCatalog();
  const { entries } = useReview('recipe');
  return useMemo(() => {
    const inWorkspace = new Set(entries.map((e) => e.copy.id));
    return [...entries.map((e) => e.copy.content), ...online.filter((r) => !inWorkspace.has(r.id))];
  }, [entries, online]);
}
