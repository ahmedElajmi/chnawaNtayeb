import type { ReactNode } from 'react';
import { AlertTriangle, Check, Circle, CircleDot } from 'lucide-react';
import type { BackofficeTexts } from '../i18n/backofficeTexts';
import { useBackofficeText } from '../i18n/useBackofficeText';
import type { SectionId, SectionStatus } from './recipeDraft';

/** Parts of the recipe form, in order, with their shortcut label. */
export const sections = (b: BackofficeTexts): { id: SectionId; label: string }[] => [
  { id: 'infos', label: b.edSectionInfos },
  { id: 'media', label: b.edSectionMedia },
  { id: 'ingredients', label: b.edSectionIngredients },
  { id: 'steps', label: b.edSectionSteps },
  { id: 'tip', label: b.edSectionTip },
];

const STATUS_ICON: Record<SectionStatus, ReactNode> = {
  done: <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />,
  todo: <CircleDot className="w-3 h-3 text-rose-500" />,
  warn: <AlertTriangle className="w-3 h-3 text-amber-500" />,
  optional: <Circle className="w-3 h-3 text-slate-300 dark:text-slate-600" />,
};

const statusText = (b: BackofficeTexts): Record<SectionStatus, string> => ({
  done: b.edStatusDone,
  todo: b.edStatusTodo,
  warn: b.edStatusWarn,
  optional: b.edStatusOptional,
});

/** Shortcuts to each part of the form, with where it stands. */
export function SectionNav({
  status,
  onJump,
}: {
  status: Record<SectionId, SectionStatus>;
  onJump: (id: SectionId) => void;
}) {
  const b = useBackofficeText();
  const statusLabels = statusText(b);
  return (
    <nav aria-label={b.edSectionNavLabel} className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
      {sections(b).map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onJump(id)}
          title={`${label} : ${statusLabels[status[id]]}`}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-card border border-line text-[11px] font-semibold text-ink hover:border-brand"
        >
          {STATUS_ICON[status[id]]}
          {label}
        </button>
      ))}
    </nav>
  );
}

/** Element id of a section of the recipe form. */
export const sectionDomId = (id: SectionId) => `recipe-editor-${id}`;

/** One part of the form, with a title; the shortcuts scroll to it. */
export function EditorSection({
  id,
  title,
  hint,
  children,
}: {
  id: SectionId;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section id={sectionDomId(id)} aria-labelledby={`section-${id}`} className="scroll-mt-28 space-y-3">
      <div>
        <h4 id={`section-${id}`} className="text-sm font-extrabold text-ink">
          {title}
        </h4>
        {hint && <p className="text-[11px] text-ink-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}
