import React from 'react';
import { Link } from 'react-router';
import { ShoppingBasket } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useKitchen } from '@/app/ContainerContext';
import { PATHS } from '@/shared/paths';

/**
 * Header chip of the fridge page: how many items the shopping list holds, linking to /grocery.
 * Self-contained (reads the kitchen store itself) so the fridge page stays a thin shell.
 */
export const GroceryListChip: React.FC = () => {
  const { t } = useLanguage();
  const { groceryList } = useKitchen();
  const count = groceryList.length;

  return (
    <Link
      to={PATHS.grocery}
      aria-label={t.groceryBadgeLabel.replace('{count}', String(count))}
      className="shrink-0 inline-flex items-center gap-1.5 px-3 rounded-full bg-accent/10 text-accent-text border border-accent/40 text-xs font-bold min-h-[40px] hover:bg-accent/20 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <ShoppingBasket className="w-4 h-4" aria-hidden="true" />
      <span aria-hidden="true">{count}</span>
    </Link>
  );
};
