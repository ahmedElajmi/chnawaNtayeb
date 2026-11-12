import { useId, type InputHTMLAttributes } from 'react';

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

export function UnitInput({ value, onChange, ...rest }: UnitInputProps) {
  const listId = useId();
  return (
    <>
      <input {...rest} type="text" list={listId} value={value} onChange={(e) => onChange(e.target.value)} />
      <datalist id={listId}>
        {COMMON_UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
    </>
  );
}
