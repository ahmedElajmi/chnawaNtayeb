import React, { useEffect, useRef, useState } from 'react';
import { Check, ShoppingBasket } from 'lucide-react';

interface AddToCartButtonProps {
  /** Accessible name of the action ("add <ingredient> to the shopping list") */
  label: string;
  /** Silent announcement (sr-only, live region) once the ingredient has been added */
  addedLabel: string;
  /**
   * Starts the add; the target list may be asked through a chooser before the item really
   * lands somewhere. `onDone` is called once the ingredient has been added (or never, when
   * the user gave up) — the transient confirmation shows only then.
   */
  onAdd: (onDone: () => void) => void;
}

/**
 * Small trailing action of a fridge ingredient card: adds the ingredient to the shopping
 * list. Fully separate from the fridge toggle (own button, own click handling) and shows a
 * brief confirmation (~1.5 s) once the add has actually completed.
 */
export const AddToCartButton: React.FC<AddToCartButtonProps> = ({ label, addedLabel, onAdd }) => {
  const [added, setAdded] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const showAdded = () => {
    setAdded(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setAdded(false), 1500);
  };

  const handleClick = () => {
    onAdd(showAdded);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        className={`flex w-10 shrink-0 items-center justify-center rounded-e-xl border-s border-slate-200/70 dark:border-slate-700/70 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          added
            ? 'bg-brand/15 text-brand-text'
            : 'text-slate-500 dark:text-slate-400 hover:bg-brand/10 hover:text-brand-text'
        }`}
      >
        {added ? (
          <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
        ) : (
          <ShoppingBasket className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
      <span role="status" className="sr-only">
        {added ? addedLabel : ''}
      </span>
    </>
  );
};
