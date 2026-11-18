import { useState } from 'react';
import type { BrandConfig } from '@/app/brand';

interface BrandMarkProps {
  /** Identity already resolved by the caller (transitional config today, CMS tomorrow). */
  brand: BrandConfig;
  /** Optional derja tagline before the signature (editorial text, transitional default). */
  tagline?: string;
  /** Click target (header brand button, footer link…) — pass undefined for a plain element. */
  onClick?: () => void;
  /** Extra classes for the symbol image (size variants per consumer). */
  markClass?: string;
}

/**
 * Brand lockup from a resolved identity: symbol + wordmark + signature.
 *
 * Fallbacks (lot 2.6.1 dossier § 7.3 bis):
 * - the symbol image fails to load → text-only lockup (anomaly traced in dev);
 * - no wordmark → symbol only, never an invented name;
 * - no symbol and no wordmark → neutral (nothing rendered);
 * - partial identity → only the available elements.
 * The helper texts are never hardcoded: everything comes from the identity.
 */
export function BrandMark({ brand, tagline, onClick, markClass }: BrandMarkProps) {
  const [markBroken, setMarkBroken] = useState(false);

  const hasMark = !!brand.markSrc && !markBroken;
  const hasWordmark = !!brand.wordmark;
  if (!hasMark && !hasWordmark) return null; // neutral: never invent or reintroduce

  const content = (
    <>
      {hasMark && (
        <img
          src={brand.markSrc}
          alt=""
          width={94}
          height={40}
          className={`h-8 sm:h-10 w-auto shrink-0 drop-shadow-sm transition-transform group-hover:scale-105 ${markClass ?? ''}`}
          onError={() => {
            setMarkBroken(true);
            if (import.meta.env.DEV) console.warn('[brand] mark image failed to load:', brand.markSrc);
          }}
        />
      )}
      {hasWordmark && (
        <div className="flex flex-col min-w-0">
          <span className="font-display text-[15px] min-[360px]:text-base sm:text-xl font-extrabold tracking-tight text-ink truncate">
            {brand.wordmark}
          </span>
          {brand.signature && (
            <span className="text-[10px] text-accent-text font-bold tracking-wide -mt-0.5 truncate">
              {tagline && <span className="hidden sm:inline">{tagline} · </span>}
              {brand.signature}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (!onClick) return <div className="flex items-center gap-2 sm:gap-2.5 group min-w-0">{content}</div>;
  return (
    <button onClick={onClick} className="flex min-h-[44px] items-center gap-2 sm:gap-2.5 py-1 text-left group min-w-0">
      {content}
    </button>
  );
}
