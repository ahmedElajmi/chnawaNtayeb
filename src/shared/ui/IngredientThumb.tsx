import { useState } from 'react';
import type { Ingredient } from '@/core/catalog';
import { CATEGORY_VISUALS } from './ingredientVisuals';

type ThumbSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZES: Record<ThumbSize, { box: string; emoji: string; radius: string }> = {
  xs: { box: 'w-5 h-5', emoji: 'text-[11px]', radius: 'rounded-full' },
  sm: { box: 'w-8 h-8', emoji: 'text-base', radius: 'rounded-lg' },
  md: { box: 'w-10 h-10 sm:w-11 sm:h-11', emoji: 'text-lg sm:text-xl', radius: 'rounded-xl' },
  lg: { box: 'w-20 h-20', emoji: 'text-4xl', radius: 'rounded-2xl' },
};

interface IngredientThumbProps {
  ingredient: Pick<Ingredient, 'category' | 'image_url' | 'icon'>;
  size?: ThumbSize;
  /** Forces a round shape (chips) */
  round?: boolean;
  className?: string;
}

/**
 * Picture of an ingredient: its photo when the chef set one, otherwise a soft
 * tile in the colour of its category with an emoji. A photo that fails to load
 * falls back to the tile, so both cases always take the same space.
 */
export function IngredientThumb({ ingredient, size = 'sm', round = false, className = '' }: IngredientThumbProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const s = SIZES[size];
  const radius = round ? 'rounded-full' : s.radius;
  const visual = CATEGORY_VISUALS[ingredient.category] ?? CATEGORY_VISUALS.other;
  const photo = ingredient.image_url && ingredient.image_url !== failedUrl ? ingredient.image_url : null;

  if (photo) {
    return (
      <span
        className={`${s.box} ${radius} inline-block shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/10 shadow-xs ${className}`}
      >
        <img
          src={photo}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(photo)}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${s.box} ${radius} shrink-0 inline-flex items-center justify-center bg-gradient-to-br ring-1 ${visual.tile} ${className}`}
    >
      <span className={`${s.emoji} leading-none select-none`}>{ingredient.icon || visual.emoji}</span>
    </span>
  );
}
