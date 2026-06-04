/**
 * OCR row parser — port of v1 `frontend/src/utils/parsing.js`.
 *
 * Supports two input shapes:
 *   - raw text (from Tesseract or Azure `content`)
 *   - `{ text, tables }` payload from Azure Document Intelligence
 *     where `tables[].cells[]` carry `{ rowIndex, columnIndex, content, kind }`.
 */

import { normalizeText } from './ocr-matching';

const LAP_TIME_REGEX = /\b\d{1,2}:\d{2}\.\d{3}\b/;
const POSITION_REGEX = /^\d{1,3}$/;
const MAX_POSITION = 999;

export interface ParsedRow {
  position: number;
  name: string;
  bestLapTime: string;
}

export type SheetType = 'race' | 'qualifying';

export interface OcrTableCell {
  rowIndex: number;
  columnIndex: number;
  content?: string;
  kind?: string;
}
export interface OcrTable {
  cells?: OcrTableCell[];
  columnCount?: number;
}
export interface OcrPayload {
  text?: string;
  tables?: OcrTable[];
}

/** Detect sheet type from OCR text. `null` when ambiguous. */
export function detectSheetType(text: string | null | undefined): SheetType | null {
  const normalized = normalizeText(text ?? '');
  if (normalized.includes('tomada de tempo')) return 'qualifying';
  if (normalized.includes('corrida')) return 'race';
  return null;
}

function isHeaderLine(line: string): boolean {
  const normalized = normalizeText(line);
  return normalized.includes('pos') && normalized.includes('nome');
}

function parseLine(line: string): ParsedRow | null {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length < 4) return null;
  if (!POSITION_REGEX.test(tokens[0])) return null;
  const position = Number(tokens[0]);
  if (!Number.isFinite(position) || position <= 0 || position > MAX_POSITION) return null;

  let index = 1;
  if (tokens[index] && POSITION_REGEX.test(tokens[index])) {
    index += 1;
  }

  const lapIndex = tokens.findIndex((token, idx) => idx >= index && LAP_TIME_REGEX.test(token));
  if (lapIndex === -1) return null;

  let nameEnd = lapIndex;
  if (lapIndex - 1 > index && POSITION_REGEX.test(tokens[lapIndex - 1])) {
    nameEnd = lapIndex - 1;
  }
  const name = tokens.slice(index, nameEnd).join(' ').replace(/\.+$/, '').trim();
  if (!name) return null;

  return { position, name, bestLapTime: tokens[lapIndex] };
}

function parseRowsFromText(text: string): ParsedRow[] {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const rows: ParsedRow[] = [];
  for (const line of lines) {
    if (isHeaderLine(line)) continue;
    const parsed = parseLine(line);
    if (parsed) rows.push(parsed);
  }
  return rows;
}

function buildTableRows(table: OcrTable): ParsedRow[] {
  const grid = new Map<number, Map<number, string>>();
  const headerRows = new Set<number>();
  (table.cells ?? []).forEach((cell) => {
    if (!grid.has(cell.rowIndex)) grid.set(cell.rowIndex, new Map());
    grid.get(cell.rowIndex)!.set(cell.columnIndex, (cell.content ?? '').trim());
    if (cell.kind === 'columnHeader') headerRows.add(cell.rowIndex);
  });

  const rowIndexes = Array.from(grid.keys()).sort((a, b) => a - b);
  if (!rowIndexes.length) return [];
  const headerRowIndex = headerRows.size ? Math.min(...headerRows) : rowIndexes[0];
  const headerCells = grid.get(headerRowIndex) ?? new Map<number, string>();
  const headerMap: Partial<Record<'position' | 'name' | 'bestLap', number>> = {};
  headerCells.forEach((value, colIndex) => {
    const n = normalizeText(value);
    if (n.includes('pos')) headerMap.position = colIndex;
    if (n.includes('nome')) headerMap.name = colIndex;
    if (n.includes('tmv') || n.includes('tempo da melhor volta')) headerMap.bestLap = colIndex;
  });

  const colCount = table.columnCount ?? 0;
  const fallback = {
    position: 0,
    name: colCount >= 3 ? 2 : 1,
    bestLap: colCount >= 5 ? 4 : null,
  };

  const rows: ParsedRow[] = [];
  rowIndexes.forEach((rowIndex) => {
    if (rowIndex === headerRowIndex) return;
    const rowCells = grid.get(rowIndex) ?? new Map<number, string>();
    const positionCol = headerMap.position ?? fallback.position;
    const nameCol = headerMap.name ?? fallback.name;
    const bestLapCol = headerMap.bestLap ?? fallback.bestLap;

    const positionRaw = rowCells.get(positionCol) ?? '';
    const position = Number(String(positionRaw).trim());
    if (!Number.isFinite(position) || position <= 0 || position > MAX_POSITION) return;
    const name = rowCells.get(nameCol) ?? '';
    if (!name.trim()) return;
    const bestLapTime = bestLapCol !== null && bestLapCol !== undefined
      ? (rowCells.get(bestLapCol) ?? '')
      : '';

    rows.push({ position, name: name.trim(), bestLapTime: bestLapTime.trim() });
  });

  return rows;
}

function parseRowsFromTables(tables: OcrTable[] = []): ParsedRow[] {
  if (!tables.length) return [];
  const candidates = tables.map(buildTableRows).filter((rows) => rows.length > 0);
  if (!candidates.length) return [];
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
}

function finalizeRows(rows: ParsedRow[]): ParsedRow[] {
  const unique = new Map<number, ParsedRow>();
  rows.forEach((row) => { if (!unique.has(row.position)) unique.set(row.position, row); });
  return Array.from(unique.values()).sort((a, b) => a.position - b.position);
}

/** Parse rows from either raw text or `{ text, tables }`. */
export function parseOcrRows(input: string | OcrPayload | null | undefined): ParsedRow[] {
  if (!input) return [];
  if (typeof input === 'string') return finalizeRows(parseRowsFromText(input));
  const rowsFromTables = parseRowsFromTables(input.tables ?? []);
  if (rowsFromTables.length) return finalizeRows(rowsFromTables);
  return finalizeRows(parseRowsFromText(input.text ?? ''));
}
