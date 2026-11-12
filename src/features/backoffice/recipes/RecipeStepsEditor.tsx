import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { RecipeStep } from '@/core/catalog';
import { LocalizedField } from '@/features/backoffice/ui/LocalizedField';

interface RecipeStepsEditorProps {
  steps: RecipeStep[];
  onChange: (steps: RecipeStep[]) => void;
  /** After a failed save: steps without French text are highlighted */
  invalid?: boolean;
}

const emptyStep = (n: number): RecipeStep => ({
  step_number: n,
  instruction_fr: '',
  instruction_derja: '',
  instruction_ar: '',
});

/** Preparation steps of a recipe, in the three languages (numbering is redone on save). */
export function RecipeStepsEditor({ steps, onChange, invalid = false }: RecipeStepsEditorProps) {
  const renumber = (list: RecipeStep[]) => list.map((s, i) => ({ ...s, step_number: i + 1 }));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(renumber(next));
  };

  return (
    <div className="space-y-2">
      {steps.length === 0 && (
        <p className="text-[11px] text-amber-700 dark:text-amber-300">Ajoutez au moins une étape en français.</p>
      )}
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={index} className="p-3 rounded-xl bg-card border border-line space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-ink">
                <span className="w-5 h-5 rounded-full bg-brand text-on-brand flex items-center justify-center text-[10px]">
                  {index + 1}
                </span>
                Étape {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Monter l'étape ${index + 1}`}
                  className="p-1.5 rounded-lg text-ink-muted hover:bg-brand/10 disabled:opacity-30"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === steps.length - 1}
                  aria-label={`Descendre l'étape ${index + 1}`}
                  className="p-1.5 rounded-lg text-ink-muted hover:bg-brand/10 disabled:opacity-30"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(renumber(steps.filter((_, i) => i !== index)))}
                  aria-label={`Supprimer l'étape ${index + 1}`}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <LocalizedField
              label="Texte de l'étape"
              multiline
              rows={3}
              invalid={invalid && !step.instruction_fr.trim()}
              value={{ fr: step.instruction_fr, derja: step.instruction_derja, ar: step.instruction_ar }}
              onChange={(v) =>
                onChange(
                  steps.map((s, i) =>
                    i === index ? { ...s, instruction_fr: v.fr, instruction_derja: v.derja, instruction_ar: v.ar } : s
                  )
                )
              }
            />
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => onChange([...steps, emptyStep(steps.length + 1)])}
        className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-line text-xs font-bold text-brand-text hover:bg-brand/5"
      >
        <Plus className="w-4 h-4" />
        Ajouter une étape
      </button>
    </div>
  );
}
