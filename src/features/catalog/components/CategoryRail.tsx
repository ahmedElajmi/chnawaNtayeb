import React from 'react';
import { Rail } from '@/shared/ui/Rail';
import { renderInjectedLink, type LinkComponent } from '@/shared/ui/linkComponent';

export interface CategoryTileData {
  id: string;
  label: string;
  href: string;
  /** Photo of the category, absent = tint block with the initial (no broken link) */
  imageUrl?: string;
}

interface CategoryTileProps extends CategoryTileData {
  linkComponent?: LinkComponent;
}

/** One category tile: a real link (SPA via the injected link), photo or tint initial fallback. */
const CategoryTile: React.FC<CategoryTileProps> = ({ label, href, imageUrl, linkComponent }) =>
  renderInjectedLink({
    href,
    linkComponent,
    native: { style: { scrollSnapAlign: 'start' } },
    className:
      'flex w-24 shrink-0 flex-col items-center gap-1 rounded-2xl bg-card p-2 ring-1 ring-line transition hover:bg-tint',
    children: (
      <>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            width={64}
            height={64}
            loading="lazy"
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-tint font-display text-xl font-extrabold text-brand-text">
            {label.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <span className="w-full truncate text-center text-xs font-bold text-ink">{label}</span>
      </>
    ),
  });

interface CategoryRailProps {
  /** i18n label of the rail */
  label: string;
  items: CategoryTileData[];
  linkComponent?: LinkComponent;
  className?: string;
}

/**
 * Horizontal stall of categories (D4): tiles with photo or tint initial fallback, on the shared
 * `Rail`.
 */
export const CategoryRail: React.FC<CategoryRailProps> = ({ label, items, linkComponent, className = '' }) => (
  <Rail label={label} className={className}>
    {items.map((item) => (
      <CategoryTile key={item.id} {...item} linkComponent={linkComponent} />
    ))}
  </Rail>
);
