import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RailProps {
  /** i18n label of the carousel (aria-label of the group) */
  label: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Horizontal rail (D4): scrolls by item quantities, not by pixels; no carousel library.
 * Logical RTL: the scroll axis flips automatically in RTL; the arrows are decorative controls
 * (the rail itself stays scrollable by touch), hidden when the content fits.
 */
export const Rail: React.FC<RailProps> = ({ label, children, className = '' }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setOverflows(el.scrollWidth > el.clientWidth + 1);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const scrollByOne = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el || !el.firstElementChild) return;
    const step = el.firstElementChild.getBoundingClientRect().width + 12;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <div className={`relative ${className}`} role="group" aria-label={label}>
      {overflows && (
        <button
          type="button"
          onClick={() => scrollByOne(-1)}
          aria-label={label}
          className="absolute start-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-card/95 p-3 text-ink shadow-md ring-1 ring-line transition hover:bg-tint"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </button>
      )}
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
        tabIndex={0}
        onScroll={measure}
      >
        {children}
      </div>
      {overflows && (
        <button
          type="button"
          onClick={() => scrollByOne(1)}
          aria-label={label}
          className="absolute end-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-card/95 p-3 text-ink shadow-md ring-1 ring-line transition hover:bg-tint"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
