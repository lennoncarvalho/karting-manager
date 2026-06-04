import { describe, expect, it } from 'vitest';

import { detectSheetType, parseOcrRows } from './ocr-parsing';

describe('ocr-parsing', () => {
  describe('detectSheetType', () => {
    it('detects qualifying sheets by "tomada de tempo"', () => {
      expect(detectSheetType('Resultado Tomada de Tempo - Kartódromo')).toBe('qualifying');
    });
    it('detects race sheets by "corrida"', () => {
      expect(detectSheetType('Resultado da CORRIDA - Kartarados')).toBe('race');
    });
    it('returns null when ambiguous', () => {
      expect(detectSheetType('foo bar baz')).toBeNull();
      expect(detectSheetType('')).toBeNull();
      expect(detectSheetType(null)).toBeNull();
    });
  });

  describe('parseOcrRows (text)', () => {
    it('parses a typical 3-driver block, skips the header, dedups by position', () => {
      const text = [
        'Pos Nome TMV',
        '1 12 João Silva 1:23.456',
        '2 7  Maria Souza 0:58.910',
        '3 22 João da Silva Filho. 1:25.000',
        '3 22 Duplicated Position 1:30.000', // dropped (dup position)
        'garbage line',
      ].join('\n');
      const rows = parseOcrRows(text);
      expect(rows).toEqual([
        { position: 1, name: 'João Silva', bestLapTime: '1:23.456' },
        { position: 2, name: 'Maria Souza', bestLapTime: '0:58.910' },
        { position: 3, name: 'João da Silva Filho', bestLapTime: '1:25.000' },
      ]);
    });
    it('returns [] on empty / nullish input', () => {
      expect(parseOcrRows('')).toEqual([]);
      expect(parseOcrRows(null)).toEqual([]);
      expect(parseOcrRows(undefined)).toEqual([]);
    });
  });

  describe('parseOcrRows (Azure tables)', () => {
    it('uses column headers and prefers table over text when both present', () => {
      const tables = [{
        columnCount: 3,
        cells: [
          { rowIndex: 0, columnIndex: 0, content: 'Pos',  kind: 'columnHeader' },
          { rowIndex: 0, columnIndex: 1, content: 'Nome', kind: 'columnHeader' },
          { rowIndex: 0, columnIndex: 2, content: 'TMV',  kind: 'columnHeader' },
          { rowIndex: 1, columnIndex: 0, content: '1' },
          { rowIndex: 1, columnIndex: 1, content: 'Alice' },
          { rowIndex: 1, columnIndex: 2, content: '1:00.123' },
          { rowIndex: 2, columnIndex: 0, content: '2' },
          { rowIndex: 2, columnIndex: 1, content: 'Bob' },
          { rowIndex: 2, columnIndex: 2, content: '1:01.456' },
        ],
      }];
      const rows = parseOcrRows({ text: 'should be ignored', tables });
      expect(rows).toEqual([
        { position: 1, name: 'Alice', bestLapTime: '1:00.123' },
        { position: 2, name: 'Bob',   bestLapTime: '1:01.456' },
      ]);
    });
  });
});
