import { describe, expect, it } from 'vitest';
import { escapeCell, toCsv } from './csv';

describe('escapeCell', () => {
  it('leaves plain text and numbers as they are', () => {
    expect(escapeCell('Баланс')).toBe('Баланс');
    expect(escapeCell(4095)).toBe('4095');
    expect(escapeCell(-5)).toBe('-5');
  });

  it('quotes cells with delimiters, quotes and line breaks', () => {
    expect(escapeCell('a;b')).toBe('"a;b"');
    expect(escapeCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCell('two\nlines')).toBe('"two\nlines"');
  });

  it('neutralises spreadsheet formulas in text', () => {
    expect(escapeCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(escapeCell('@cmd')).toBe("'@cmd");
    expect(escapeCell('+1')).toBe("'+1");
  });
});

describe('toCsv', () => {
  it('starts with a BOM and joins rows with CRLF', () => {
    const csv = toCsv([['a', 'b'], [1, 2]]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.slice(1)).toBe('a;b\r\n1;2');
  });

  it('handles an empty table', () => {
    expect(toCsv([])).toBe('﻿');
  });
});
