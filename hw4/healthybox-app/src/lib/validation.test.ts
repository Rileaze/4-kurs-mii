import { describe, expect, it } from 'vitest';
import { parsePrice } from './validation';

describe('parsePrice', () => {
  it('parses a whole positive number', () => {
    expect(parsePrice('650')).toBe(650);
    expect(parsePrice(' 790 ')).toBe(790);
  });

  it('accepts the upper bound and rejects values above it', () => {
    expect(parsePrice('100000')).toBe(100000);
    expect(parsePrice('100001')).toBeNull();
  });

  it('rejects zero, negatives, fractions and text', () => {
    for (const bad of ['0', '-5', '12.5', '12,5', 'abc', '']) {
      expect(parsePrice(bad)).toBeNull();
    }
  });
});
