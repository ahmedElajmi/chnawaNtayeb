import { describe, expect, it } from 'vitest';
import type { MatchingResult } from './types';
import { displayLevel, displaySummary, type DisplayReasonCode } from './display';

const result = (over: Partial<MatchingResult>): MatchingResult => ({
  recipe: {} as MatchingResult['recipe'],
  score: 0,
  matched_ingredients: [],
  missing_ingredients: [],
  missing_key: [],
  missing_staples: [],
  substitutions: [],
  missing_cost: { min: 0, max: 0 },
  fridge_used: 0,
  tier: 'ideas',
  ...over,
});

describe('matching display: exhaustive mapping tier → display level (engine is the only source of truth)', () => {
  it('maps every engine tier to its explicit display level', () => {
    expect(displayLevel('ready')).toBe('all-present');
    expect(displayLevel('almost')).toBe('almost');
    expect(displayLevel('ideas')).toBe('ideas');
  });

  it('covers every tier: the mapping is exhaustive', () => {
    const tiers: MatchingResult['tier'][] = ['ready', 'almost', 'ideas'];
    for (const tier of tiers) {
      expect(displayLevel(tier)).toEqual(expect.any(String));
    }
  });

  it('all-present is never ready-to-cook: the unknown-quantity reason is systematic for matched items', () => {
    const s = displaySummary(result({ tier: 'ready', matched_ingredients: ['i1', 'i2'] }));
    expect(s.level).toBe('all-present');
    expect(s.action).toBe('view-recipe'); // never "start cook mode" as a guarantee
    expect(s.reasons).toContainEqual({ code: 'unknown-quantity', ingredientIds: ['i1', 'i2'] });
  });

  it('orders reasons: missing key first, then secondary, substitution, unknown quantity, cost', () => {
    const s = displaySummary(
      result({
        tier: 'almost',
        matched_ingredients: ['i3'],
        missing_key: ['k1'],
        missing_ingredients: ['k1', 's1'],
        substitutions: [{ ingredient_id: 'k2', substitute_id: 'r1' }],
        missing_cost: { min: 2, max: 5 },
      })
    );
    expect(s.level).toBe('almost');
    // unknown-quantity is systematic only for all-present; the other reasons follow the order
    expect(s.reasons.map((r) => r.code)).toEqual(['missing-key', 'missing-secondary', 'substitution', 'missing-cost']);
    expect(s.reasons[0].ingredientIds).toEqual(['k1']);
    expect(s.reasons[1].ingredientIds).toEqual(['s1']);
    expect(s.reasons[2]).toEqual({ code: 'substitution', ingredientIds: ['k2'], substituteId: 'r1' });
    expect(s.reasons[3].cost).toEqual({ min: 2, max: 5 });
    expect(s.secondaryAction).toBe('add-missing'); // secondary: add the missing to the list
  });

  it('ideas explore, and carry no unknown-quantity reason', () => {
    const s = displaySummary(result({ tier: 'ideas', matched_ingredients: ['i1'] }));
    expect(s.action).toBe('explore');
    expect(s.secondaryAction).toBeUndefined();
    expect(s.reasons.map((r) => r.code)).not.toContain('unknown-quantity');
  });

  it('no cost reason when nothing is missing, no add-missing suggestion', () => {
    const s = displaySummary(result({ tier: 'ready', matched_ingredients: ['i1'] }));
    expect(s.reasons.map((r) => r.code)).toEqual(['unknown-quantity']);
    expect(s.secondaryAction).toBeUndefined();
  });

  it('returns codes and identifiers only: no text, no language anywhere in the core', () => {
    const s = displaySummary(
      result({
        tier: 'almost',
        missing_key: ['k1'],
        missing_ingredients: ['k1'],
        substitutions: [{ ingredient_id: 'a', substitute_id: 'b' }],
        matched_ingredients: ['m1'],
        missing_cost: { min: 1, max: 3 },
      })
    );
    const codes: DisplayReasonCode[] = [
      'missing-key',
      'missing-secondary',
      'substitution',
      'unknown-quantity',
      'missing-cost',
    ];
    for (const reason of s.reasons) {
      expect(codes).toContain(reason.code);
      for (const id of reason.ingredientIds) {
        expect(typeof id).toBe('string');
      }
    }
    // The core carries no human text: reason payloads are IDs and numbers only
    expect(JSON.stringify(s.reasons)).not.toMatch(/[\u00C0-\u024F]/);
  });
});
