import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Ingredient, IngredientCategory } from '@/core/catalog';
import { normalizeText } from '@/core/shared';
import { useLanguage } from '@/app/providers/LanguageContext';
import type { CatalogAdminActions } from '../useCatalogAdmin';

const FIELD = 'px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-slate-200 dark:border-slate-700';

function NewIngredientForm({ admin }: { admin: CatalogAdminActions }) {
  const { t } = useLanguage();
  const [nameFr, setNameFr] = useState('');
  const [nameDerja, setNameDerja] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('vegetables');
  const [unit, setUnit] = useState('kg');
  const [price, setPrice] = useState(2.0);

  const categories: [IngredientCategory, string][] = [
    ['vegetables', t.catVegetables],
    ['fruits', t.catFruits],
    ['meats', t.catMeats],
    ['fish', t.catFish],
    ['dairy_eggs', t.catDairyEggs],
    ['grains_pasta', t.catGrainsPasta],
    ['spices_condiments', t.catSpicesCondiments],
    ['canned_pantry', t.catCannedPantry],
    ['other', t.catOther],
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fr = nameFr.trim();
    if (!fr) return;
    await admin.addIngredient({
      name_fr: fr,
      name_derja: nameDerja.trim() || fr,
      name_ar: nameAr.trim() || fr,
      category,
      unit_default: unit,
      default_price_tnd: price,
    });
    setNameFr('');
    setNameDerja('');
    setNameAr('');
  };

  return (
    <form onSubmit={submit} className="p-5 rounded-2xl bg-card border border-line space-y-3">
      <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Ajouter un ingrédient au catalogue</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <input
          type="text"
          value={nameFr}
          onChange={(e) => setNameFr(e.target.value)}
          placeholder="Nom Français (ex: Câpres)"
          className={FIELD}
          required
        />
        <input
          type="text"
          value={nameDerja}
          onChange={(e) => setNameDerja(e.target.value)}
          placeholder="Nom Derja Arabizi (ex: Kabbara)"
          className={FIELD}
        />
        <input
          type="text"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          placeholder="Nom Arabe (ex: كبار)"
          className={FIELD}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as IngredientCategory)}
          className={FIELD}
          aria-label="Catégorie"
        >
          {categories.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Unité (ex: kg, pièce, boîte...)"
          className={FIELD}
        />
        <div className="flex gap-2">
          <input
            type="number"
            step="0.1"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            placeholder="Prix unitaire DT"
            aria-label="Prix unitaire en DT"
            className={`w-full ${FIELD}`}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong transition shrink-0"
          >
            Ajouter
          </button>
        </div>
      </div>
    </form>
  );
}

function PriceList({ ingredients, admin }: { ingredients: Ingredient[]; admin: CatalogAdminActions }) {
  const [search, setSearch] = useState('');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const q = normalizeText(search.trim());
  const filtered = q
    ? ingredients.filter((i) => [i.name_fr, i.name_derja, i.name_ar].some((n) => normalizeText(n).includes(q)))
    : ingredients;
  const edited = Object.keys(prices).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer les ingrédients..."
            aria-label="Filtrer les ingrédients"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
          />
        </div>
        {edited > 0 && (
          <button
            onClick={async () => {
              await admin.savePrices(ingredients, prices);
              setPrices({});
            }}
            className="px-4 py-2 rounded-xl bg-accent text-on-accent text-xs sm:text-sm font-bold hover:bg-accent-strong transition shadow-md shrink-0"
          >
            Enregistrer les prix modifiés ({edited})
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700/80 rounded-2xl bg-card border border-line overflow-hidden shadow-xs">
        {filtered.map((ing) => (
          <div
            key={ing.id}
            className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
          >
            <div>
              <p className="text-xs sm:text-sm font-bold text-ink">
                {ing.name_fr}
                {ing.name_derja && (
                  <span className="text-xs text-accent-text font-semibold ml-1.5">({ing.name_derja})</span>
                )}
              </p>
              <p className="text-[11px] text-slate-400 capitalize">
                {ing.category} · Unité : {ing.unit_default}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={prices[ing.id] ?? ing.default_price_tnd}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!Number.isNaN(value)) setPrices((p) => ({ ...p, [ing.id]: value }));
                }}
                aria-label={`Prix de ${ing.name_fr} en DT`}
                className="w-20 px-2 py-1 text-xs font-bold text-right rounded-lg bg-surface border border-slate-200 dark:border-slate-700"
              />
              <span className="text-xs font-bold text-slate-500">DT</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IngredientsTab({ ingredients, admin }: { ingredients: Ingredient[]; admin: CatalogAdminActions }) {
  return (
    <div className="space-y-6">
      <NewIngredientForm admin={admin} />
      <PriceList ingredients={ingredients} admin={admin} />
    </div>
  );
}
