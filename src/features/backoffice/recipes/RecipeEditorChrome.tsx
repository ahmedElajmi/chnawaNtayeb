import type { ReactNode } from 'react';
import { AlertTriangle, Check, Circle, CircleDot } from 'lucide-react';
import type { SectionId, SectionStatus } from './recipeDraft';

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'infos', label: 'Infos' },
  { id: 'media', label: 'Photo & vidéo' },
  { id: 'ingredients', label: 'Ingrédients' },
  { id: 'steps', label: 'Étapes' },
  { id: 'tip', label: 'Astuce' },
];

const STATUS_ICON: Record<SectionStatus, ReactNode> = {
  done: <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />,
  todo: <CircleDot className="w-3 h-3 text-rose-500" />,
  warn: <AlertTriangle className="w-3 h-3 text-amber-500" />,
  optional: <Circle className="w-3 h-3 text-slate-300 dark:text-slate-600" />,
};

const STATUS_TEXT: Record<SectionStatus, string> = {
  done: 'complet',
  todo: 'à compléter',
  warn: 'à vérifier',
  optional: 'facultatif',
};

/** Shortcuts to each part of the form, with where it stands. */
export function SectionNav({
  status,
  onJump,
}: {
  status: Record<SectionId, SectionStatus>;
  onJump: (id: SectionId) => void;
}) {
  return (
    <nav aria-label="Parties de la recette" className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onJump(id)}
          title={`${label} : ${STATUS_TEXT[status[id]]}`}
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
