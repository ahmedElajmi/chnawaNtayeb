import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingBag,
  Check,
  Plus,
  Minus,
  Trash2,
  Share2,
  Printer,
  Archive,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  GroceryItem,
  GroceryList,
  buildGroceryShareText,
  createGroceryHistoryEntry,
  groupByAisle,
  groceryCost,
} from '@/core/grocery';
import { getCompatibleUnits, getUnitFamily } from '@/core/units';
import type { Ingredient } from '@/core/catalog';
import { IngredientThumb } from '@/shared/ui/IngredientThumb';
import { UnitInfo } from '@/shared/ui/UnitInfo';
import { GroceryIngredientPicker } from '@/features/grocery/components/GroceryIngredientPicker';
import { GroceryListSwitcher } from '@/features/grocery/components/GroceryListSwitcher';
import { PrintSheet, printNow } from '@/shared/ui/print';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useAccountProfile, useContainer } from '@/app/ContainerContext';
import { formatPriceRange } from '@/shared/i18n/formatPrice';
import { useCategoryNames } from '@/shared/i18n/useCategoryNames';

interface GroceryListViewProps {
  /** All the named shopping lists; the screen shows the active one */
  lists: GroceryList[];
  /** The list currently displayed (items, note, spend) */
  activeList: GroceryList;
  /** Catalog ingredients, to show the picture of the items that come from a recipe */
  ingredientsById: ReadonlyMap<string, Ingredient>;
  /** Whole catalog, for the ingredient picker of the add form */
  ingredients: Ingredient[];
  onSwitchList: (id: string) => void;
  onCreateList: (name: string) => void;
  /** Renames the active list */
  onRenameList: (name: string) => void;
  /** Duplicates the active list (auto name, unchecked copy) */
  onDuplicateList: () => void;
  /** Deletes the active list */
  onDeleteList: () => void;
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onSetQuantity: (id: string, quantity: number) => void;
  /** Switches one item to another unit of the same family (g -> kg...) */
  onSetUnit: (id: string, unit: string) => void;
  /** Adds one catalog ingredient with its default unit */
  onAddIngredient: (ingredient: Ingredient) => void;
  /** Adds one free-text article with the unit chosen in the picker */
  onAddCustom: (name: string, unit: string) => void;
  onSetNote: (note: string) => void;
  onSetSpent: (spent: number | null) => void;
  onClearList: () => void;
}

type Feedback = { kind: 'success' | 'warn' | 'error'; text: string };

interface GroceryRowProps {
  item: GroceryItem;
  thumb: React.ReactNode;
  quantityLabel: string;
  deleteLabel: string;
  unitSelectLabel: string;
  onToggle: () => void;
  onRemove: () => void;
  onSetQuantity: (quantity: number) => void;
  onSetUnit: (unit: string) => void;
}

/** One list row: checkbox, picture, name, light quantity stepper, unit and a per-item delete. */
function GroceryRow({
  item,
  thumb,
  quantityLabel,
  deleteLabel,
  unitSelectLabel,
  onToggle,
  onRemove,
  onSetQuantity,
  onSetUnit,
}: GroceryRowProps) {
  const [draft, setDraft] = useState({ value: String(item.quantity), source: item.quantity });
  // Follows external changes (list regeneration, sync) without clobbering an ongoing edit —
  // the documented render-time adjustment: state resets only when the stored quantity moved
  if (draft.source !== item.quantity) {
    setDraft({ value: String(item.quantity), source: item.quantity });
  }
  const quantity = draft.value;
  const setQuantity = (value: string) => setDraft({ value, source: item.quantity });

  const commit = () => {
    const parsed = Number(quantity.replace(',', '.'));
    if (Number.isFinite(parsed) && parsed >= 0 && parsed !== item.quantity) onSetQuantity(parsed);
    else setQuantity(String(item.quantity));
  };

  // Finer steps for the small quantities (spices, 0.5 kg...)
  const step = (direction: number) => {
    const delta = item.quantity < 1 ? 0.5 : 1;
    const next = Math.max(0, Math.round((item.quantity + direction * delta) * 100) / 100);
    setQuantity(String(next));
    onSetQuantity(next);
  };

  // Unit switcher: only for mass and volume units with several aliases (g, kg, gr / ml, cl, dl, l).
  // Counted things and raw units (pièce, botte, c.à.s...) never offer a switch.
  const unitOptions = useMemo(() => {
    const compatible = getCompatibleUnits(item.unit);
    return compatible.includes(item.unit) ? compatible : [item.unit, ...compatible];
  }, [item.unit]);
  const canSwitchUnit = unitOptions.length > 1 && getUnitFamily(item.unit) !== 'count';

  return (
    <div
      onClick={onToggle}
      className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition select-none"
    >
      <div
        className={`w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition ${
          item.is_checked ? 'bg-brand border-brand text-on-brand' : 'border-slate-300 dark:border-slate-600'
        }`}
      >
        {item.is_checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </div>
      <span className={item.is_checked ? 'inline-flex shrink-0 grayscale opacity-70' : 'shrink-0'}>{thumb}</span>
      <span
        className={`text-xs sm:text-sm font-semibold truncate min-w-0 flex-1 ${
          item.is_checked ? 'text-slate-400 line-through' : 'text-ink'
        }`}
      >
        {item.name}
      </span>
      {/* Quantity stepper: stops the row click so editing never toggles the item */}
      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => step(-1)}
          aria-label={`${quantityLabel} −`}
          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition"
        >
          <Minus className="w-3 h-3" />
        </button>
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          inputMode="decimal"
          aria-label={quantityLabel}
          className="w-10 px-1 py-1 text-center text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 text-ink focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button
          onClick={() => step(1)}
          aria-label={`${quantityLabel} +`}
          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition"
        >
          <Plus className="w-3 h-3" />
        </button>
        {/* Unit label, switchable within the same family (g -> kg, ml -> l...); counted
            things (pièce, botte...) and raw units stay a plain label */}
        {canSwitchUnit ? (
          <select
            value={item.unit}
            onChange={(e) => onSetUnit(e.target.value)}
            aria-label={unitSelectLabel}
            className="h-7 ps-1.5 pe-0.5 text-xs font-semibold rounded-lg bg-card border border-slate-200 dark:border-slate-700 text-ink focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {unitOptions.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        ) : (
          <UnitInfo unit={item.unit} className="text-xs font-semibold text-slate-500 min-w-7 text-center" />
        )}
      </div>
      {/* Per-item delete: distinct from "bought" */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={deleteLabel}
        title={deleteLabel}
        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export const GroceryListView: React.FC<GroceryListViewProps> = ({
  lists,
  activeList,
  ingredientsById,
  ingredients,
  onSwitchList,
  onCreateList,
  onRenameList,
  onDuplicateList,
  onDeleteList,
  onToggleItem,
  onRemoveItem,
  onSetQuantity,
  onSetUnit,
  onAddIngredient,
  onAddCustom,
  onSetNote,
  onSetSpent,
  onClearList,
}) => {
  const { items, note } = activeList;
  const spent = activeList.spent_tnd;
  const { t } = useLanguage();
  const { groceryHistory } = useContainer();
  const { profile } = useAccountProfile();
  const categoryNames = useCategoryNames('ingredient');

  const [noteDraft, setNoteDraft] = useState(note);
  const [spentDraft, setSpentDraft] = useState(spent === null ? '' : String(spent));
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [doneDismissed, setDoneDismissed] = useState(false);
  const [printing, setPrinting] = useState(false);

  // The store is the source of truth: the drafts follow external changes (archive, sync...)
  const [noteSource, setNoteSource] = useState(note);
  if (noteSource !== note) {
    setNoteSource(note);
    setNoteDraft(note);
  }
  const spentText = spent === null ? '' : String(spent);
  const [spentSource, setSpentSource] = useState(spentText);
  if (spentSource !== spentText) {
    setSpentSource(spentText);
    setSpentDraft(spentText);
  }

  const groups = useMemo(() => groupByAisle(items), [items]);
  const plannedCost = useMemo(() => groceryCost(items, ingredientsById), [items, ingredientsById]);

  const allChecked = items.length > 0 && items.every((i) => i.is_checked);
  const showDoneBanner = allChecked && !doneDismissed;

  // Print: the sheet renders first, then the native dialog opens once it is on screen
  useEffect(() => {
    if (!printing) return;
    const timer = window.setTimeout(() => {
      printNow();
      setPrinting(false);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [printing]);

  const showFeedback = (next: Feedback, autoHide = false) => {
    setFeedback(next);
    if (autoHide) window.setTimeout(() => setFeedback((f) => (f === next ? null : f)), 4000);
  };

  const commitNote = () => {
    const trimmed = noteDraft.trim();
    if (trimmed !== note.trim()) onSetNote(trimmed);
    if (noteDraft !== trimmed) setNoteDraft(trimmed);
  };

  const commitSpent = () => {
    const parsed = Number(spentDraft.replace(',', '.'));
    const next = spentDraft.trim() === '' || !Number.isFinite(parsed) || parsed < 0 ? null : parsed;
    if (next !== spent) onSetSpent(next);
  };

  const handleShareWhatsApp = () => {
    if (items.length === 0) return;
    const listText = buildGroceryShareText(groups, { title: t.groceryTitle, comment: note.trim() || undefined });
    const msg = `${listText}\n\n📱 ${t.shareSentFrom} Chnowa Ntayeb (by Chef Souhed) 🇹🇳`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  /** Archives the current list in the history, then empties it. Failure keeps everything intact. */
  const archiveList = async (closeWeek: boolean) => {
    if (items.length === 0 || archiving) return;
    // Guests have no server history: hint them instead of a doomed request
    if (!profile) {
      showFeedback({ kind: 'warn', text: t.grocerySignInHint });
      return;
    }
    if (!window.confirm(t.groceryArchiveConfirm)) return;

    const entry = createGroceryHistoryEntry({
      items,
      comment: note.trim() || undefined,
      planned_cost_min: plannedCost.min,
      planned_cost_max: plannedCost.max,
      spent_tnd: spent ?? undefined,
    });
    if (!entry) {
      showFeedback({ kind: 'error', text: t.groceryArchiveError });
      return;
    }

    setArchiving(true);
    try {
      await groceryHistory.save(entry);
      onClearList();
      setDoneDismissed(true);
      showFeedback({ kind: 'success', text: closeWeek ? t.groceryWeekClosed : t.groceryArchived }, closeWeek);
    } catch {
      showFeedback({ kind: 'error', text: t.groceryArchiveError });
    } finally {
      setArchiving(false);
    }
  };

  const handleDeleteAll = () => {
    if (items.length === 0) return;
    if (!window.confirm(t.groceryDeleteAllConfirm.replace('{n}', String(items.length)))) return;
    onClearList();
    showFeedback({ kind: 'success', text: t.emptyGrocery }, true);
  };

  // Aisle heading in the current language, with the icon of the category
  const aisleHeading = (categoryId: string) => {
    const category = categoryNames.tree.byId.get(categoryId)?.category;
    const label = categoryNames.name(categoryId) || categoryId;
    return `${category?.icon ?? '🛍️'} ${label}`;
  };

  // Catalog items show the ingredient picture; free items a neutral bag
  const thumb = (item: GroceryItem) => {
    const ing = item.ingredient_id ? ingredientsById.get(item.ingredient_id) : undefined;
    return ing ? (
      <IngredientThumb ingredient={ing} size="sm" />
    ) : (
      <IngredientThumb ingredient={{ category: item.category ?? 'other', icon: '🛍️' }} size="sm" />
    );
  };

  // Colour of the "real vs planned" comparison: within the low estimate, within the range, over
  const spendTone =
    spent === null
      ? null
      : spent <= plannedCost.min
        ? 'text-emerald-600 dark:text-emerald-400'
        : spent <= plannedCost.max
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-line shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-ink flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-accent-text" />
            <span>{t.groceryTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.grocerySubtitle}</p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] text-white text-xs sm:text-sm font-bold hover:brightness-105 shadow-sm active:scale-95 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setPrinting(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-slate-300 dark:border-slate-600 text-ink text-xs sm:text-sm font-semibold hover:border-brand transition shadow-xs active:scale-95"
            >
              <Printer className="w-4 h-4 text-accent-text" />
              <span>{t.groceryPrint}</span>
            </button>
          </div>
        )}
      </div>

      {/* Switcher of the named shopping lists (chips + actions on the active one) */}
      <GroceryListSwitcher
        lists={lists}
        activeListId={activeList.id}
        onSwitch={onSwitchList}
        onCreate={onCreateList}
        onRename={onRenameList}
        onDuplicate={onDuplicateList}
        onDelete={onDeleteList}
      />

      {/* Add form: catalog search grouped by aisle, custom articles with a chosen unit */}
      <GroceryIngredientPicker
        ingredients={ingredients}
        listItems={items}
        onAddIngredient={onAddIngredient}
        onAddCustom={onAddCustom}
      />

      {/* List note (feeds the sync push): committed on blur, not per keystroke */}
      {items.length > 0 && (
        <input
          type="text"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={commitNote}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          placeholder={t.groceryNote}
          className="w-full px-4 py-2.5 rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand shadow-xs"
        />
      )}

      {/* Feedback banner (archive result, sign-in hint...) */}
      {feedback && (
        <div
          role="status"
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            feedback.kind === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
              : feedback.kind === 'warn'
                ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
          }`}
        >
          {feedback.kind === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* List completed: propose to close the week (archive + clear), never auto-clear */}
      {showDoneBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {t.groceryListDone}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => archiveList(true)}
              disabled={archiving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-bold hover:bg-brand-strong transition shadow-sm active:scale-95 disabled:opacity-60"
            >
              <Archive className="w-4 h-4" />
              <span>{t.groceryCloseWeek}</span>
            </button>
            <button
              onClick={() => setDoneDismissed(true)}
              className="px-3.5 py-2 rounded-xl bg-card border border-slate-300 dark:border-slate-600 text-ink text-xs sm:text-sm font-semibold hover:border-brand transition active:scale-95"
            >
              {t.groceryContinueEditing}
            </button>
          </div>
        </div>
      )}

      {/* Aisle-grouped list, ordered as a store walk */}
      {items.length === 0 ? (
        <div className="p-8 rounded-2xl bg-card border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
          <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.emptyGrocery}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.category} className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                {aisleHeading(group.category)}
                <span className="text-slate-400 font-medium normal-case">({group.items.length})</span>
              </span>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/80 rounded-2xl bg-card border border-line overflow-hidden shadow-xs">
                {group.items.map((item) => (
                  <GroceryRow
                    key={item.id}
                    item={item}
                    thumb={thumb(item)}
                    quantityLabel={t.groceryQuantity}
                    deleteLabel={t.groceryDeleteItem}
                    unitSelectLabel={t.groceryUnitSelectLabel.replace('{name}', item.name)}
                    onToggle={() => onToggleItem(item.id)}
                    onRemove={() => onRemoveItem(item.id)}
                    onSetQuantity={(quantity) => onSetQuantity(item.id, quantity)}
                    onSetUnit={(unit) => onSetUnit(item.id, unit)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget: planned range vs amount actually spent */}
      {items.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-line shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-ink flex items-center gap-1.5">
              💰 {t.groceryPlanned}
            </span>
            <span className="text-sm font-extrabold text-brand-text">{formatPriceRange(plannedCost, t.currency)}</span>
          </div>
          <input
            type="text"
            value={spentDraft}
            onChange={(e) => setSpentDraft(e.target.value)}
            onBlur={commitSpent}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            inputMode="decimal"
            placeholder={t.grocerySpentPlaceholder}
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-slate-200 dark:border-slate-700 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {spent !== null && (
            <p className={`text-xs font-bold ${spendTone ?? ''}`}>
              {t.groceryPlanned}: {formatPriceRange(plannedCost, t.currency)} · {t.groceryReal}: {spent} {t.currency}
            </p>
          )}
        </div>
      )}

      {/* Archive & delete-all (deletion is definitive, archiving is the way to keep a list) */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => archiveList(false)}
            disabled={archiving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-slate-300 dark:border-slate-600 text-ink text-xs sm:text-sm font-semibold hover:border-brand transition shadow-xs active:scale-95 disabled:opacity-60"
          >
            <Archive className="w-4 h-4 text-accent-text" />
            <span>{t.groceryArchive}</span>
          </button>
          <button
            onClick={handleDeleteAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t.groceryDeleteAll}</span>
          </button>
        </div>
      )}

      {/* Print sheet: mounted only while printing, hidden on screen, revealed on paper */}
      {printing && (
        <div className="fixed inset-0 hidden print:block bg-white">
          <PrintSheet
            title={t.groceryTitle}
            comment={note.trim() || undefined}
            labels={{ aislesHeading: t.groceryAisles }}
            groups={groups.map((group) => ({
              label: aisleHeading(group.category),
              items: group.items.map(({ name, quantity, unit, is_checked }) => ({
                name,
                quantity,
                unit,
                is_checked,
              })),
            }))}
            footer={t.appName}
          />
        </div>
      )}
    </div>
  );
};
