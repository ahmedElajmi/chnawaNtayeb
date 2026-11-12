import { useState, type InputHTMLAttributes } from 'react';

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number;
  onChange: (value: number) => void;
  /** Value used when the field is left empty */
  fallback?: number;
};

const parse = (text: string) => {
  const n = parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

/**
 * Number input that can be emptied while typing (no "0" stuck in front of what is typed);
 * accepts a comma; an empty field goes back to `fallback` when it loses the focus.
 */
export function NumberField({ value, onChange, fallback = 0, onBlur, ...rest }: NumberFieldProps) {
  const [text, setText] = useState(String(value));
  // Follows changes made from outside (restored draft, suggestion applied...)
  const [shown, setShown] = useState(value);
  if (value !== shown) {
    setShown(value);
    if (parse(text) !== value) setText(String(value));
  }

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = parse(e.target.value);
        if (n !== null) {
          setShown(n);
          onChange(n);
        }
      }}
      onBlur={(e) => {
        if (parse(text) === null) {
          setText(String(fallback));
          setShown(fallback);
          onChange(fallback);
        }
        onBlur?.(e);
      }}
    />
  );
}
