import { describe, expect, it } from 'vitest';
import { buildGroceryShareText } from './share';
import type { GroceryItem } from './types';

const item = (overrides: Partial<GroceryItem>): GroceryItem => ({
  id: 'g1',
  name: 'Tomate',
  quantity: 1.5,
  unit: 'kg',
  category: 'vegetables',
  is_checked: false,
  ...overrides,
});

const groups = [
  {
    category: 'vegetables',
    items: [item({}), item({ id: 'g2', name: 'Pomme', quantity: 2, unit: 'pièce', is_checked: true })],
  },
  {
    category: 'meats',
    items: [item({ id: 'g3', name: 'Poulet', quantity: 1, unit: 'kg' })],
  },
];

describe('buildGroceryShareText', () => {
  it('builds a WhatsApp-ready text with one section per aisle', () => {
    const text = buildGroceryShareText(groups, {
      title: 'Courses de la semaine',
      comment: 'Ne pas oublier le pain',
    });
    expect(text).toBe(
      [
        'Courses de la semaine',
        'Ne pas oublier le pain',
        '',
        'vegetables',
        '☐ Tomate (1.5 kg)',
        '✅ Pomme (2 pièce)',
        '',
        'meats',
        '☐ Poulet (1 kg)',
      ].join('\n')
    );
  });

  it('falls back to a default title and no comment', () => {
    const text = buildGroceryShareText(groups);
    expect(text.startsWith('Courses\n\nvegetables')).toBe(true);
    expect(text).toContain('✅ Pomme (2 pièce)'); // checked items are kept by default
  });

  it('hides checked items when the checked label is empty', () => {
    const text = buildGroceryShareText(groups, { checkedLabel: '' });
    expect(text).not.toContain('Pomme');
    expect(text).toContain('☐ Tomate (1.5 kg)');
  });

  it('formats quantities without trailing zeros', () => {
    const text = buildGroceryShareText([
      { category: 'vegetables', items: [item({ quantity: 1.25 }), item({ quantity: 2 })] },
    ]);
    expect(text).toContain('☐ Tomate (1.25 kg)');
    expect(text).toContain('☐ Tomate (2 kg)');
  });
});
