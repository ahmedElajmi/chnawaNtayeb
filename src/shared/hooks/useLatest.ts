import { useLayoutEffect, useRef } from 'react';

/** Ref that always holds the latest value (read it in effects and event handlers, never during render). */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
