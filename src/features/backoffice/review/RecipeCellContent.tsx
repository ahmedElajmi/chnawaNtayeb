import type { Recipe } from '@/core/catalog';
import { languageInfo, localizedField, parseYouTubeId, type Language } from '@/core/shared';
import { useCatalog } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';

const Empty = () => <span className="italic text-ink-muted">—</span>;

/**
 * What a cell of a recipe contains, as the reviewer reads it: the texts of one language for a text
 * part, the photo and video, or the details and ingredients for a common part.
 */
export function RecipeCellContent({ recipe, part, language }: { recipe: Recipe; part: string; language?: Language }) {
  const { getIngredientName } = useLanguage();
  const { ingredients } = useCatalog();
  const lang = language ?? 'fr';
  const info = languageInfo(lang);
  const text = (value: string | undefined) => (value?.trim() ? value : null);

  if (part === 'identity') {
    const name = text(localizedField(recipe, 'name')[lang]);
    const description = text(localizedField(recipe, 'description')[lang]);
    return (
      <div lang={info.htmlLang} dir={info.dir} className="space-y-1">
        <p className="text-sm font-bold">{name ?? <Empty />}</p>
        <p className="text-xs leading-relaxed whitespace-pre-line">{description ?? <Empty />}</p>
      </div>
    );
  }

  if (part === 'steps') {
    const steps = [...recipe.steps].sort((a, b) => a.step_number - b.step_number);
    return (
      <ol lang={info.htmlLang} dir={info.dir} className="space-y-1.5 text-xs leading-relaxed list-decimal ps-5">
        {steps.map((s) => (
          <li key={s.step_number}>{text(localizedField(s, 'instruction')[lang]) ?? <Empty />}</li>
        ))}
      </ol>
    );
  }

  if (part === 'tip') {
    return (
      <p lang={info.htmlLang} dir={info.dir} className="text-xs leading-relaxed whitespace-pre-line">
        {text(recipe.chef_tip?.[lang]) ?? <Empty />}
      </p>
    );
  }

  if (part === 'media') {
    const video = parseYouTubeId(recipe.video_url);
    return (
      <div className="space-y-2">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt=""
            className="w-full max-w-xs aspect-video object-cover rounded-xl border border-line bg-slate-100 dark:bg-slate-900"
          />
        ) : (
          <Empty />
        )}
        <p className="text-xs break-all">
          ▶{' '}
          {video ? (
            <a href={recipe.video_url} target="_blank" rel="noreferrer" className="underline">
              {recipe.video_url}
            </a>
          ) : (
            <Empty />
          )}
        </p>
      </div>
    );
  }

  // details: times, servings, kind of dish, ingredients
  const byId = new Map(ingredients.map((i) => [i.id, i]));
  return (
    <div className="space-y-2 text-xs">
      <p>
        {recipe.prep_time_minutes} + {recipe.cook_time_minutes} min · {recipe.base_servings} pers. · {recipe.category} ·{' '}
        {recipe.cuisine_type} · {recipe.difficulty}
        {recipe.is_healthy ? ' · healthy' : ''}
      </p>
      <ul className="space-y-0.5">
        {recipe.ingredients.map((i) => {
          const ingredient = byId.get(i.ingredient_id);
          return (
            <li key={i.ingredient_id}>
              <span className="font-semibold">{ingredient ? getIngredientName(ingredient) : i.ingredient_id}</span> ·{' '}
              {i.quantity_base} {i.unit}
              {i.role ? ` · ${i.role}` : ''}
              {i.is_optional ? ' · option' : ''}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
