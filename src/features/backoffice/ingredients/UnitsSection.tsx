import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { localizedField, withLocalizedField } from '@/core/shared';
import { validateUnitInfo, type UnitInfo } from '@/core/units';
import { useContainer, useCatalog } from '@/app/ContainerContext';
import { useLanguage } from '@/app/providers/LanguageContext';
import { useCloseOnBack } from '@/shared/hooks/useCloseOnBack';
import { useGuardedClose } from '@/shared/hooks/useGuardedClose';
import { ModalShell } from '@/shared/ui/ModalShell';
import { LocalizedField } from '../ui/LocalizedField';
import { format, type BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import { useNotify } from '../shell/NotifyContext';

const INPUT = 'w-full px-3 py-2 text-xs rounded-lg bg-card border border-slate-200 dark:border-slate-700 mt-1';
const LABEL = 'text-[11px] font-bold text-slate-600 dark:text-slate-300';

/** Starting point of a new unit description (the id is slugified from the label when saved). */
const NEW_UNIT: Omit<UnitInfo, 'id'> = { label: '', description_fr: '', description_derja: '', description_ar: '' };

/** Error of a unit refused by the domain rules, told by the field it is about. */
function unitErrorMessage(errors: ReturnType<typeof validateUnitInfo>, b: BackofficeTexts): string {
  switch (errors[0]?.problem) {
    case 'id-invalid':
      return b.unitErrorId;
    case 'label-required':
      return b.unitErrorLabel;
    case 'label-taken':
      return b.unitErrorLabelTaken;
    default:
      return b.unitErrorDescription;
  }
}

interface UnitEditorModalProps {
  unit: Omit<UnitInfo, 'id'> & { id?: string };
  /** Every description already defined, to refuse a label taken by another one */
  units: UnitInfo[];
  onSave: (unit: UnitInfo) => void;
  onClose: () => void;
}

/** Create or edit the description of one unit (label + texts in every language and variant). */
function UnitEditorModal({ unit, units, onSave, onClose }: UnitEditorModalProps) {
  const b = useBackofficeText();
  const isNew = !unit.id;
  const [draft, setDraft] = useState<Omit<UnitInfo, 'id'> & { id?: string }>(unit);
  const [error, setError] = useState<string | null>(null);
  useCloseOnBack(true, onClose);
  const dirty = JSON.stringify(draft) !== JSON.stringify(unit);
  const dismiss = useGuardedClose(dirty, onClose, b.unitDiscard);
  const set = (patch: Partial<UnitInfo>) => setDraft((d) => ({ ...d, ...patch }));

  const title = isNew ? b.unitAdd : format(b.unitEditNamed, { name: draft.label || unit.label });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = {
      ...withLocalizedField(draft, 'description', localizedField(draft, 'description'), true),
      id: draft.id ?? '',
      label: draft.label.trim(),
    } as UnitInfo;
    const errors = validateUnitInfo(candidate, units);
    if (errors.length) setError(unitErrorMessage(errors, b));
    else onSave(candidate);
  };

  return (
    <ModalShell onDismiss={dismiss}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg bg-surface rounded-2xl border border-line p-5 sm:p-6 shadow-2xl text-ink"
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-base text-ink truncate">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 shrink-0" aria-label={b.close}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="pt-4 space-y-4">
          {error && (
            <p
              role="alert"
              className="p-2.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold"
            >
              {error}
            </p>
          )}
          <label className={LABEL}>
            {b.unitLabel}
            <input
              type="text"
              value={draft.label}
              onChange={(e) => set({ label: e.target.value })}
              placeholder="c.à.s"
              className={INPUT}
              required
            />
          </label>
          <LocalizedField
            label={b.unitDescription}
            frenchRequired
            value={localizedField(draft, 'description')}
            onChange={(v) => setDraft((d) => withLocalizedField(d, 'description', v))}
          />

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              {b.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong shadow-sm transition"
            >
              {b.save}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

/**
 * Unit descriptions managed like the catalog: the visitors see them as info tooltips wherever
 * a unit is shown. Shown at the bottom of the Ingredients area.
 */
export function UnitsSection() {
  const { catalogAdmin } = useContainer();
  const { units: list } = useCatalog();
  const b = useBackofficeText();
  const { getLocalized } = useLanguage();
  const notify = useNotify();
  const [editing, setEditing] = useState<(Omit<UnitInfo, 'id'> & { id?: string }) | null>(null);
  const report = (ok: boolean) => {
    if (!ok) notify(b.unitSavedLocal, true);
    else notify(b.unitSaved);
    setEditing(null);
  };

  const save = async (candidate: UnitInfo) => {
    const result = await catalogAdmin.saveUnit(candidate);
    report(result.ok);
  };

  const remove = async (unit: UnitInfo) => {
    if (!window.confirm(format(b.unitDeleteConfirm, { name: unit.label }))) return;
    const result = await catalogAdmin.deleteUnit(unit.id);
    if (result.ok) notify(b.unitDeleted);
    else notify(b.unitSavedLocal, true);
  };

  return (
    <section className="rounded-2xl bg-card border border-line shadow-xs p-4 space-y-3" aria-label={b.unitTitle}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-extrabold text-ink">{b.unitTitle}</h2>
          <p className="text-[11px] text-ink-muted">{b.unitHint}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(NEW_UNIT)}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-on-brand text-xs font-bold hover:bg-brand-strong transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {b.unitAdd}
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-xs text-ink-muted">{b.unitEmpty}</p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700/80 rounded-xl bg-surface border border-line overflow-hidden">
          {list.map((unit) => (
            <div key={unit.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink truncate">{unit.label}</p>
                <p className="text-[11px] text-ink-muted truncate">{getLocalized(unit, 'description')}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditing(unit)}
                  aria-label={format(b.unitEditNamed, { name: unit.label })}
                  className="p-1.5 rounded-lg text-ink-muted hover:text-brand-text hover:bg-brand/10"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(unit)}
                  aria-label={format(b.unitDelete, { name: unit.label })}
                  title={b.unitDelete}
                  className="p-1.5 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <UnitEditorModal unit={editing} units={list} onSave={save} onClose={() => setEditing(null)} />}
    </section>
  );
}
