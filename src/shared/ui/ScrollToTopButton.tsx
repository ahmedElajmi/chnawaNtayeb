import { ArrowUp } from 'lucide-react';
import { useScrolledPast } from '@/shared/hooks/useScrolledPast';

interface ScrollToTopButtonProps {
  label: string;
  /** Lifted above a sticky bar at the bottom of the screen (fridge selection) */
  raised?: boolean;
}

/** Round button that appears after scrolling down and brings the page back to the top. */
export function ScrollToTopButton({ label, raised = false }: ScrollToTopButtonProps) {
  const visible = useScrolledPast();

  const scrollUp = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollUp}
      aria-label={label}
      title={label}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed z-40 end-4 md:end-6 ${raised ? 'bottom-44 md:bottom-28' : 'bottom-24 md:bottom-8'} w-11 h-11 rounded-full bg-brand text-on-brand shadow-lg shadow-brand/30 ring-1 ring-white/20 flex items-center justify-center hover:bg-brand-strong active:scale-90 transition-all duration-300 motion-reduce:transition-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.5]" />
    </button>
  );
}
