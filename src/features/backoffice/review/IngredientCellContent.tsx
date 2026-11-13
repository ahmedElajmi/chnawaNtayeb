import type { Ingredient } from '@/core/catalog';
import { languageInfo, localizedField, type Language } from '@/core/shared';
import { formatPriceRange } from '@/shared/i18n/formatPrice';
import { useCategoryNames } from '@/shared/i18n/useCategoryNames';
import { IngredientThumb } from '@/shared/ui/IngredientThumb';

const Empty = () => <span className="italic text-ink-muted">—</span>;

/** What a cell of an ingredient contains: its name in one language, category and unit, price, photo. */
export function IngredientCellContent({
  item,
  part,
  language,
}: {
  item: Ingredient;
  part: string;
  language?: Language;
}) {
  const categories = useCategoryNames('ingredient');
  if (part === 'identity') {
    const info = languageInfo(language ?? 'fr');
    const name = localizedField(item, 'name')[language ?? 'fr'];
    return (
      <p lang={info.htmlLang} dir={info.dir} className="text-sm font-bold">
        {name?.trim() ? name : <Empty />}
      </p>
    );
  }
  if (part === 'details')
    return (
      <p className="text-xs">
        {categories.path(item.category) || item.category} · {item.unit_default || <Empty />}
      </p>
    );
  if (part === 'price')
    return (
      <p className="text-sm font-bold">
        {formatPriceRange({ min: item.price_min_tnd, max: item.price_max_tnd }, 'DT')} / {item.unit_default}
      </p>
    );
  return (
    <div className="flex items-center gap-3">
      <IngredientThumb ingredient={item} size="md" />
      <span className="text-xs break-all">{item.image_url ?? <Empty />}</span>
    </div>
  );
}
