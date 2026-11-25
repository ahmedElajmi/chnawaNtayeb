import { BookOpen, Refrigerator } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '@/app/providers/LanguageContext';
import { PATHS, type RecipeListPath } from '@/shared/paths';
import { useRecipesHref } from '../filterMemory';
import { LinkTabs, type LinkTabItem } from '@/shared/ui/LinkTabs';
import type { LinkComponent } from '@/shared/ui/linkComponent';

/**
 * Adapter of the React Router consumer (lot 2.6.2, A-6): `LinkTabs` passes `href`, the router link
 * expects `to`. The adapter lives in the consumer module — the shared component never imports the
 * router.
 */
const RouterLinkAdapter: LinkComponent = ({ href, className, children, 'aria-current': ariaCurrent, replace }) => (
  <Link to={href} replace={replace} className={className} aria-current={ariaCurrent}>
    {children}
  </Link>
);

interface RecipeListTabsProps {
  active: RecipeListPath;
  catalogCount: number;
  /** Null when the fridge is empty: the tab invites to fill it instead of showing a count */
  suggestionsCount: number | null;
}

/** Switch between the whole catalog and the fridge suggestions, keeping the filters. */
export function RecipeListTabs({ active, catalogCount, suggestionsCount }: RecipeListTabsProps) {
  const { t } = useLanguage();
  const catalogHref = useRecipesHref(PATHS.recipes);
  const suggestionsHref = useRecipesHref(PATHS.suggestions);

  const tabs: LinkTabItem[] = [
    {
      href: catalogHref(),
      label: t.recipesAllTab,
      count: catalogCount,
      icon: BookOpen,
      active: PATHS.recipes === active,
    },
    {
      href: suggestionsHref(),
      label: t.recipesSuggestionsTab,
      count: suggestionsCount,
      hint: t.fillFridgeHint,
      icon: Refrigerator,
      active: PATHS.suggestions === active,
    },
  ];

  return <LinkTabs items={tabs} ariaLabel={t.navRecipes} linkComponent={RouterLinkAdapter} replace />;
}
