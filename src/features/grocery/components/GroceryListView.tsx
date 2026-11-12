import React, { useState } from 'react';
import { ShoppingBag, Check, Plus, Trash2, Share2 } from 'lucide-react';
import { GroceryItem } from '@/core/grocery';
import type { Ingredient } from '@/core/catalog';
import { IngredientThumb } from '@/shared/ui/IngredientThumb';
import { useLanguage } from '@/app/providers/LanguageContext';

interface GroceryListViewProps {
  items: GroceryItem[];
  /** Catalog ingredients, to show the picture of the items that come from a recipe */
  ingredientsById: ReadonlyMap<string, Ingredient>;
  onToggleItem: (id: string) => void;
  onAddItem: (name: string, quantity?: number, unit?: string) => void;
  onClearChecked: () => void;
}

export const GroceryListView: React.FC<GroceryListViewProps> = ({
  items,
  ingredientsById,
  onToggleItem,
  onAddItem,
  onClearChecked,
}) => {
  const { t } = useLanguage();
  const [newItemName, setNewItemName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAddItem(newItemName.trim(), 1, 'pièce');
    setNewItemName('');
  };

  const handleShareWhatsApp = () => {
    const unbought = items.filter((i) => !i.is_checked);
    if (unbought.length === 0) return;

    const listText = unbought.map((i) => `☐ ${i.name} (${i.quantity} ${i.unit})`).join('\n');

    const msg = `🛒 *Liste de Courses Qadhya (Chnowa Ntayeb)* :\n\n${listText}\n\n📱 Envoyé depuis Chnowa Ntayeb (by Chef Souhed) 🇹🇳`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
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

  const pendingItems = items.filter((i) => !i.is_checked);
  const checkedItems = items.filter((i) => i.is_checked);

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

            {checkedItems.length > 0 && (
              <button
                onClick={onClearChecked}
                className="p-2 rounded-xl text-slate-400 hover:text-accent-text hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                title={t.clearChecked}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={t.addManualItem}
          className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand shadow-xs"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-bold hover:bg-brand-strong transition flex items-center gap-1 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addBtn}</span>
        </button>
      </form>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="p-8 rounded-2xl bg-card border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
          <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.emptyGrocery}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.itemsToBuy} ({pendingItems.length})
              </span>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/80 rounded-2xl bg-card border border-line overflow-hidden shadow-xs">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onToggleItem(item.id)}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0" />
                      {thumb(item)}
                      <span className="text-xs sm:text-sm font-semibold text-ink truncate">{item.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium shrink-0">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checked Items */}
          {checkedItems.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t.itemsBought} ({checkedItems.length})
              </span>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/80 rounded-2xl bg-card border border-line overflow-hidden shadow-xs opacity-75">
                {checkedItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onToggleItem(item.id)}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-brand text-on-brand flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="inline-flex shrink-0 grayscale opacity-70">{thumb(item)}</span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-400 line-through truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 line-through shrink-0">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
