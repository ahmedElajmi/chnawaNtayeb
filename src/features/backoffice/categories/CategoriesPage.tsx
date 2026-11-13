import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Languages,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { Ingredient, Recipe } from '@/core/catalog';
import {
  categoryUsage,
  type CategoryKind,
  type CategoryNode,
  type CategoryProblem,
  type CategoryWriteBlocker,
  type ContentCategory,
} from '@/core/categories';
import {
  LANGUAGE_CODES,
  languageInfo,
  localizedField,
  normalizeText,
  slugify,
  withLocalizedField,
} from '@/core/shared';
import { useCategories, useReview } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { usePagedList } from '@/shared/hooks/usePagedList';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { useGuardedClose } from '@/shared/hooks/useGuardedClose';
import { useCategoryNames } from '@/shared/i18n/useCategoryNames';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ShowMore } from '@/shared/ui/ShowMore';
import { format, type BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { useNotify } from '../shell/NotifyContext';
import { useIngredientEditor } from '../shell/IngredientEditorContext';
import { useTeamRecipes } from '../review/useTeamRecipes';
import { LocalizedField } from '../ui/LocalizedField';

const ICON_BUTTON =
  'p-1.5 rounded-lg text-ink-muted hover:text-brand-text hover:bg-brand/10 disabled:opacity-30 disabled:pointer-events-none';
const INPUT = 'w-full px-3 py-2 text-xs rounded-lg bg-card border border-line';

const PROBLEM: Record<CategoryProblem, (b: BackofficeTexts) => string> = {
  'id-invalid': (b) => b.catErrorId,
  'name-required': (b) => b.catErrorName,
  'name-taken': (b) => b.catErrorNameTaken,
  'parent-unknown': (b) => b.catErrorParent,
  'parent-loop': (b) => b.catErrorLoop,
  'too-deep': (b) => b.catErrorDepth,
};

const BLOCKER: Record<CategoryWriteBlocker, (b: BackofficeTexts) => string> = {
  'built-in': (b) => b.catBlockBuiltIn,
  'has-children': (b) => b.catBlockChildren,
  'in-use': (b) => b.catBlockInUse,
  denied: (b) => b.catBlockDenied,
};

/** /patron/categories/recettes */
export function RecipeCategoriesPage() {
  const recipes = useTeamRecipes();
  const { store } = useReview('recipe');
  const { getRecipeName } = useLanguage();
  return (
    <CategoriesManager<Recipe>
      kind="recipe"
      items={recipes}
      categoriesOf={(r) => r.category_ids ?? []}
      nameOf={getRecipeName}
      assign={(r, id, add) => {
        const ids = new Set(r.category_ids ?? []);
        if (add) ids.add(id);
        else ids.delete(id);
        return store.save({ ...r, category_ids: [...ids] });
      }}
    />
  );
}

/** /patron/categories/ingredients */
export function IngredientCategoriesPage() {
  const { ingredients } = useIngredientEditor();
  const { store } = useReview('ingredient');
  const { getIngredientName } = useLanguage();
  return (
    <CategoriesManager<Ingredient>
      kind="ingredient"
      items={ingredients}
      categoriesOf={(i) => [i.category]}
      nameOf={getIngredientName}
      // One category per ingredient: adding moves it; it cannot be left without one
      assign={(i, id, add) => (add ? store.save({ ...i, category: id }) : Promise.resolve({ ok: true }))}
    />
  );
}

interface ManagerProps<T extends { id: string }> {
  kind: CategoryKind;
  items: T[];
  categoriesOf: (item: T) => readonly string[];
  nameOf: (item: T) => string;
  /** Puts an item in a category (or takes it out), through the validation workspace */
  assign: (item: T, categoryId: string, add: boolean) => Promise<{ ok: boolean; local?: boolean; error?: string }>;
}

/**
 * Categories of one kind of content: the tree (order, sub-categories, move, rename, delete) and,
 * for the selected category, the items it holds, with a search to add more. Assigning goes
 * through the validation workspace: only the part holding the categories goes back to review.
 */
function CategoriesManager<T extends { id: string }>({ kind, items, categoriesOf, nameOf, assign }: ManagerProps<T>) {
  const b = useBackofficeText();
  const notify = useNotify();
  const { store, tree, categories } = useCategories(kind);
  const names = useCategoryNames(kind);
  const usage = useMemo(() => categoryUsage(tree, items.map(categoriesOf)), [tree, items, categoriesOf]);
  const [selected, setSelected] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<ContentCategory | null>(null);
  const selectedNode = selected ? (tree.byId.get(selected) ?? null) : null;

  const visible = tree.ordered.filter((n) => !n.path.slice(0, -1).some((id) => collapsed.has(id)));
  const toggle = (id: string) =>
    setCollapsed((c) => {
      const next = new Set(c);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const move = async (node: CategoryNode, step: -1 | 1) => {
    const siblings = (node.parent ? node.parent.children : tree.roots).map((n) => n.category.id);
    const from = siblings.indexOf(node.category.id);
    const to = from + step;
    if (to < 0 || to >= siblings.length) return;
    [siblings[from], siblings[to]] = [siblings[to], siblings[from]];
    const result = await store.reorder(siblings);
    if (!result.ok) notify(BLOCKER[result.blocker ?? 'denied'](b), true);
  };

  const remove = async (node: CategoryNode) => {
    if (!window.confirm(format(b.catDeleteConfirm, { name: names.name(node.category.id) }))) return;
    const result = await store.remove(node.category.id, usage);
    if (result.ok) {
      if (selected === node.category.id) setSelected(null);
      notify(b.catDeleted);
    } else notify(BLOCKER[result.blocker ?? 'denied'](b), true);
  };

  const newCategory = (parent: string | null): ContentCategory => ({
    id: '',
    parent_id: parent,
    name_fr: '',
    name_derja: '',
    name_ar: '',
    order: ((parent ? tree.byId.get(parent)!.children : tree.roots).length + 1) * 10,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs text-ink-muted max-w-xl">{kind === 'recipe' ? b.catRecipesHint : b.catIngredientsHint}</p>
        <button
          type="button"
          onClick={() => setEditing(newCategory(null))}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold"
        >
          <Plus className="w-4 h-4" /> {b.catAdd}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] items-start">
        <ul
          className="rounded-2xl bg-card border border-line divide-y divide-line overflow-hidden"
          aria-label={b.categories}
        >
          {visible.length === 0 && <li className="p-4 text-xs text-ink-muted">{b.catEmpty}</li>}
          {visible.map((node) => {
            const id = node.category.id;
            const count = usage.get(id);
            const siblings = node.parent ? node.parent.children : tree.roots;
            const index = siblings.indexOf(node);
            const missing = LANGUAGE_CODES.filter((l) => !localizedField(node.category, 'name')[l]?.trim());
            return (
              <li
                key={id}
                className={`flex items-center gap-1 pe-1 py-1.5 ${selected === id ? 'bg-brand/10' : ''}`}
                style={{ paddingInlineStart: `${(node.depth - 1) * 16 + 4}px` }}
              >
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  disabled={node.children.length === 0}
                  aria-label={collapsed.has(id) ? b.catExpand : b.catCollapse}
                  className={ICON_BUTTON}
                >
                  {collapsed.has(id) ? (
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(id)}
                  aria-pressed={selected === id}
                  className="flex-1 min-w-0 text-start flex items-center gap-1.5 text-sm"
                >
                  {node.category.icon && <span aria-hidden>{node.category.icon}</span>}
                  <span className="font-semibold truncate">{names.name(id)}</span>
                  <span
                    className="shrink-0 px-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold tabular-nums"
                    title={format(b.catCountHint, { own: count?.own ?? 0, total: count?.total ?? 0 })}
                  >
                    {count?.total ?? 0}
                  </span>
                  {missing.length > 0 && (
                    <span
                      className="shrink-0 inline-flex items-center gap-0.5 px-1 rounded bg-amber-100 dark:bg-amber-950/60 text-[10px] font-bold text-amber-800 dark:text-amber-200"
                      title={`${b.catMissingNames} : ${missing.map((l) => languageInfo(l).short).join(' · ')}`}
                    >
                      <Languages className="w-3 h-3" aria-hidden />
                      {missing.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className={ICON_BUTTON}
                  disabled={index <= 0}
                  onClick={() => move(node, -1)}
                  aria-label={b.catMoveUp}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className={ICON_BUTTON}
                  disabled={index >= siblings.length - 1}
                  onClick={() => move(node, 1)}
                  aria-label={b.catMoveDown}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className={ICON_BUTTON}
                  onClick={() => setEditing(newCategory(id))}
                  aria-label={b.catAddChild}
                  title={b.catAddChild}
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className={ICON_BUTTON}
                  onClick={() => setEditing(node.category)}
                  aria-label={b.catEdit}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {!node.category.built_in && (
                  <button
                    type="button"
                    className={`${ICON_BUTTON} hover:text-rose-600`}
                    onClick={() => remove(node)}
                    aria-label={b.catDelete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {selectedNode ? (
          <CategoryItems
            key={selectedNode.category.id}
            kind={kind}
            node={selectedNode}
            path={names.path(selectedNode.category.id)}
            items={items}
            categoriesOf={categoriesOf}
            nameOf={nameOf}
            assign={assign}
          />
        ) : (
          <p className="p-4 rounded-2xl border border-dashed border-line text-xs text-ink-muted">{b.catSelect}</p>
        )}
      </div>

      {editing && (
        <CategoryEditor
          kind={kind}
          initial={editing}
          all={categories}
          onClose={() => setEditing(null)}
          onSaved={(id) => {
            setEditing(null);
            setSelected(id);
          }}
        />
      )}
    </div>
  );
}

/** Items of a category (placed directly in it), with a search to put more in it. */
function CategoryItems<T extends { id: string }>({
  kind,
  node,
  path,
  items,
  categoriesOf,
  nameOf,
  assign,
}: Omit<ManagerProps<T>, 'kind'> & { kind: CategoryKind; node: CategoryNode; path: string }) {
  const b = useBackofficeText();
  const notify = useNotify();
  const { t } = useLanguage();
  const id = node.category.id;
  const inside = useMemo(() => items.filter((i) => categoriesOf(i).includes(id)), [items, categoriesOf, id]);
  const page = usePagedList(inside, id);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<string | null>(null);
  const q = normalizeText(query.trim());
  const candidates = useMemo(
    () =>
      q ? items.filter((i) => !categoriesOf(i).includes(id) && normalizeText(nameOf(i)).includes(q)).slice(0, 30) : [],
    [items, categoriesOf, nameOf, id, q]
  );

  const run = async (targets: T[], add: boolean) => {
    let failed = 0;
    for (const [n, item] of targets.entries()) {
      setProgress(`${n + 1} / ${targets.length}`);
      const result = await assign(item, id, add);
      if (!result.ok && !result.local) failed += 1;
    }
    setProgress(null);
    setPicked(new Set());
    notify(
      failed
        ? format(b.catAssignFailed, { failed })
        : format(kind === 'recipe' ? b.catAssignedRecipes : b.catAssignedIngredients, {
            count: targets.length - failed,
          }),
      failed > 0
    );
  };

  return (
    <section className="p-4 rounded-2xl bg-card border border-line space-y-3">
      <div>
        <h2 className="text-sm font-extrabold">{path}</h2>
        <p className="text-[11px] text-ink-muted">
          {format(kind === 'recipe' ? b.catHoldsRecipes : b.catHoldsIngredients, { count: inside.length })}
          {node.children.length > 0 && ` · ${b.catSubIncluded}`}
        </p>
      </div>

      <div className="space-y-2">
        <label className="relative block">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={kind === 'recipe' ? b.catSearchRecipes : b.catSearchIngredients}
            aria-label={kind === 'recipe' ? b.catSearchRecipes : b.catSearchIngredients}
            className={`${INPUT} ps-9`}
          />
        </label>
        {candidates.length > 0 && (
          <ul className="max-h-56 overflow-y-auto rounded-xl border border-line divide-y divide-line">
            {candidates.map((item) => (
              <li key={item.id}>
                <label className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-surface">
                  <input
                    type="checkbox"
                    checked={picked.has(item.id)}
                    onChange={(e) =>
                      setPicked((p) => {
                        const next = new Set(p);
                        if (e.target.checked) next.add(item.id);
                        else next.delete(item.id);
                        return next;
                      })
                    }
                  />
                  <span className="truncate">{nameOf(item)}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {picked.size > 0 && (
          <button
            type="button"
            disabled={!!progress}
            onClick={() =>
              run(
                items.filter((i) => picked.has(i.id)),
                true
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            {format(kind === 'recipe' ? b.catAddRecipes : b.catMoveIngredients, { count: picked.size })}
            {progress && <span className="tabular-nums">({progress})</span>}
          </button>
        )}
        <p className="text-[11px] text-ink-muted">{kind === 'recipe' ? b.catAssignHint : b.catMoveHint}</p>
      </div>

      {inside.length > 0 && (
        <ul className="rounded-xl border border-line divide-y divide-line">
          {page.visible.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
              <span className="truncate">{nameOf(item)}</span>
              {kind === 'recipe' && (
                <button
                  type="button"
                  disabled={!!progress}
                  onClick={() => run([item], false)}
                  aria-label={format(b.catRemoveFrom, { name: nameOf(item) })}
                  title={format(b.catRemoveFrom, { name: nameOf(item) })}
                  className={ICON_BUTTON}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <ShowMore
        list={page}
        progressLabel={(shown, total) => format(t.listProgress, { shown, total })}
        buttonLabel={t.listShowMore}
      />
    </section>
  );
}

/** A new id from the French name, not used yet ("ramadan", "ramadan-2"…). */
function newId(name: string, all: readonly ContentCategory[]): string {
  const base = slugify(name).slice(0, 56) || 'categorie';
  let id = base;
  for (let n = 2; all.some((c) => c.id === id); n++) id = `${base}-${n}`;
  return id;
}

/** Name in every language, icon and parent of a category. */
function CategoryEditor({
  kind,
  initial,
  all,
  onClose,
  onSaved,
}: {
  kind: CategoryKind;
  initial: ContentCategory;
  all: readonly ContentCategory[];
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const b = useBackofficeText();
  const notify = useNotify();
  const { store, tree } = useCategories(kind);
  const names = useCategoryNames(kind);
  const [draft, setDraft] = useState(initial);
  const [problems, setProblems] = useState<CategoryProblem[]>([]);
  const [busy, setBusy] = useState(false);
  const isNew = !initial.id;
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const dismiss = useGuardedClose(dirty, onClose, b.catDiscard);
  useCloseOnBack(true, onClose);

  // Parents a category can go under: not itself nor below itself, within the depth limit
  const parents = useMemo(() => {
    const excluded = new Set<string>();
    if (!isNew) {
      const visit = (n: CategoryNode) => {
        excluded.add(n.category.id);
        n.children.forEach(visit);
      };
      const node = tree.byId.get(initial.id);
      if (node) visit(node);
    }
    return names.options.filter(([id]) => !excluded.has(id));
  }, [names.options, tree, initial.id, isNew]);

  const save = async () => {
    const category = isNew ? { ...draft, id: newId(draft.name_fr, all) } : draft;
    setBusy(true);
    const result = await store.save(category);
    setBusy(false);
    if (result.ok) {
      notify(result.local ? b.catSavedLocal : b.catSaved, !!result.local);
      onSaved(category.id);
    } else if (result.errors) setProblems(result.errors.map((e) => e.problem));
    else notify(BLOCKER[result.blocker ?? 'denied'](b), true);
  };

  return (
    <ModalShell onDismiss={dismiss}>
      <div className="w-full max-w-lg mx-auto p-5 rounded-2xl bg-card border border-line space-y-4 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-extrabold">{isNew ? b.catNew : b.catEdit}</h2>
          <button type="button" onClick={dismiss} aria-label={b.close} className={ICON_BUTTON}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <LocalizedField
          label={b.catName}
          value={localizedField(draft, 'name')}
          onChange={(text) => setDraft((d) => withLocalizedField(d, 'name', text))}
          frenchRequired
          invalid={problems.some((p) => p.startsWith('name'))}
        />
        <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3">
          <label className="text-[11px] font-bold">
            {b.catIcon}
            <input
              value={draft.icon ?? ''}
              maxLength={8}
              onChange={(e) => {
                const icon = e.target.value.trim();
                setDraft(({ icon: _old, ...rest }) => (icon ? { ...rest, icon } : rest));
              }}
              placeholder="🌙"
              className={`${INPUT} mt-1 text-center`}
            />
          </label>
          <label className="text-[11px] font-bold min-w-0">
            {b.catParent}
            <select
              value={draft.parent_id ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, parent_id: e.target.value || null }))}
              className={`${INPUT} mt-1`}
            >
              <option value="">{b.catNoParent}</option>
              {parents.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {problems.length > 0 && (
          <ul className="text-xs text-rose-600 dark:text-rose-400 space-y-0.5">
            {problems.map((p) => (
              <li key={p}>{PROBLEM[p](b)}</li>
            ))}
          </ul>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={dismiss} className="px-3 py-2 rounded-xl text-xs font-bold border border-line">
            {b.cancel}
          </button>
          <button
            type="button"
            disabled={busy || !draft.name_fr.trim()}
            onClick={save}
            className="px-3 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold disabled:opacity-50"
          >
            {b.save}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
