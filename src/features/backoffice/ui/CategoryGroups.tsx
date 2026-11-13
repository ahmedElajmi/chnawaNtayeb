import { useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { MAX_CATEGORY_DEPTH, groupByCategory, type CategoryGroup, type CategoryKind } from '@/core/categories';
import { useLanguage } from '@/app/providers/LanguageContext';
import { usePagedList } from '@/shared/hooks/usePagedList';
import { useCategoryNames } from '@/shared/i18n/useCategoryNames';
import { ShowMore } from '@/shared/ui/ShowMore';
import { format } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';

const GROUP_PARAM = 'groupe';
const LEVEL_PARAM = 'niveau';
const BY_CATEGORY = 'categorie';

/** "Group by category" and its level, kept in the address (?groupe=categorie&niveau=2). */
export function useCategoryGrouping() {
  const [params, setParams] = useSearchParams();
  const on = params.get(GROUP_PARAM) === BY_CATEGORY;
  const level = Math.min(MAX_CATEGORY_DEPTH, Math.max(1, Number(params.get(LEVEL_PARAM)) || 1));
  const update = (next: { on?: boolean; level?: number }) =>
    setParams(
      (p) => {
        const copy = new URLSearchParams(p);
        if (next.on !== undefined) {
          if (next.on) copy.set(GROUP_PARAM, BY_CATEGORY);
          else {
            copy.delete(GROUP_PARAM);
            copy.delete(LEVEL_PARAM);
          }
        }
        if (next.level !== undefined) copy.set(LEVEL_PARAM, String(next.level));
        return copy;
      },
      { replace: true }
    );
  return {
    on,
    level,
    setOn: (value: boolean) => update({ on: value }),
    setLevel: (value: number) => update({ level: value }),
  };
}

/** Switch and level selector of the grouping (levels shown only when the tree has several). */
export function CategoryGroupingControls({ kind }: { kind: CategoryKind }) {
  const b = useBackofficeText();
  const { tree } = useCategoryNames(kind);
  const { on, level, setOn, setLevel } = useCategoryGrouping();
  const depth = tree.ordered.reduce((max, n) => Math.max(max, n.depth), 1);
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
      <label className="inline-flex items-center gap-1.5 cursor-pointer">
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="accent-brand" />
        {b.groupByCategory}
      </label>
      {on && depth > 1 && (
        <label className="inline-flex items-center gap-1.5">
          {b.groupLevel}
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="px-2 py-1 rounded-lg bg-card border border-line text-xs text-ink"
          >
            {Array.from({ length: depth }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

/**
 * A list split in collapsible sections, one per category at the chosen level (an item in several
 * categories appears in each). Each section shows its full count and renders its items by pages.
 */
export function CategoryGroups<T>({
  kind,
  items,
  categoriesOf,
  renderItem,
  keyOf,
  summary,
  resetKey,
}: {
  kind: CategoryKind;
  items: readonly T[];
  categoriesOf: (item: T) => readonly string[];
  renderItem: (item: T) => ReactNode;
  keyOf: (item: T) => string;
  /** Extra line in a section header (e.g. how many items wait for validation) */
  summary?: (items: readonly T[]) => string | null;
  resetKey: string;
}) {
  const names = useCategoryNames(kind);
  const { level } = useCategoryGrouping();
  const groups = useMemo(
    () => groupByCategory(items, categoriesOf, names.tree, level),
    [items, categoriesOf, names.tree, level]
  );
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <GroupSection
          key={group.id ?? '-'}
          group={group}
          title={group.id ? names.path(group.id) : null}
          icon={group.id ? names.tree.byId.get(group.id)?.category.icon : undefined}
          renderItem={renderItem}
          keyOf={keyOf}
          summary={summary}
          resetKey={resetKey}
        />
      ))}
    </div>
  );
}

function GroupSection<T>({
  group,
  title,
  icon,
  renderItem,
  keyOf,
  summary,
  resetKey,
}: {
  group: CategoryGroup<T>;
  title: string | null;
  icon?: string;
  renderItem: (item: T) => ReactNode;
  keyOf: (item: T) => string;
  summary?: (items: readonly T[]) => string | null;
  resetKey: string;
}) {
  const b = useBackofficeText();
  const { t } = useLanguage();
  const page = usePagedList(group.items, resetKey);
  return (
    <details open className="rounded-2xl bg-card border border-line overflow-hidden shadow-xs">
      <summary className="px-4 py-2.5 cursor-pointer flex flex-wrap items-center gap-2 bg-surface/60">
        {icon && <span aria-hidden>{icon}</span>}
        <span className="text-sm font-extrabold">{title ?? b.noCategory}</span>
        <span className="px-2 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold tabular-nums">
          {group.items.length}
        </span>
        {summary?.(group.items) && <span className="text-[11px] text-ink-muted">· {summary(group.items)}</span>}
      </summary>
      <div className="divide-y divide-slate-100 dark:divide-slate-700/80 border-t border-line">
        {page.visible.map((item) => (
          <div key={keyOf(item)}>{renderItem(item)}</div>
        ))}
      </div>
      <ShowMore
        list={page}
        progressLabel={(shown, total) => format(t.listProgress, { shown, total })}
        buttonLabel={t.listShowMore}
      />
    </details>
  );
}
