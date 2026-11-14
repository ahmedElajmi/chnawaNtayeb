import './print.css';

/**
 * Pure line formatter for a shopping-list item (exported for testing).
 * "Tomates — 2 kg"; without quantity just the name; checked lines get a tick
 * marker on top of the visual strikethrough.
 */
export function formatPrintLine(name: string, quantity: number, unit: string, checked: boolean): string {
  const amount = quantity > 0 ? `${quantity} ${unit}`.trim() : '';
  const base = amount ? `${name} — ${amount}` : name;
  return checked ? `${base} ✓` : base;
}

export interface PrintItem {
  name: string;
  quantity: number;
  unit: string;
  is_checked: boolean;
}

export interface PrintGroup {
  label: string;
  items: PrintItem[];
}

export interface PrintSheetProps {
  title: string;
  comment?: string;
  labels?: { aislesHeading?: string };
  groups: PrintGroup[];
  footer?: string;
}

/**
 * Presentational print sheet for one shopping list. No feature/i18n imports:
 * every user-facing string arrives via props (the app is 4-language).
 *
 * Screen styling uses Tailwind; print behavior comes from print.css
 * (`.print-sheet` is the only subtree kept visible when printing).
 */
export function PrintSheet({ title, comment, labels, groups, footer }: PrintSheetProps) {
  return (
    <div className="print-sheet mx-auto max-w-2xl p-6 text-neutral-900">
      <header className="mb-4 border-b border-neutral-300 pb-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        {comment ? <p className="mt-1 text-sm text-neutral-600">{comment}</p> : null}
      </header>

      {labels?.aislesHeading ? (
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">{labels.aislesHeading}</h2>
      ) : null}

      <div className="print-items space-y-4">
        {groups.map((group) => (
          <section key={group.label} className="print-aisle-group mb-4">
            <h3 className="mb-1 font-semibold">{group.label}</h3>
            <ul className="space-y-1">
              {group.items.map((item, index) => {
                const line = formatPrintLine(item.name, item.quantity, item.unit, item.is_checked);
                return (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm"
                    style={item.is_checked ? { textDecoration: 'line-through' } : undefined}
                  >
                    <span
                      className="print-box"
                      data-checked={item.is_checked ? 'true' : undefined}
                      aria-hidden="true"
                    />
                    <span>{line}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {footer ? (
        <footer className="mt-6 border-t border-neutral-300 pt-2 text-xs text-neutral-500">{footer}</footer>
      ) : null}
    </div>
  );
}
