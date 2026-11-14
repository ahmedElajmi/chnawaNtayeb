import { describe, expect, it } from 'vitest';
import {
  BUILTIN_UNIT_OPTIONS,
  UNIT_ID_PATTERN,
  UNIT_KINDS,
  parseStoredUnitInfo,
  parseStoredUnitInfos,
  unitDescriptionIndex,
  unitLookupKey,
  unitIdFromLabel,
  unitOptionsFromInfos,
  validateUnitInfo,
  type UnitInfo,
} from './info';

const makeUnit = (patch: Partial<UnitInfo> = {}): UnitInfo => ({
  id: 'c-a-s',
  label: 'c.à.s',
  kind: 'count',
  description_fr: 'Cuillère à soupe (environ 15 ml)',
  description_derja: 'Ma3l9a kbira',
  description_ar: 'ملعقة كبيرة',
  ...patch,
});

describe('parseStoredUnitInfo', () => {
  it('reads a well-formed unit, optional variant included', () => {
    const unit = parseStoredUnitInfo({ ...makeUnit({ description_derja_ar: 'معلقة' }), revision: 12 });
    expect(unit).toEqual({ ...makeUnit({ description_derja_ar: 'معلقة' }), revision: 12 });
  });

  it('keeps derja and Arabic empty (they fall back to French)', () => {
    const unit = parseStoredUnitInfo({ id: 'kg', label: 'kg', description_fr: 'Kilogramme', description_ar: 'كغ' });
    expect(unit).toEqual({
      id: 'kg',
      label: 'kg',
      kind: 'mass',
      description_fr: 'Kilogramme',
      description_derja: '',
      description_ar: 'كغ',
    });
  });

  it('infers the kind of an old document from its label', () => {
    const legacy = { id: 'kg', label: 'kg', description_fr: 'Kilogramme' };
    expect(parseStoredUnitInfo(legacy)?.kind).toBe('mass');
    expect(parseStoredUnitInfo({ id: 'l', label: 'L', description_fr: 'Litre' })?.kind).toBe('volume');
    expect(parseStoredUnitInfo({ id: 'botte', label: 'botte', description_fr: 'Botte' })?.kind).toBe('count');
    expect(parseStoredUnitInfo({ id: 'c-a-s', label: 'c.à.s', description_fr: 'Cuillère' })?.kind).toBe('count');
    expect(parseStoredUnitInfo({ id: 'bol', label: 'c.à.s / bol', description_fr: 'Bol' })?.kind).toBe('other');
  });

  it('keeps a valid stored kind, repairs an unknown one from the label', () => {
    expect(parseStoredUnitInfo({ ...makeUnit(), kind: 'volume' })?.kind).toBe('volume');
    expect(parseStoredUnitInfo({ ...makeUnit(), kind: 'banana' })?.kind).toBe('count');
  });

  it('drops what is not usable', () => {
    expect(parseStoredUnitInfo(null)).toBeNull();
    expect(parseStoredUnitInfo('kg')).toBeNull();
    expect(parseStoredUnitInfo({ label: 'kg', description_fr: 'Kilogramme' })).toBeNull(); // no id
    expect(parseStoredUnitInfo(makeUnit({ id: 'KG !' }))).toBeNull(); // id invalid
    expect(parseStoredUnitInfo(makeUnit({ id: 'a'.repeat(65) }))).toBeNull(); // too long
    expect(parseStoredUnitInfo(makeUnit({ label: '  ' }))).toBeNull(); // no label
    expect(parseStoredUnitInfo(makeUnit({ description_fr: '' }))).toBeNull(); // no French description
    expect(parseStoredUnitInfo({ ...makeUnit(), deleted: true })).toBeNull(); // deletion marker
  });

  it('drops an empty optional variant (never stored empty)', () => {
    const unit = parseStoredUnitInfo(makeUnit({ description_derja_ar: '  ' }));
    expect(unit).not.toHaveProperty('description_derja_ar');
  });

  it('reads a whole list, invalid entries left out', () => {
    const units = parseStoredUnitInfos([makeUnit({ id: 'kg', label: 'kg', description_fr: 'Kilogramme' }), 42, null]);
    expect(units.map((u) => u.id)).toEqual(['kg']);
  });
});

describe('unitIdFromLabel', () => {
  it('slugifies the label', () => {
    expect(unitIdFromLabel('c.à.s')).toBe('c-a-s');
    expect(unitIdFromLabel('100 g')).toBe('100-g');
    expect(unitIdFromLabel(' Pièce ')).toBe('piece');
    expect(unitIdFromLabel('boîte (500 g)')).toBe('boite-500-g');
  });

  it('gives an empty id when nothing usable remains', () => {
    expect(unitIdFromLabel('///')).toBe('');
    expect(unitIdFromLabel('   ')).toBe('');
  });

  it('stays within the id pattern', () => {
    expect(unitIdFromLabel('a'.repeat(80))).toHaveLength(64);
    expect(UNIT_ID_PATTERN.test(unitIdFromLabel('a'.repeat(80)))).toBe(true);
  });
});

describe('unitDescriptionIndex', () => {
  it('indexes every unit by its label and its id (lookup keys), ignoring case and spacing', () => {
    const index = unitDescriptionIndex([makeUnit({ id: 'kg', label: 'kg', description_fr: 'Kilogramme' })]);
    expect(index.get(unitLookupKey(' KG '))?.description_fr).toBe('Kilogramme');
    expect(index.get(unitLookupKey('kg  '))).toBeDefined();
    expect(index.has(unitLookupKey('unknown'))).toBe(false);
  });
});

describe('validateUnitInfo', () => {
  const stored = [makeUnit({ id: 'kg', label: 'kg', description_fr: 'Kilogramme' })];

  it('accepts a new unit', () => {
    expect(validateUnitInfo(makeUnit(), stored)).toEqual([]);
  });

  it('asks for an id, a label and a French description', () => {
    const errors = validateUnitInfo({ ...makeUnit(), id: 'BAD', label: ' ', description_fr: '' }, stored);
    expect(errors).toEqual([
      { field: 'id', problem: 'id-invalid' },
      { field: 'label', problem: 'label-required' },
      { field: 'description', problem: 'description-required' },
    ]);
  });

  it('asks for a valid kind', () => {
    expect(validateUnitInfo({ ...makeUnit(), kind: 'banana' as UnitInfo['kind'] }, stored)).toEqual([
      { field: 'kind', problem: 'kind-invalid' },
    ]);
    for (const kind of UNIT_KINDS) {
      expect(validateUnitInfo({ ...makeUnit(), kind }, stored)).toEqual([]);
    }
  });

  it('refuses a label already described, even written differently', () => {
    expect(validateUnitInfo(makeUnit({ label: ' KG ' }), stored)).toEqual([{ field: 'label', problem: 'label-taken' }]);
  });

  it('lets a unit keep its own label when edited', () => {
    expect(
      validateUnitInfo(makeUnit({ id: 'kg', label: 'kg', description_fr: 'Kilogramme (1000 g)' }), stored)
    ).toEqual([]);
  });

  it('refuses a label that is the id of another unit', () => {
    expect(validateUnitInfo(makeUnit({ label: 'kg', id: 'kilogramme' }), stored)).toEqual([
      { field: 'label', problem: 'label-taken' },
    ]);
  });
});

describe('BUILTIN_UNIT_OPTIONS', () => {
  it('classifies the common units like the matching engine does', () => {
    expect(BUILTIN_UNIT_OPTIONS.filter((o) => o.kind === 'mass').map((o) => o.label)).toEqual(['g', 'kg']);
    expect(BUILTIN_UNIT_OPTIONS.filter((o) => o.kind === 'volume').map((o) => o.label)).toEqual(['cl', 'L', 'ml']);
    expect(BUILTIN_UNIT_OPTIONS.filter((o) => o.kind === 'count').map((o) => o.label)).toEqual([
      'boîte',
      'botte',
      'c.à.c',
      'c.à.s',
      'feuilles',
      'gousses',
      'paquet',
      'pièce',
      'pincée',
      'sachet',
      'tranche',
      'verre',
    ]);
    expect(BUILTIN_UNIT_OPTIONS.filter((o) => o.kind === 'other')).toEqual([]);
  });

  it('holds unique labels of a valid kind, already sorted by kind then label', () => {
    const labels = BUILTIN_UNIT_OPTIONS.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const option of BUILTIN_UNIT_OPTIONS) expect(UNIT_KINDS).toContain(option.kind);
    const order = { mass: 0, volume: 1, count: 2, other: 3 } as const;
    expect(BUILTIN_UNIT_OPTIONS).toEqual(
      [...BUILTIN_UNIT_OPTIONS].sort(
        (a, b) => order[a.kind] - order[b.kind] || unitLookupKey(a.label).localeCompare(unitLookupKey(b.label))
      )
    );
  });
});

describe('unitOptionsFromInfos', () => {
  it('sorts the registry by kind (mass and volume first) then label', () => {
    const options = unitOptionsFromInfos([
      makeUnit({ id: 'verre', label: 'verre', kind: 'count', description_fr: 'Verre' }),
      makeUnit({ id: 'kg', label: 'kg', kind: 'mass', description_fr: 'Kilogramme' }),
      makeUnit({ id: 'l', label: 'L', kind: 'volume', description_fr: 'Litre' }),
      makeUnit({ id: 'g', label: 'g', kind: 'mass', description_fr: 'Gramme' }),
      makeUnit({ id: 'ml', label: 'ml', kind: 'volume', description_fr: 'Millilitre' }),
    ]);
    expect(options).toEqual([
      { label: 'g', kind: 'mass' },
      { label: 'kg', kind: 'mass' },
      { label: 'L', kind: 'volume' },
      { label: 'ml', kind: 'volume' },
      { label: 'verre', kind: 'count' },
    ]);
  });

  it('keeps the kind of the document and skips deletion markers', () => {
    const options = unitOptionsFromInfos([
      makeUnit({ id: 'kg', label: 'kg', kind: 'mass', description_fr: 'Kilogramme' }),
      { ...makeUnit({ id: 'old', label: 'old' }), deleted: true } as UnitInfo,
    ]);
    expect(options).toEqual([{ label: 'kg', kind: 'mass' }]);
  });
});
