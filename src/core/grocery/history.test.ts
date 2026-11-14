import { describe, expect, it } from 'vitest';
import { createGroceryHistoryEntry, type GroceryHistoryInput } from './history';
import type { GroceryItem } from './types';

const item = (overrides: Partial<GroceryItem> = {}): GroceryItem => ({
  id: 'g1',
  name: 'Tomate',
  quantity: 1.5,
  unit: 'kg',
  category: 'vegetables',
  is_checked: false,
  ...overrides,
});

const newId = (prefix: string) => `${prefix}_1`;

describe('createGroceryHistoryEntry', () => {
  it('builds an entry from a valid input, generating the id when missing', () => {
    const input: GroceryHistoryInput = {
      items: [item()],
      comment: '  Courses de la semaine  ',
      planned_cost_min: 12.5,
      planned_cost_max: 20,
      spent_tnd: 18,
    };
    const entry = createGroceryHistoryEntry(input, newId);
    expect(entry).toMatchObject({
      id: 'grocery_history_1',
      comment: 'Courses de la semaine',
      items: [item()],
      planned_cost_min: 12.5,
      planned_cost_max: 20,
      spent_tnd: 18,
    });
    expect(new Date(entry!.archived_at).getTime()).not.toBeNaN();
  });

  it('keeps a provided id and archived date', () => {
    const entry = createGroceryHistoryEntry(
      { id: 'hist_9', archived_at: '2026-01-01T00:00:00.000Z', items: [] },
      newId
    );
    expect(entry?.id).toBe('hist_9');
    expect(entry?.archived_at).toBe('2026-01-01T00:00:00.000Z');
  });

  it('caps the list at 500 items', () => {
    const items = Array.from({ length: 501 }, (_, i) => item({ id: `g${i}` }));
    expect(createGroceryHistoryEntry({ items }, newId)?.items).toHaveLength(500);
  });

  it('caps the comment at 300 characters', () => {
    const entry = createGroceryHistoryEntry({ items: [], comment: 'a'.repeat(400) }, newId);
    expect(entry?.comment).toHaveLength(300);
  });

  it('drops empty optional fields', () => {
    const entry = createGroceryHistoryEntry({ items: [], comment: '   ' }, newId);
    expect(entry?.comment).toBeUndefined();
    expect(entry?.planned_cost_min).toBeUndefined();
    expect(entry?.spent_tnd).toBeUndefined();
  });

  it('returns null on garbage', () => {
    expect(createGroceryHistoryEntry(null as unknown as GroceryHistoryInput, newId)).toBeNull();
    expect(createGroceryHistoryEntry(undefined as unknown as GroceryHistoryInput, newId)).toBeNull();
    expect(createGroceryHistoryEntry({ items: 'nope' } as unknown as GroceryHistoryInput, newId)).toBeNull();
    expect(
      createGroceryHistoryEntry({ items: [{ ...item(), quantity: -1 }] } as GroceryHistoryInput, newId)
    ).toBeNull();
    expect(
      createGroceryHistoryEntry({ items: [{ ...item(), is_checked: 'yes' }] } as unknown as GroceryHistoryInput, newId)
    ).toBeNull();
    expect(createGroceryHistoryEntry({ items: [], spent_tnd: -5 }, newId)).toBeNull();
    expect(createGroceryHistoryEntry({ items: [], planned_cost_min: Infinity }, newId)).toBeNull();
    expect(createGroceryHistoryEntry({ items: [], comment: 42 } as unknown as GroceryHistoryInput, newId)).toBeNull();
  });
});
