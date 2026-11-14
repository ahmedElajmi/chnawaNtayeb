/**
 * Styled Excel export of archived shopping lists.
 *
 * All user-facing labels come in via `options` (the app is 4-language);
 * nothing is hardcoded here.
 *
 * exceljs is loaded lazily via dynamic import so it never lands in the
 * startup bundle.
 */

/** Structural, loose view of an archived shopping-list entry. */
export interface HistoryEntryLike {
  id: string;
  archived_at: string;
  comment?: string;
  items: { name: string; quantity: number; unit: string; is_checked?: boolean }[];
  planned_cost_min?: number;
  planned_cost_max?: number;
  spent_tnd?: number;
}

export interface ExportColumnLabels {
  date: string;
  comment: string;
  items: string;
  planned: string;
  actual: string;
  gap: string;
  /** Label used for the bold totals row at the bottom. */
  total: string;
}

export interface ExportHistoryOptions {
  fileName: string;
  sheetTitle: string;
  columnLabels: ExportColumnLabels;
  currency: string;
  /** Hex color (with or without '#') used for the header fill. */
  brandColor: string;
}

export interface HistoryRow {
  date: string;
  comment: string;
  itemCount: number;
  /** "min – max {currency}" or "—". */
  planned: string;
  /** Display label for the actual spend ("12.5 TND" or "—"). */
  actualLabel: string;
  actualValue: number | null;
  /** Display label for the gap vs planned middle ("3 TND" or "—"). */
  gapLabel: string;
  gapValue: number | null;
  /** Hex font color for the gap cell, or null for neutral. */
  gapColor: string | null;
}

export interface HistoryTotalsRow {
  /** First-cell label (the translated "Total" column label). */
  label: string;
  itemCount: number;
  planned: string;
  actualLabel: string;
  gapLabel: string;
}

export const DASH = '—';
const GAP_WITHIN_MIN = '#15803d'; // green: actual ≤ planned min
const GAP_WITHIN_MAX = '#b45309'; // orange: actual ≤ planned max
const GAP_OVER = '#b91c1c'; // red: beyond planned max

function normalizeHex(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}

/** Formats a number with at most 2 decimals, no locale dependency. */
function formatNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

export function formatMoney(value: number, currency: string): string {
  return `${formatNumber(value)} ${currency}`;
}

/**
 * Extracts the YYYY-MM-DD part of an ISO-ish timestamp. ISO-like inputs use
 * their literal date prefix (no timezone shift); other parseable strings fall
 * back to their local calendar date; anything else is passed through.
 */
export function formatHistoryDate(archivedAt: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(archivedAt)) return archivedAt.slice(0, 10);
  const parsed = new Date(archivedAt);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return archivedAt;
}

/** Builds the display strings + gap colors for one entry. */
export function buildHistoryRow(entry: HistoryEntryLike, options: ExportHistoryOptions): HistoryRow {
  const currency = options.currency;
  const hasPlanned = typeof entry.planned_cost_min === 'number' && typeof entry.planned_cost_max === 'number';
  const planned = hasPlanned
    ? `${formatNumber(entry.planned_cost_min!)} – ${formatNumber(entry.planned_cost_max!)} ${currency}`
    : DASH;

  const hasActual = typeof entry.spent_tnd === 'number';
  const actualValue = hasActual ? entry.spent_tnd! : null;

  let gapValue: number | null = null;
  let gapColor: string | null = null;
  if (hasActual && hasPlanned) {
    const middle = (entry.planned_cost_min! + entry.planned_cost_max!) / 2;
    gapValue = entry.spent_tnd! - middle;
    if (entry.spent_tnd! <= entry.planned_cost_min!) gapColor = GAP_WITHIN_MIN;
    else if (entry.spent_tnd! <= entry.planned_cost_max!) gapColor = GAP_WITHIN_MAX;
    else gapColor = GAP_OVER;
  }

  return {
    date: formatHistoryDate(entry.archived_at),
    comment: entry.comment ?? '',
    itemCount: entry.items.length,
    planned,
    actualLabel: hasActual ? formatMoney(actualValue!, currency) : DASH,
    actualValue,
    gapLabel: gapValue === null ? DASH : formatMoney(gapValue, currency),
    gapValue,
    gapColor,
  };
}

/**
 * One display row per entry, in sheet order.
 */
export function buildHistoryRows(entries: HistoryEntryLike[], options: ExportHistoryOptions): HistoryRow[] {
  return entries.map((entry) => buildHistoryRow(entry, options));
}

/**
 * Totals row at the bottom of the sheet:
 * - items: sum of per-entry item counts
 * - planned: "min – max {currency}" summed over entries that have both bounds
 *   ('—' when no entry carries a plan)
 * - actual: sum of spent amounts over entries that have one ('—' otherwise)
 * - gap: sum of gaps over the entries where a gap is computable ('—' otherwise)
 */
export function buildTotalsRow(entries: HistoryEntryLike[], options: ExportHistoryOptions): HistoryTotalsRow {
  const itemCount = entries.reduce((sum, e) => sum + e.items.length, 0);

  let hasPlanned = false;
  let plannedMinSum = 0;
  let plannedMaxSum = 0;
  for (const e of entries) {
    if (typeof e.planned_cost_min === 'number' && typeof e.planned_cost_max === 'number') {
      hasPlanned = true;
      plannedMinSum += e.planned_cost_min;
      plannedMaxSum += e.planned_cost_max;
    }
  }

  const hasActual = entries.some((e) => typeof e.spent_tnd === 'number');
  const actualSum = entries.reduce((acc, e) => acc + (e.spent_tnd ?? 0), 0);

  let hasGap = false;
  let gapSum = 0;
  for (const e of entries) {
    if (
      typeof e.spent_tnd === 'number' &&
      typeof e.planned_cost_min === 'number' &&
      typeof e.planned_cost_max === 'number'
    ) {
      hasGap = true;
      gapSum += e.spent_tnd - (e.planned_cost_min + e.planned_cost_max) / 2;
    }
  }

  return {
    label: options.columnLabels.total,
    itemCount,
    planned: hasPlanned ? `${formatNumber(plannedMinSum)} – ${formatNumber(plannedMaxSum)} ${options.currency}` : DASH,
    actualLabel: hasActual ? formatMoney(actualSum, options.currency) : DASH,
    gapLabel: hasGap ? formatMoney(gapSum, options.currency) : DASH,
  };
}

type ExcelWorkbook = import('exceljs').Workbook;
type ExcelWorksheet = import('exceljs').Worksheet;

const COL_WIDTHS = [12, 32, 8, 20, 14, 14];

/**
 * Fills a workbook with the styled history sheet. Pure with respect to the
 * passed workbook (exceljs is handed in, so this stays testable in node).
 */
export function addHistorySheet(
  workbook: ExcelWorkbook,
  rows: HistoryRow[],
  totals: HistoryTotalsRow,
  options: ExportHistoryOptions
): ExcelWorksheet {
  const labels = options.columnLabels;
  const brandColor = normalizeHex(options.brandColor);
  const sheet = workbook.addWorksheet(options.sheetTitle);

  // Header row: bold white on brand color, thin borders.
  const header = sheet.addRow([labels.date, labels.comment, labels.items, labels.planned, labels.actual, labels.gap]);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argbFromHex(brandColor) } };
  header.alignment = { vertical: 'middle', horizontal: 'left' };
  header.eachCell((cell) => {
    cell.border = thinBorder();
  });

  // Data rows with banded (alternating) light fill.
  rows.forEach((row, index) => {
    const added = sheet.addRow([row.date, row.comment, row.itemCount, row.planned, row.actualLabel, row.gapLabel]);
    added.eachCell((cell) => {
      cell.border = thinBorder();
    });
    if (index % 2 === 1) {
      added.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    }
    // Gap cell color.
    if (row.gapColor) {
      added.getCell(6).font = { color: { argb: argbFromHex(row.gapColor) } };
    }
  });

  // Totals row: bold.
  const totalsRow = sheet.addRow([
    totals.label,
    '',
    totals.itemCount,
    totals.planned,
    totals.actualLabel,
    totals.gapLabel,
  ]);
  totalsRow.font = { bold: true };
  totalsRow.eachCell((cell) => {
    cell.border = thinBorder();
  });

  // Column widths + freeze header + page setup.
  COL_WIDTHS.forEach((width, i) => {
    sheet.getColumn(i + 1).width = width;
  });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.pageSetup = {
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    printArea: `A1:F${sheet.rowCount}`,
  };

  return sheet;
}

function argbFromHex(hex: string): string {
  const h = hex.replace('#', '').toUpperCase();
  return `FF${h}`;
}

function thinBorder() {
  return {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    right: { style: 'thin' as const },
  };
}

/**
 * Builds the workbook in memory and triggers a download via a temporary
 * anchor (same pattern as src/shared/ui/download.ts downloadTextFile).
 */
export async function exportHistoryXlsx(entries: HistoryEntryLike[], options: ExportHistoryOptions): Promise<void> {
  const rows = buildHistoryRows(entries, options);
  const totals = buildTotalsRow(entries, options);

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  addHistorySheet(workbook, rows, totals, options);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: options.fileName });
  link.click();
  URL.revokeObjectURL(url);
}
