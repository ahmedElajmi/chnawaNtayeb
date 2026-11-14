import { useId, type InputHTMLAttributes } from 'react';
import { unitLookupKey } from '@/core/units';
import { useUnitOptions } from '@/app/ContainerContext';

/** Units the chef uses most, proposed while typing (any other text stays possible). */
export const COMMON_UNITS = [
  'g',
  'kg',
  'ml',
  'cl',
  'L',
  'pièce',
  'pièces',
  'c.à.s',
  'c.à.c',
  'pincée',
  'gousses',
  'botte',
  'boîte',
  'sachet',
  'paquet',
  'tranche',
  'feuilles',
  'verre',
];

type UnitInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'list'> & {
  value: string;
  onChange: (value: string) => void;
};

/** The suggestions of the datalist: the unit registry managed in the backoffice, completed by
 *  the common units that are not described yet (each label offered once, case-insensitively). */
export function unitSuggestions(registry: Array<{ label: string }>): string[] {
  const offered = new Set<string>();
  const labels: string[] = [];
  for (const label of [...registry.map((o) => o.label), ...COMMON_UNITS]) {
    const key = unitLookupKey(label);
    if (!label || offered.has(key)) continue;
    offered.add(key);
    labels.push(label);
  }
  return labels;
}

export function UnitInput({ value, onChange, ...rest }: UnitInputProps) {
  const listId = useId();
  const options = useUnitOptions();
  return (
    <>
      <input {...rest} type="text" list={listId} value={value} onChange={(e) => onChange(e.target.value)} />
      <datalist id={listId}>
        {unitSuggestions(options).map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
    </>
  );
}
