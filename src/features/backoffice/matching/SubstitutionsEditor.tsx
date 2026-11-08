import { useState } from 'react';
import {
  DEFAULT_SUBSTITUTION_RULES,
  MEAL_CATEGORIES,
  type Ingredient,
  type MealCategory,
  type SubstitutionRule,
} from '@/core/catalog';
import type { MatchingConfig } from '@/core/matching';
import { cls, IngredientChips, IngredientSelect, Section } from './ui';

const COURSE_LABEL: Record<MealCategory, string> = { entree: 'Entrées', plat_principal: 'Plats', dessert: 'Desserts' };

function RuleRow({
  rule,
  ingredients,
  onChange,
  onRemove,
}: {
  rule: SubstitutionRule;
  ingredients: Ingredient[];
  onChange: (r: SubstitutionRule) => void;
  onRemove: () => void;
}) {
  const name = ingredients.find((i) => i.id === rule.ingredient)?.name_fr ?? rule.ingredient;
  const toggleCourse = (course: MealCategory) => {
    const current = rule.notForCourses ?? [];
    const next = current.includes(course) ? current.filter((c) => c !== course) : [...current, course];
    onChange({ ...rule, notForCourses: next.length ? next : undefined });
  };
  return (
    <li className="p-3 rounded-xl bg-surface border border-line space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-ink">{name}</span>
        <span className="text-ink-muted">peut être remplacé par</span>
        <div className="flex-1">
          <IngredientChips
            ids={rule.substitutes}
            ingredients={ingredients}
            onChange={(substitutes) => onChange({ ...rule, substitutes })}
          />
        </div>
        <button className={cls.danger} onClick={onRemove}>
          Supprimer
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
        <span>Sauf pour :</span>
        {MEAL_CATEGORIES.map((c) => (
          <label key={c} className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={rule.notForCourses?.includes(c) ?? false}
              onChange={() => toggleCourse(c)}
            />
            {COURSE_LABEL[c]}
          </label>
        ))}
        <label className="inline-flex items-center gap-1">
          <input
            type="checkbox"
            checked={!!rule.notWhenKey}
            onChange={(e) => onChange({ ...rule, notWhenKey: e.target.checked || undefined })}
          />
          quand c’est l’ingrédient principal du plat
        </label>
      </div>
    </li>
  );
}

export function SubstitutionsEditor({
  config,
  ingredients,
  onChange,
}: {
  config: MatchingConfig;
  ingredients: Ingredient[];
  onChange: (c: MatchingConfig) => void;
}) {
  const [newIngredient, setNewIngredient] = useState('');
  const rules = config.substitutions;
  const setRules = (substitutions: SubstitutionRule[]) => onChange({ ...config, substitutions });

  return (
    <Section
      title="Remplacements d’ingrédients"
      hint="Règles générales « X peut remplacer Y ». Les remplacements propres à une recette se règlent dans la fiche recette."
      actions={
        <button className={cls.secondary} onClick={() => setRules(DEFAULT_SUBSTITUTION_RULES)}>
          Règles par défaut
        </button>
      }
    >
      <ul className="space-y-2">
        {rules.map((rule, i) => (
          <RuleRow
            key={`${rule.ingredient}-${i}`}
            rule={rule}
            ingredients={ingredients}
            onChange={(r) => setRules(rules.map((x, k) => (k === i ? r : x)))}
            onRemove={() => setRules(rules.filter((_, k) => k !== i))}
          />
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line">
        <IngredientSelect
          ingredients={ingredients}
          value={newIngredient}
          onChange={setNewIngredient}
          placeholder="Ingrédient à remplacer"
        />
        <button
          className={cls.primary}
          disabled={!newIngredient}
          onClick={() => {
            setRules([...rules, { ingredient: newIngredient, substitutes: [] }]);
            setNewIngredient('');
          }}
        >
          Ajouter une règle
        </button>
      </div>
    </Section>
  );
}
