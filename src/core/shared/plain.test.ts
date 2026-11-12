import { describe, expect, it } from 'vitest';
import { withoutUndefined } from './plain';

describe('withoutUndefined', () => {
  it('removes undefined keys at every level and keeps other values', () => {
    const input = { a: 1, b: undefined, c: { d: undefined, e: [1, undefined, { f: undefined, g: null }] }, h: '' };
    expect(withoutUndefined(input)).toEqual({ a: 1, c: { e: [1, { g: null }] }, h: '' });
    expect(Object.keys(withoutUndefined(input))).toEqual(['a', 'c', 'h']);
  });

  it('does not modify its input', () => {
    const input = { a: undefined };
    withoutUndefined(input);
    expect('a' in input).toBe(true);
  });
});
