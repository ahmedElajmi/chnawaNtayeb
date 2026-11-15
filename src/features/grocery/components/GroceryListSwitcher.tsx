import React, { useState } from 'react';
import { Plus, Pencil, Copy, Trash2, Check, X } from 'lucide-react';
import type { GroceryList } from '@/core/grocery';
import { useLanguage } from '@/app/providers/LanguageContext';

interface GroceryListSwitcherProps {
  /** All the named shopping lists of the kitchen */
  lists: GroceryList[];
  /** Id of the list shown on screen */
  activeListId: string;
  onSwitch: (id: string) => void;
  /** Creates a list and activates it */
  onCreate: (name: string) => void;
  /** Renames the active list */
  onRename: (name: string) => void;
  /** Duplicates the active list (auto name, unchecked copy) */
  onDuplicate: () => void;
  /** Deletes the active list (the caller forbids deleting the last one) */
  onDelete: () => void;
}

/**
 * Switcher of the named shopping lists: one chip per list (with the count of items still
 * to buy), plus the actions on the active list — new, rename, duplicate, delete. The
 * chips scroll horizontally so any number of lists fits, even at 320 px.
 */
export const GroceryListSwitcher: React.FC<GroceryListSwitcherProps> = ({
  lists,
  activeListId,
  onSwitch,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
}) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'idle' | 'creating' | 'renaming'>('idle');
  const [nameDraft, setNameDraft] = useState('');

  const activeList = lists.find((list) => list.id === activeListId) ?? lists[0];
  const canDelete = lists.length > 1;
  const closeEditor = () => {
    setMode('idle');
    setNameDraft('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameDraft.trim();
    if (!name) return;
    if (mode === 'creating') onCreate(name);
    else if (mode === 'renaming') onRename(name);
    closeEditor();
  };

  const remainingLabel = (list: GroceryList) =>
    t.listsRemaining.replace('{n}', String(list.items.filter((item) => !item.is_checked).length));

  return (
    <div className="rounded-2xl bg-card border border-line shadow-xs p-2.5 sm:p-3 space-y-2">
      {/* One chip per list: tap to switch; the active one is highlighted */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" aria-label={t.listsSwitchLabel} role="tablist">
        {lists.map((list) => {
          const active = list.id === activeListId;
          const remaining = remainingLabel(list);
          return (
            <button
              key={list.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                onSwitch(list.id);
                closeEditor();
              }}
              title={remaining}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-full text-xs sm:text-sm font-bold border transition active:scale-95 ${
                active
                  ? 'bg-brand text-on-brand border-brand shadow-sm'
                  : 'bg-surface text-ink border-slate-200 dark:border-slate-700 hover:border-brand'
              }`}
            >
              <span className="max-w-[9rem] truncate">{list.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  active ? 'bg-black/15 text-on-brand' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {remaining}
              </span>
            </button>
          );
        })}
      </div>

      {/* Inline editor of the list name (create or rename), else the actions row */}
      {mode !== 'idle' ? (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            autoFocus
            placeholder={mode === 'creating' ? t.listEditorNewPlaceholder : t.listEditorNameLabel}
            aria-label={t.listEditorNameLabel}
            className="flex-1 min-w-[8rem] px-3 py-2 min-h-[40px] rounded-xl bg-surface border border-slate-200 dark:border-slate-700 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={!nameDraft.trim()}
            className="inline-flex items-center gap-1 px-3.5 min-h-[40px] rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-bold hover:bg-brand-strong transition shadow-sm active:scale-95 disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            <span>{mode === 'creating' ? t.listEditorCreate : t.listEditorSave}</span>
          </button>
          <button
            type="button"
            onClick={closeEditor}
            aria-label={t.listEditorCancel}
            className="inline-flex items-center gap-1 px-3 min-h-[40px] rounded-xl bg-card border border-slate-300 dark:border-slate-600 text-ink text-xs sm:text-sm font-semibold hover:border-brand transition active:scale-95"
          >
            <X className="w-4 h-4" />
            <span>{t.listEditorCancel}</span>
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setNameDraft('');
              setMode('creating');
            }}
            className="inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-xl text-xs sm:text-sm font-bold text-brand-text hover:bg-slate-50 dark:hover:bg-slate-700/50 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.listsNew}</span>
          </button>
          {activeList && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setNameDraft(activeList.name);
                  setMode('renaming');
                }}
                aria-label={t.listsRename}
                title={t.listsRename}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onDuplicate}
                aria-label={t.listsDuplicate}
                title={t.listsDuplicate}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t.listsDeleteConfirm.replace('{name}', activeList.name))) onDelete();
                  }}
                  aria-label={t.listsDelete}
                  title={t.listsDelete}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
