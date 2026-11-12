import React, { useEffect, useRef } from 'react';
import { useLatest } from '@/shared/hooks/useLatest';
import type { PagedList } from '@/shared/hooks/usePagedList';

interface ShowMoreProps {
  list: Pick<PagedList<unknown>, 'visible' | 'total' | 'hasMore' | 'showMore'>;
  /** "{shown} / {total}" sentence, already in the right language */
  progressLabel: (shown: number, total: number) => string;
  buttonLabel: string;
}

/**
 * End of a progressively rendered list: "24 of 312" and a "show more" button. The next page
 * also loads by itself when the end of the list scrolls into view (the button stays for
 * keyboards and old browsers).
 */
export const ShowMore: React.FC<ShowMoreProps> = ({ list, progressLabel, buttonLabel }) => {
  const sentinel = useRef<HTMLDivElement>(null);
  const showMore = useLatest(list.showMore);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !list.hasMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && showMore.current(), {
      rootMargin: '400px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [list.hasMore, list.visible.length, showMore]);

  if (list.total <= list.visible.length && !list.hasMore) return null;
  return (
    <div ref={sentinel} className="flex flex-col items-center gap-2 py-4">
      <p className="text-[11px] text-ink-muted" aria-live="polite">
        {progressLabel(list.visible.length, list.total)}
      </p>
      {list.hasMore && (
        <button
          type="button"
          onClick={list.showMore}
          className="px-4 py-2 rounded-xl border border-line bg-card text-xs font-bold text-ink hover:border-brand"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
};
