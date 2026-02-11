/**
 * OCR parsing helpers for race and qualifying sheets (Portuguese).
 */

import { normalizeText } from './matching.js';

const LAP_TIME_REGEX = /\b\d{1,2}:\d{2}\.\d{3}\b/;
const POSITION_REGEX = /^\d{1,3}$/;
const MAX_POSITION = 999;

function isHeaderLine(line) {
  const normalized = normalizeText(line);
  return normalized.includes('pos') && normalized.includes('nome');
}

function parseLine(line) {
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

  return {
    position,
    name,
    bestLapTime: tokens[lapIndex]
  };
}

export function detectSheetType(text) {
  const normalized = normalizeText(text);
  if (normalized.includes('tomada de tempo')) return 'qualifying';
  if (normalized.includes('corrida')) return 'race';
  return null;
}

function parseRowsFromText(text) {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const rows = [];
  lines.forEach((line) => {
    if (isHeaderLine(line)) return;
    const parsed = parseLine(line);
    if (parsed) rows.push(parsed);
  });

  return rows;
}

function buildTableRows(table) {
  const grid = new Map();
  const headerRows = new Set();
  (table.cells || []).forEach((cell) => {
    const rowIndex = cell.rowIndex;
    const colIndex = cell.columnIndex;
    if (!grid.has(rowIndex)) grid.set(rowIndex, new Map());
    grid.get(rowIndex).set(colIndex, (cell.content || '').trim());
    if (cell.kind === 'columnHeader') {
      headerRows.add(rowIndex);
    }
  });

  const rowIndexes = Array.from(grid.keys()).sort((a, b) => a - b);
  if (!rowIndexes.length) return [];
  const headerRowIndex = headerRows.size ? Math.min(...headerRows) : rowIndexes[0];
  const headerCells = grid.get(headerRowIndex) || new Map();
  const headerMap = {};
  headerCells.forEach((value, colIndex) => {
    const normalized = normalizeText(value);
    if (normalized.includes('pos')) headerMap.position = colIndex;
    if (normalized.includes('nome')) headerMap.name = colIndex;
    if (normalized.includes('tmv') || normalized.includes('tempo da melhor volta')) headerMap.bestLap = colIndex;
  });

  const fallbackColumns = {
    position: 0,
    name: table.columnCount >= 3 ? 2 : 1,
    bestLap: table.columnCount >= 5 ? 4 : null
  };

  const rows = [];
  rowIndexes.forEach((rowIndex) => {
    if (rowIndex === headerRowIndex) return;
    const rowCells = grid.get(rowIndex) || new Map();
    const positionCol = headerMap.position ?? fallbackColumns.position;
    const nameCol = headerMap.name ?? fallbackColumns.name;
    const bestLapCol = headerMap.bestLap ?? fallbackColumns.bestLap;

    const positionRaw = rowCells.get(positionCol) || '';
    const position = Number(String(positionRaw).trim());
    if (!Number.isFinite(position) || position <= 0 || position > MAX_POSITION) return;
    const name = rowCells.get(nameCol) || '';
    if (!name.trim()) return;
    const bestLapTime = bestLapCol !== null ? rowCells.get(bestLapCol) || '' : '';

    rows.push({
      position,
      name: name.trim(),
      bestLapTime: bestLapTime.trim()
    });
  });

  return rows;
}

function parseRowsFromTables(tables = []) {
  if (!tables.length) return [];
  const candidates = tables
    .map((table) => buildTableRows(table))
    .filter((rows) => rows.length > 0);
  if (!candidates.length) return [];
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
}

function finalizeRows(rows) {
  const unique = new Map();
  rows.forEach((row) => {
    if (!unique.has(row.position)) {
      unique.set(row.position, row);
    }
  });

  return Array.from(unique.values()).sort((a, b) => a.position - b.position);
}

export function parseOcrRows(input) {
  if (!input) return [];
  if (typeof input === 'string') {
    return finalizeRows(parseRowsFromText(input));
  }
  const rowsFromTables = parseRowsFromTables(input.tables || []);
  if (rowsFromTables.length) {
    return finalizeRows(rowsFromTables);
  }
  return finalizeRows(parseRowsFromText(input.text || ''));
}
