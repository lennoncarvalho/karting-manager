import { describe, expect, it } from 'vitest';

import type { Driver } from './models';
import { matchDriverName, normalizeText, similarityScore } from './ocr-matching';

const drivers: Driver[] = [
  { id: 'a', email: 'a@x', name: 'João Silva' },
  { id: 'b', email: 'b@x', name: 'Maria Souza' },
  { id: 'c', email: 'c@x', name: 'Carlos Andrade' },
];

describe('ocr-matching', () => {
  it('normalizes accents and punctuation case-insensitively', () => {
    expect(normalizeText('João  da Silva!!')).toBe('joao da silva');
    expect(normalizeText('  ')).toBe('');
  });

  it('similarityScore returns 1 for accent-equivalent strings', () => {
    expect(similarityScore('João Silva', 'joao silva')).toBe(1);
  });

  it('auto-matches an exact name', () => {
    const m = matchDriverName('Joao Silva', drivers);
    expect(m.best?.id).toBe('a');
    expect(m.candidates.length).toBeGreaterThan(0);
  });

  it('does NOT auto-match when no candidate clears the score floor', () => {
    const m = matchDriverName('ZZZ Unknown', drivers);
    expect(m.best).toBeNull();
    expect(m.candidates).toEqual([]);
  });

  it('returns null + candidates for empty input', () => {
    const m = matchDriverName('   ', drivers);
    expect(m.best).toBeNull();
    expect(m.candidates).toEqual([]);
    expect(m.normalized).toBe('');
  });
});
