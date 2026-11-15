import React, { useEffect, useRef, useState } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { ModalShell } from '@/shared/ui/ModalShell';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { useLanguage } from '@/app/providers/LanguageContext';

export interface GroceryListChoice {
  id: string;
  name: string;
  /** Items not checked off yet, computed by the caller on the full list. */
  remainingCount: number;
}

interface GroceryListChooserModalProps {
  open: boolean;
  onClose: () => void;
  /** Existing lists to choose from (already mapped to display data by the caller). */
  lists: GroceryListChoice[];
  /**
   * Called once a choice is made: an existing list (`listId`, `newListName` null) or a
   * brand new one (`listId` null, `newListName` trimmed, caller creates it).
   */
  onChoose: (listId: string | null, newListName: string | null) => void;
  title: string;
}

/**
 * "Which shopping list?" chooser, shown by the entry points that add items when the user
 * keeps several named lists. Purely presentational: it knows no store and only reports the
 * choice through `onChoose`; the caller performs the add (or the creation, then the add).
 */
export const GroceryListChooserModal: React.FC<GroceryListChooserModalProps> = ({
  open,
  onClose,
  lists,
  onChoose,
  title,
}) => {
  const { t } = useLanguage();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const firstListRef = useRef<HTMLButtonElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // Fresh state at each opening: the name lives only while the window stays open.
  const resetAndClose = () => {
    setCreating(false);
    setNewName('');
    onClose();
  };

  const choose = (listId: string | null, newListName: string | null) => {
    setCreating(false);
    setNewName('');
    onChoose(listId, newListName);
  };

  useCloseOnBack(open, resetAndClose);

  // Keyboard entry point: the first list, or the name input once the creation form is open.
  useEffect(() => {
    if (!open) return;
    const target = creating ? nameInputRef.current : firstListRef.current;
    target?.focus();
  }, [open, creating]);

  if (!open) return null;

  const trimmedName = newName.trim();

  const submitNewList = () => {
    if (!trimmedName) return;
    choose(null, trimmedName);
  };

  return (
    <ModalShell mobile="bottom" onDismiss={resetAndClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl border border-line shadow-2xl text-ink"
      >
        <div className="p-4 sm:p-5 border-b border-line">
          <h2 className="text-base font-extrabold text-ink flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-brand-text shrink-0" aria-hidden="true" />
            <span>{title}</span>
          </h2>
        </div>

        <div className="p-2 sm:p-3 max-h-[60vh] overflow-y-auto">
          <ul className="space-y-1">
            {lists.map((list, index) => (
              <li key={list.id}>
                <button
                  type="button"
                  ref={index === 0 ? firstListRef : undefined}
                  onClick={() => choose(list.id, null)}
                  className="w-full min-h-[44px] flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-start transition hover:bg-brand/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <span className="font-semibold text-sm truncate">{list.name}</span>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {t.chooseListRemaining.replace('{n}', String(list.remainingCount))}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {creating ? (
            <form
              className="mt-2 flex items-center gap-2 p-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitNewList();
              }}
            >
              <input
                ref={nameInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t.chooseListNamePlaceholder}
                aria-label={t.chooseListNamePlaceholder}
                maxLength={60}
                className="flex-1 min-w-0 min-h-[44px] px-3 rounded-xl bg-card border border-line text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="submit"
                disabled={!trimmedName}
                className="shrink-0 min-h-[44px] px-4 rounded-xl bg-brand text-on-brand text-sm font-bold disabled:opacity-40 disabled:pointer-events-none hover:bg-brand-strong transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {t.chooseListCreate}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="mt-1 w-full min-h-[44px] flex items-center gap-2 px-3 py-2.5 rounded-xl text-start text-brand-text font-semibold text-sm transition hover:bg-brand/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.chooseListNewList}</span>
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
};
