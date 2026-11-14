import { afterEach, describe, expect, it } from 'vitest';
import { formatPrintLine } from './PrintSheet';
import { printNow } from './printNow';

describe('formatPrintLine', () => {
  it('joins name, quantity and unit', () => {
    expect(formatPrintLine('Tomates', 2, 'kg', false)).toBe('Tomates — 2 kg');
  });

  it('drops the quantity part when quantity is zero', () => {
    expect(formatPrintLine('Sel', 0, 'pincée', false)).toBe('Sel');
  });

  it('handles negative quantities like missing ones', () => {
    expect(formatPrintLine('Sel', -1, 'kg', false)).toBe('Sel');
  });

  it('marks checked items with a tick', () => {
    expect(formatPrintLine('Œufs', 6, 'pièce', true)).toBe('Œufs — 6 pièce ✓');
  });

  it('keeps the name only when the unit is empty', () => {
    expect(formatPrintLine('Pain', 1, '', false)).toBe('Pain — 1');
  });
});

describe('printNow', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    const holder = globalThis as unknown as { window?: Window };
    if (originalWindow === undefined) {
      delete holder.window;
    } else {
      holder.window = originalWindow;
    }
  });

  it('does not crash in node (no window)', () => {
    delete (globalThis as unknown as { window?: Window }).window;
    expect(() => printNow()).not.toThrow();
  });

  it('calls window.print when a window exists', () => {
    let called = 0;
    const fakeWindow = {
      print: () => {
        called += 1;
      },
    } as unknown as Window;
    (globalThis as unknown as { window: Window }).window = fakeWindow;
    printNow();
    expect(called).toBe(1);
  });

  it('does not crash when window.print is not a function', () => {
    (globalThis as unknown as { window: Window }).window = {} as Window;
    expect(() => printNow()).not.toThrow();
  });
});
