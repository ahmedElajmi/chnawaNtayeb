import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import {
  buildHistoryRow,
  buildHistoryRows,
  buildTotalsRow,
  DASH,
  addHistorySheet,
  formatHistoryDate,
  formatMoney,
  type ExportHistoryOptions,
  type HistoryEntryLike,
} from './exportHistoryXlsx';

const options: ExportHistoryOptions = {
  fileName: 'historique.xlsx',
  sheetTitle: 'Historique',
  columnLabels: {
    date: 'Date',
    comment: 'Commentaire',
    items: 'Articles',
    planned: 'Prévu',
    actual: 'Réel',
    gap: 'Écart',
    total: 'Total',
  },
  currency: 'TND',
  brandColor: '#7c2d12',
};

function entry(overrides: Partial<HistoryEntryLike> = {}): HistoryEntryLike {
  return {
    id: 'e1',
    archived_at: '2026-03-05T09:30:00.000Z',
    comment: 'weekly run',
    items: [
      { name: 'Tomates', quantity: 2, unit: 'kg', is_checked: true },
      { name: 'Oignons', quantity: 1, unit: 'kg' },
    ],
    planned_cost_min: 10,
    planned_cost_max: 20,
    spent_tnd: 15,
    ...overrides,
  };
}

describe('formatHistoryDate', () => {
  it('extracts YYYY-MM-DD from an ISO timestamp', () => {
    expect(formatHistoryDate('2026-03-05T09:30:00.000Z')).toBe('2026-03-05');
  });

  it('accepts a plain date string', () => {
    expect(formatHistoryDate('2026-03-05')).toBe('2026-03-05');
  });

  it('converts other parseable dates using the local calendar date', () => {
    expect(formatHistoryDate('March 5, 2026')).toBe('2026-03-05');
  });

  it('falls back to the raw string when unparseable', () => {
    expect(formatHistoryDate('not-a-date')).toBe('not-a-date');
  });
});

describe('formatMoney', () => {
  it('appends the currency and trims trailing decimals', () => {
    expect(formatMoney(15, 'TND')).toBe('15 TND');
    expect(formatMoney(12.345, 'TND')).toBe('12.35 TND');
  });
});

describe('buildHistoryRow', () => {
  it('formats a fully populated entry', () => {
    const row = buildHistoryRow(entry(), options);
    expect(row.date).toBe('2026-03-05');
    expect(row.comment).toBe('weekly run');
    expect(row.itemCount).toBe(2);
    expect(row.planned).toBe('10 – 20 TND');
    expect(row.actualLabel).toBe('15 TND');
    // actual (15) is within [10, 20] but above min → orange
    expect(row.gapLabel).toBe('0 TND');
    expect(row.gapColor).toBe('#b45309');
  });

  it('colors the gap green when actual is at or below the planned min', () => {
    expect(buildHistoryRow(entry({ spent_tnd: 10 }), options).gapColor).toBe('#15803d');
    expect(buildHistoryRow(entry({ spent_tnd: 5 }), options).gapColor).toBe('#15803d');
    expect(buildHistoryRow(entry({ spent_tnd: 5 }), options).gapLabel).toBe('-10 TND');
  });

  it('colors the gap orange when actual is above min but at or below max', () => {
    expect(buildHistoryRow(entry({ spent_tnd: 15.5 }), options).gapColor).toBe('#b45309');
    expect(buildHistoryRow(entry({ spent_tnd: 20 }), options).gapColor).toBe('#b45309');
  });

  it('colors the gap red beyond the planned max', () => {
    expect(buildHistoryRow(entry({ spent_tnd: 21 }), options).gapColor).toBe('#b91c1c');
    expect(buildHistoryRow(entry({ spent_tnd: 21 }), options).gapLabel).toBe('6 TND');
  });

  it('uses dashes when planned bounds are missing', () => {
    const row = buildHistoryRow(entry({ planned_cost_min: undefined, planned_cost_max: undefined }), options);
    expect(row.planned).toBe(DASH);
    expect(row.gapLabel).toBe(DASH);
    expect(row.gapColor).toBeNull();
  });

  it('uses dashes when actual spend is missing', () => {
    const row = buildHistoryRow(entry({ spent_tnd: undefined }), options);
    expect(row.actualLabel).toBe(DASH);
    expect(row.gapLabel).toBe(DASH);
    expect(row.gapColor).toBeNull();
  });

  it('defaults the comment to an empty string', () => {
    expect(buildHistoryRow(entry({ comment: undefined }), options).comment).toBe('');
  });

  it('counts items even without costs', () => {
    const row = buildHistoryRow(
      entry({ planned_cost_min: undefined, planned_cost_max: undefined, spent_tnd: undefined }),
      options
    );
    expect(row.itemCount).toBe(2);
  });
});

describe('buildHistoryRows', () => {
  it('returns one row per entry, in order', () => {
    const rows = buildHistoryRows([entry({ id: 'a' }), entry({ id: 'b' })], options);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => typeof r.date === 'string')).toBe(true);
  });

  it('returns an empty array for empty input', () => {
    expect(buildHistoryRows([], options)).toEqual([]);
  });
});

describe('buildTotalsRow', () => {
  it('sums items, planned bounds, actual spend and gaps', () => {
    const entries = [
      entry({ id: 'a', planned_cost_min: 10, planned_cost_max: 20, spent_tnd: 12 }),
      entry({ id: 'b', planned_cost_min: 30, planned_cost_max: 40, spent_tnd: 50 }),
    ];
    const totals = buildTotalsRow(entries, options);
    expect(totals.label).toBe('Total');
    expect(totals.itemCount).toBe(4);
    expect(totals.planned).toBe('40 – 60 TND');
    expect(totals.actualLabel).toBe('62 TND');
    // gaps: 12 - 15 = -3 and 50 - 35 = 15 → sum 12
    expect(totals.gapLabel).toBe('12 TND');
  });

  it('uses dashes when no entry has plans or spend', () => {
    const totals = buildTotalsRow(
      [entry({ planned_cost_min: undefined, planned_cost_max: undefined, spent_tnd: undefined })],
      options
    );
    expect(totals.planned).toBe(DASH);
    expect(totals.actualLabel).toBe(DASH);
    expect(totals.gapLabel).toBe(DASH);
    expect(totals.itemCount).toBe(2);
  });

  it('sums the gap only over entries where it is computable', () => {
    const entries = [
      entry({ id: 'a', planned_cost_min: 0, planned_cost_max: 10, spent_tnd: 20 }), // gap +15
      entry({ id: 'b', planned_cost_min: undefined, planned_cost_max: undefined, spent_tnd: 5 }), // ignored
    ];
    expect(buildTotalsRow(entries, options).gapLabel).toBe('15 TND');
  });
});

describe('addHistorySheet (in-memory workbook round trip)', () => {
  it('produces a styled sheet that reloads with the expected values', async () => {
    const rows = buildHistoryRows(
      [
        entry(),
        entry({
          id: 'e2',
          archived_at: '2026-03-12T00:00:00.000Z',
          comment: undefined,
          spent_tnd: 25,
        }),
      ],
      options
    );
    const totals = buildTotalsRow([entry(), entry({ id: 'e2', spent_tnd: 25 })], options);

    const workbook = new ExcelJS.Workbook();
    const sheet = addHistorySheet(workbook, rows, totals, options);
    expect(workbook.worksheets).toHaveLength(1);

    const buffer = await workbook.xlsx.writeBuffer();
    const reloaded = new ExcelJS.Workbook();
    await reloaded.xlsx.load(buffer as ArrayBuffer);

    const back = reloaded.getWorksheet(options.sheetTitle)!;
    expect(back).toBeDefined();

    // Header: translated labels, white bold on brand fill.
    const header = back.getRow(1);
    expect(header.getCell(1).value).toBe('Date');
    expect(header.getCell(6).value).toBe('Écart');
    expect(header.font?.bold).toBe(true);
    expect(header.font?.color?.argb).toBe('FFFFFFFF');
    expect((header.fill as ExcelJS.FillPattern | undefined)?.fgColor?.argb).toBe('FF7C2D12');
    expect(header.getCell(1).border?.top?.style).toBe('thin');

    // Data rows.
    expect(back.getCell(2, 1).value).toBe('2026-03-05');
    expect(back.getCell(2, 3).value).toBe(2);
    expect(back.getCell(2, 4).value).toBe('10 – 20 TND');
    expect(back.getCell(2, 5).value).toBe('15 TND');
    expect(back.getCell(3, 1).value).toBe('2026-03-12');
    expect(back.getCell(3, 5).value).toBe('25 TND');

    // Banded fill on the second data row.
    expect((back.getRow(3).fill as ExcelJS.FillPattern).fgColor?.argb).toBe('FFF3F4F6');
    expect(back.getRow(2).fill).toBeUndefined();

    // Totals row: bold, translated label, sum of item counts.
    const totalsRow = back.getRow(4);
    expect(totalsRow.getCell(1).value).toBe('Total');
    expect(totalsRow.getCell(3).value).toBe(4);
    expect(totalsRow.font?.bold).toBe(true);

    // Frozen header + page setup.
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 });
    expect(sheet.pageSetup?.fitToPage).toBe(true);
    expect(sheet.pageSetup?.printArea).toBe('A1:F4');
  });

  it('does not add a banding fill when there is a single data row', () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = addHistorySheet(
      workbook,
      [buildHistoryRow(entry(), options)],
      buildTotalsRow([entry()], options),
      options
    );
    expect(sheet.getRow(2).fill).toBeUndefined();
  });
});
