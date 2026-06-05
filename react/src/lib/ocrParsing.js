import { normalizeText } from "@/lib/matching";

const LAP_TIME_REGEX = /\b\d{1,2}:\d{2}\.\d{3}\b/;
const POSITION_REGEX = /^\d{1,3}$/;
const MAX_POS = 999;

function isHeaderLine(line) {
  const n = normalizeText(line);
  return n.includes("pos") && n.includes("nome");
}

function parseLine(line) {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length < 4) return null;
  if (!POSITION_REGEX.test(tokens[0])) return null;
  const position = Number(tokens[0]);
  if (!Number.isFinite(position) || position <= 0 || position > MAX_POS)
    return null;
  let index = 1;
  if (tokens[index] && POSITION_REGEX.test(tokens[index])) index += 1;
  const lapIdx = tokens.findIndex(
    (t, i) => i >= index && LAP_TIME_REGEX.test(t),
  );
  if (lapIdx === -1) return null;
  let nameEnd = lapIdx;
  if (lapIdx - 1 > index && POSITION_REGEX.test(tokens[lapIdx - 1]))
    nameEnd = lapIdx - 1;
  const name = tokens
    .slice(index, nameEnd)
    .join(" ")
    .replace(/\.+$/, "")
    .trim();
  if (!name) return null;
  return { position, name, bestLapTime: tokens[lapIdx] };
}

export function detectSheetType(text) {
  const n = normalizeText(text);
  if (n.includes("tomada de tempo")) return "qualifying";
  if (n.includes("corrida")) return "race";
  return null;
}

function parseRowsFromText(text) {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !isHeaderLine(l))
    .map(parseLine)
    .filter(Boolean);
}

function buildTableRows(table) {
  const grid = new Map();
  const headerRows = new Set();
  (table.cells || []).forEach((cell) => {
    if (!grid.has(cell.rowIndex)) grid.set(cell.rowIndex, new Map());
    grid.get(cell.rowIndex).set(cell.columnIndex, (cell.content || "").trim());
    if (cell.kind === "columnHeader") headerRows.add(cell.rowIndex);
  });
  const rowKeys = Array.from(grid.keys()).sort((a, b) => a - b);
  if (!rowKeys.length) return [];
  const headerIdx = headerRows.size ? Math.min(...headerRows) : rowKeys[0];
  const headerCells = grid.get(headerIdx) || new Map();
  const headerMap = {};
  headerCells.forEach((v, ci) => {
    const n = normalizeText(v);
    if (n.includes("pos")) headerMap.position = ci;
    if (n.includes("nome")) headerMap.name = ci;
    if (n.includes("tmv") || n.includes("tempo da melhor volta"))
      headerMap.bestLap = ci;
  });
  const fallback = {
    position: 0,
    name: table.columnCount >= 3 ? 2 : 1,
    bestLap: table.columnCount >= 5 ? 4 : null,
  };
  const rows = [];
  rowKeys.forEach((ri) => {
    if (ri === headerIdx) return;
    const rowCells = grid.get(ri) || new Map();
    const posRaw = rowCells.get(headerMap.position ?? fallback.position) || "";
    const pos = Number(String(posRaw).trim());
    if (!Number.isFinite(pos) || pos <= 0 || pos > MAX_POS) return;
    const name = rowCells.get(headerMap.name ?? fallback.name) || "";
    if (!name.trim()) return;
    const bl =
      headerMap.bestLap !== null ? rowCells.get(headerMap.bestLap) || "" : "";
    rows.push({
      position: pos,
      name: name.trim(),
      bestLapTime: String(bl).trim(),
    });
  });
  return rows;
}

function parseRowsFromTables(tables = []) {
  if (!tables.length) return [];
  const candidates = tables.map(buildTableRows).filter((r) => r.length > 0);
  if (!candidates.length) return [];
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
}

function finalizeRows(rows) {
  const unique = new Map();
  rows.forEach((r) => {
    if (!unique.has(r.position)) unique.set(r.position, r);
  });
  return Array.from(unique.values()).sort((a, b) => a.position - b.position);
}

export function parseOcrRows(input) {
  if (!input) return [];
  if (typeof input === "string") return finalizeRows(parseRowsFromText(input));
  const fromTables = parseRowsFromTables(input.tables || []);
  if (fromTables.length) return finalizeRows(fromTables);
  return finalizeRows(parseRowsFromText(input.text || ""));
}
