import React, { useState, useMemo } from 'react';
import { Search, Plus, Sparkles, Trash2, Check, ArrowRight, Package } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Ingredient, IngredientCategory } from '../types';
import { PhotoScannerModal } from './PhotoScannerModal';
import { STAPLE_INGREDIENT_IDS } from '../services/ingredientRoles';
import confetti from 'canvas-confetti';

interface FridgeSelectorProps {
  allIngredients: Ingredient[];
  selectedIds: string[];
  pantryIds: string[];
  onTogglePantry: (id: string) => void;
  usedIngredientIds: Set<string>;
  onToggleIngredient: (id: string) => void;
  onClearAll: () => void;
  onAddCustomIngredient: (name: string, category: IngredientCategory) => void;
  onSearchRecipes: () => void;
}

export const FridgeSelector: React.FC<FridgeSelectorProps> = ({
  allIngredients,
  selectedIds,
  pantryIds,
  onTogglePantry,
  usedIngredientIds,
  onToggleIngredient,
  onClearAll,
  onAddCustomIngredient,
  onSearchRecipes,
}) => {
  const { t, getIngredientName } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<IngredientCategory>('vegetables');
  const [showAddCustom, setShowAddCustom] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const pantrySet = useMemo(() => new Set(pantryIds), [pantryIds]);
  // Pantry candidates: usual staples + anything the user already put in the pantry
  const pantryCandidates = useMemo(
    () => allIngredients.filter((i) => STAPLE_INGREDIENT_IDS.has(i.id) || pantrySet.has(i.id)),
    [allIngredients, pantrySet]
  );

  const categories = [
    { id: 'all', label: t.filterAll },
    { id: 'vegetables', label: t.catVegetables },
    { id: 'dairy_eggs', label: t.catDairyEggs },
    { id: 'grains_pasta', label: t.catGrainsPasta },
    { id: 'spices_condiments', label: t.catSpicesCondiments },
    { id: 'meats', label: t.catMeats },
    { id: 'fish', label: t.catFish },
    { id: 'canned_pantry', label: t.catCannedPantry },
    { id: 'fruits', label: t.catFruits },
  ];

  const filteredIngredients = useMemo(() => {
    return allIngredients.filter((ing) => {
      // Category filter
      if (activeCategory !== 'all' && ing.category !== activeCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          ing.name_fr.toLowerCase().includes(q) ||
          ing.name_derja.toLowerCase().includes(q) ||
          ing.name_ar.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [allIngredients, activeCategory, searchQuery]);

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onAddCustomIngredient(customName.trim(), customCategory);
    setCustomName('');
    setShowAddCustom(false);
  };

  const handleTriggerSearch = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#2D5A27', '#C75128', '#D99B26'],
      });
    } catch {}
    onSearchRecipes();
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Controls & AI Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand transition shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Scan Button & Custom Ingredient Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-brand to-brand-strong text-white text-xs sm:text-sm font-bold shadow-md shadow-brand/20 hover:brightness-110 active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="whitespace-nowrap">{t.btnScanPhoto}</span>
          </button>

          <button
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:border-slate-300 transition"
          >
            <Plus className="w-4 h-4 text-accent-text" />
            <span className="hidden sm:inline">{t.addCustomIngredient}</span>
          </button>
        </div>
      </div>

      {/* Add Custom Ingredient Drawer / Form */}
      {showAddCustom && (
        <form
          onSubmit={handleCreateCustom}
          className="p-4 rounded-xl bg-card border border-line space-y-3 animate-fade-in"
        >
          <p className="text-xs font-bold text-ink uppercase tracking-wider">
            {t.addCustomIngredient}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ex: Câpres de Kerkennah, Poudre de fenouil..."
              className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg bg-surface border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
              autoFocus
            />
            <select
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value as IngredientCategory)}
              className="px-3 py-2 text-xs sm:text-sm rounded-lg bg-surface border border-slate-200 dark:border-slate-700"
            >
              <option value="vegetables">{t.catVegetables}</option>
              <option value="dairy_eggs">{t.catDairyEggs}</option>
              <option value="grains_pasta">{t.catGrainsPasta}</option>
              <option value="spices_condiments">{t.catSpicesCondiments}</option>
              <option value="meats">{t.catMeats}</option>
              <option value="fish">{t.catFish}</option>
              <option value="canned_pantry">{t.catCannedPantry}</option>
              <option value="other">{t.catOther}</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-accent text-on-accent text-xs sm:text-sm font-bold hover:bg-accent-strong transition"
            >
              {t.addBtn}
            </button>
          </div>
        </form>
      )}

      {/* Pantry: always-available items, never counted as missing */}
      <details className="group rounded-2xl bg-card border border-line" open={pantryIds.length === 0 ? true : undefined}>
        <summary className="flex items-center gap-2 p-3 sm:p-4 cursor-pointer list-none">
          <Package className="w-4 h-4 text-brand-text shrink-0" />
          <span className="text-sm font-bold text-ink">{t.pantryTitle}</span>
          <span className="text-xs text-ink-muted">({pantryIds.length})</span>
          <span className="ml-auto text-xs text-ink-muted group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <div className="px-3 sm:px-4 pb-4 space-y-2">
          <p className="text-xs text-ink-muted">{t.pantryDesc}</p>
          <div className="flex flex-wrap gap-1.5">
            {pantryCandidates.map((ing) => {
              const on = pantrySet.has(ing.id);
              return (
                <button
                  key={ing.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onTogglePantry(ing.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                    on ? 'bg-brand text-on-brand border-brand' : 'bg-surface text-ink-muted border-line hover:border-brand'
                  }`}
                >
                  {on && <Check className="w-3 h-3" />}
                  {getIngredientName(ing)}
                </button>
              );
            })}
          </div>
        </div>
      </details>

      {/* Category Pills (Functional Filter Buttons) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                isSelected
                  ? 'bg-brand text-on-brand shadow-xs'
                  : 'bg-card text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Ingredients Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {filteredIngredients.map((ing) => {
          const isChosen = selectedSet.has(ing.id);
          const inPantry = pantrySet.has(ing.id);
          const isUnused = !usedIngredientIds.has(ing.id);
          const name = getIngredientName(ing);

          return (
            <button
              key={ing.id}
              onClick={() => onToggleIngredient(ing.id)}
              className={`group flex items-center justify-between p-3 rounded-xl border text-left transition relative active:scale-97 min-h-[50px] ${
                isChosen
                  ? 'bg-brand/10 border-brand-text text-brand-text shadow-xs'
                  : 'bg-card border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
              } ${isUnused && !isChosen ? 'opacity-55' : ''}`}
              title={isUnused ? t.noRecipeYet : undefined}
            >
              <div className="flex flex-col pr-2 truncate">
                <span className="text-xs sm:text-sm font-semibold truncate">
                  {name}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {isUnused ? t.noRecipeYet : inPantry && !isChosen ? t.inPantry : ing.unit_default}
                </span>
              </div>

              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                  isChosen
                    ? 'bg-brand text-on-brand'
                    : 'border border-slate-300 dark:border-slate-600 group-hover:border-brand'
                }`}
              >
                {isChosen && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Items Floating Bar / Bottom CTA Banner */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-20 md:bottom-6 z-30 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-line shadow-xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent text-on-accent flex items-center justify-center font-extrabold text-xs">
              {selectedIds.length}
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-ink">
                {selectedIds.length} {t.selectedCount}
              </span>
              <button
                onClick={onClearAll}
                className="text-[11px] text-slate-500 hover:text-accent-text transition inline-flex items-center gap-1 text-left"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t.clearSelection}</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleTriggerSearch}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-on-brand font-bold text-xs sm:text-sm hover:bg-brand-strong shadow-lg shadow-brand/25 active:scale-95 transition"
          >
            <span>{t.cookNowAction}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AI Photo Scanner Modal */}
      <PhotoScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        availableIngredients={allIngredients}
        onAddIngredients={(newIds) => {
          newIds.forEach((id) => {
            if (!selectedSet.has(id)) {
              onToggleIngredient(id);
            }
          });
        }}
      />
    </div>
  );
};
