import React, { useMemo, useState } from 'react';
import { Calendar, Wand2, ShoppingBag, Plus, RefreshCw, Check, X, Leaf, AlertTriangle, Star } from 'lucide-react';
import {
  DayPlan,
  MealSlot,
  MealType,
  assignToSlot,
  countEmptyMeals,
  countMealsWithoutMain,
  generateWeekPlan,
  removeFromSlot,
  SLOT_KEY,
} from '@/core/planning';
import { Recipe, Ingredient, MealCategory, normalizeCategory } from '@/core/catalog';
import { useLanguage } from '@/app/providers/LanguageContext';
import { pickLocalized } from '@/core/shared';
import { formatPriceRange } from '@/shared/i18n/formatPrice';
import { getRecipeCost } from '@/app/ContainerContext';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { ModalShell } from '@/shared/ui/ModalShell';

interface WeeklyPlannerViewProps {
  plan: DayPlan[];
  recipes: Recipe[];
  allIngredients: Ingredient[];
  onUpdatePlan: (updatedPlan: DayPlan[]) => void;
  onGenerateGroceryList: () => void;
  onSelectRecipeDetail: (recipeId: string) => void;
}

type EditingSlot = { dayIndex: number; mealType: MealType; course: MealCategory };

export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  plan,
  recipes,
  allIngredients,
  onUpdatePlan,
  onGenerateGroceryList,
  onSelectRecipeDetail,
}) => {
  const { t, getRecipeName, language } = useLanguage();
  const [editingSlot, setEditingSlot] = useState<EditingSlot | null>(null);
  const [pickerHealthyOnly, setPickerHealthyOnly] = useState(false);
  const [toast, setToast] = useState<{ message: string; warn?: boolean } | null>(null);
  const [options, setOptions] = useState({ withEntree: false, withDessert: false, healthyOnly: false });
  useCloseOnBack(!!editingSlot, () => setEditingSlot(null));

  const courseLabel: Record<MealCategory, string> = {
    entree: t.courseEntree,
    plat_principal: t.courseMain,
    dessert: t.courseDessert,
  };

  const showToast = (message: string, warn = false) => {
    setToast({ message, warn });
    setTimeout(() => setToast(null), warn ? 5000 : 3000);
  };

  const withoutMain = countMealsWithoutMain(plan);
  const emptyMeals = countEmptyMeals(plan);

  const handleAutoGenerate = () => {
    const { plan: generated, healthyFallback } = generateWeekPlan(recipes, plan, options);
    onUpdatePlan(generated);
    if (healthyFallback.length > 0) {
      showToast(t.healthyFallback.replace('{list}', healthyFallback.map((c) => courseLabel[c]).join(', ')), true);
    } else {
      showToast(t.planGenerated);
    }
  };

  const updateSlot = (dayIndex: number, mealType: MealType, next: MealSlot) => {
    onUpdatePlan(plan.map((day, idx) => (idx === dayIndex ? { ...day, [mealType]: next } : day)));
  };

  const handleAssignRecipe = (recipeId: string) => {
    if (!editingSlot) return;
    const { dayIndex, mealType, course } = editingSlot;
    updateSlot(dayIndex, mealType, assignToSlot(plan[dayIndex][mealType], course, recipeId));
    setEditingSlot(null);
  };

  const handleRemove = (dayIndex: number, mealType: MealType, course: MealCategory) => {
    const slot = plan[dayIndex][mealType];
    // Removing the main course removes the whole meal: confirm if a starter/dessert would be lost
    if (course === 'plat_principal' && (slot.entree_id || slot.dessert_id) && !window.confirm(t.removeMealConfirm)) {
      return;
    }
    updateSlot(dayIndex, mealType, removeFromSlot(slot, course));
  };

  const getDayName = (day: DayPlan) =>
    pickLocalized(language, { fr: day.day_name_fr, derja: day.day_name_derja, ar: day.day_name_ar });

  const pickerRecipes = useMemo(() => {
    if (!editingSlot) return [];
    return recipes.filter(
      (r) =>
        r.is_published && normalizeCategory(r.category) === editingSlot.course && (!pickerHealthyOnly || r.is_healthy)
    );
  }, [editingSlot, recipes, pickerHealthyOnly]);

  const openPicker = (dayIndex: number, mealType: MealType, course: MealCategory) => {
    setPickerHealthyOnly(options.healthyOnly);
    setEditingSlot({ dayIndex, mealType, course });
  };

  // One course line inside a meal
  const renderCourse = (dayIndex: number, mealType: MealType, course: MealCategory) => {
    const slot = plan[dayIndex][mealType];
    const recipe = recipes.find((r) => r.id === slot[SLOT_KEY[course]]);
    const isMain = course === 'plat_principal';

    if (!recipe) {
      if (isMain) {
        const missing = !!(slot.entree_id || slot.dessert_id);
        return (
          <button
            onClick={() => openPicker(dayIndex, mealType, course)}
            className={`w-full p-2.5 rounded-xl border border-dashed text-[11px] flex items-center justify-center gap-1 transition ${
              missing
                ? 'border-accent text-accent-text bg-accent/10'
                : 'border-slate-300 dark:border-slate-700 text-slate-400 hover:border-brand hover:text-brand-text'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {t.courseMain} · {t.mandatory}
            </span>
          </button>
        );
      }
      // Optional courses can only be added once the main course is chosen
      if (!slot.plat_id) return null;
      return (
        <button
          onClick={() => openPicker(dayIndex, mealType, course)}
          className="text-[10px] font-semibold text-slate-400 hover:text-brand-text px-1"
        >
          {t.addCourse.replace('{course}', courseLabel[course])}
        </button>
      );
    }

    return (
      <div
        onClick={() => onSelectRecipeDetail(recipe.id)}
        className={`p-2 rounded-xl border transition cursor-pointer group ${
          isMain
            ? 'bg-surface border-slate-200/80 dark:border-slate-700/80 hover:border-brand'
            : 'bg-card border-line/70 hover:border-brand'
        }`}
      >
        <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
          {isMain && <Star className="w-2.5 h-2.5 text-highlight" />}
          <span>{courseLabel[course]}</span>
          {recipe.is_healthy && <Leaf className="w-2.5 h-2.5 text-emerald-600" aria-label={t.healthyLabel} />}
        </div>
        <p className={`font-bold text-ink truncate group-hover:text-brand-text ${isMain ? 'text-xs' : 'text-[11px]'}`}>
          {getRecipeName(recipe)}
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
          <span>{recipe.prep_time_minutes + recipe.cook_time_minutes} min</span>
          <span className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openPicker(dayIndex, mealType, course);
              }}
              aria-label={t.replaceLabel}
              title={t.replaceLabel}
              className="hover:text-brand-text"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(dayIndex, mealType, course);
              }}
              aria-label={t.removeLabel}
              title={t.removeLabel}
              className="hover:text-rose-500"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      </div>
    );
  };

  const renderMeal = (dayIndex: number, mealType: MealType) => {
    const slot = plan[dayIndex][mealType];
    return (
      <div className="space-y-1">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${mealType === 'lunch' ? 'text-accent-text' : 'text-brand-text'}`}
        >
          {mealType === 'lunch' ? `☀️ ${t.lunch}` : `🌙 ${t.dinner}`}
        </span>
        {slot.entree_id && renderCourse(dayIndex, mealType, 'entree')}
        {renderCourse(dayIndex, mealType, 'plat_principal')}
        {slot.dessert_id && renderCourse(dayIndex, mealType, 'dessert')}
        {slot.plat_id && (!slot.entree_id || !slot.dessert_id) && (
          <div className="flex items-center gap-2">
            {!slot.entree_id && renderCourse(dayIndex, mealType, 'entree')}
            {!slot.dessert_id && renderCourse(dayIndex, mealType, 'dessert')}
          </div>
        )}
      </div>
    );
  };

  const optionChips: { key: keyof typeof options; label: string }[] = [
    { key: 'withEntree', label: t.optWithEntree },
    { key: 'withDessert', label: t.optWithDessert },
    { key: 'healthyOnly', label: t.optHealthy },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-line shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-ink flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-text" />
            <span>{t.weeklyTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.weeklySubtitle}</p>
        </div>

        <div className="flex flex-col sm:items-end gap-2.5">
          {/* Generation options */}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.generateWeekPlan}>
            {optionChips.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={options[key]}
                onClick={() => setOptions((o) => ({ ...o, [key]: !o[key] }))}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                  options[key]
                    ? 'bg-brand text-on-brand border-brand'
                    : 'bg-surface text-ink-muted border-line hover:border-brand'
                }`}
              >
                {key === 'healthyOnly' && <Leaf className="w-3 h-3" />}
                {options[key] && key !== 'healthyOnly' && <Check className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleAutoGenerate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-slate-300 dark:border-slate-600 text-ink text-xs sm:text-sm font-semibold hover:border-brand transition shadow-xs active:scale-95"
            >
              <Wand2 className="w-4 h-4 text-accent-text" />
              <span>{t.generateWeekPlan}</span>
            </button>

            <button
              onClick={() => {
                onGenerateGroceryList();
                showToast('Liste de courses consolidée générée !');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-on-brand text-xs sm:text-sm font-bold hover:bg-brand-strong transition shadow-md shadow-brand/20 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.generateGroceryList}</span>
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            toast.warn
              ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          {toast.warn ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4 text-emerald-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Menu checks: the main course is mandatory */}
      {(withoutMain > 0 || emptyMeals > 0) && (
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {withoutMain > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent-text">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t.mealsWithoutMain.replace('{n}', String(withoutMain))}
            </span>
          )}
          {emptyMeals > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-ink-muted">
              {t.emptyMeals.replace('{n}', String(emptyMeals))}
            </span>
          )}
        </div>
      )}

      {/* 7-Day Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {plan.map((day, dayIndex) => (
          <div key={day.day_id} className="flex flex-col rounded-2xl bg-card border border-line p-3.5 shadow-xs gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <span className="font-extrabold text-sm text-ink">{getDayName(day)}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Jour {dayIndex + 1}</span>
            </div>
            {renderMeal(dayIndex, 'lunch')}
            {renderMeal(dayIndex, 'dinner')}
          </div>
        ))}
      </div>

      {/* Choose Recipe Modal (only recipes of the slot's course) */}
      {editingSlot && (
        <ModalShell onDismiss={() => setEditingSlot(null)}>
          <div className="w-full max-w-md rounded-2xl bg-surface border border-line p-5 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-ink">
                  {t.chooseCourse.replace('{course}', courseLabel[editingSlot.course])}
                </h3>
                <p className="text-[11px] text-ink-muted">
                  {getDayName(plan[editingSlot.dayIndex])} · {editingSlot.mealType === 'lunch' ? t.lunch : t.dinner}
                </p>
              </div>
              <button
                onClick={() => setEditingSlot(null)}
                aria-label={t.settingsClose}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <label className="flex items-center gap-2 pt-3 text-xs font-semibold text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={pickerHealthyOnly}
                onChange={(e) => setPickerHealthyOnly(e.target.checked)}
                className="accent-brand w-4 h-4"
              />
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              {t.healthyOnly}
            </label>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {pickerRecipes.length === 0 && (
                <p className="text-xs text-ink-muted text-center py-6">{t.noRecipeForCourse}</p>
              )}
              {pickerRecipes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleAssignRecipe(r.id)}
                  className="w-full p-3 rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-left hover:border-brand transition flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-ink truncate">{getRecipeName(r)}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span>
                        {r.prep_time_minutes + r.cook_time_minutes} min ·{' '}
                        {formatPriceRange(getRecipeCost(r, allIngredients), t.currency)}
                      </span>
                      {r.is_healthy && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold">
                          <Leaf className="w-3 h-3" />
                          {t.healthyLabel}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-brand-text font-semibold shrink-0">Choisir</span>
                </button>
              ))}
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};
