import { describe, expect, it } from 'vitest';
import { calcSetPrice, formatRub } from './pricing';

describe('calcSetPrice', () => {
  it('returns the day price for a day', () => {
    expect(calcSetPrice('day', 650)).toBe(650);
  });

  it('applies a 10% discount for a week', () => {
    expect(calcSetPrice('week', 650)).toBe(4095);
  });

  it('rounds the weekly price to the nearest ruble', () => {
    expect(calcSetPrice('week', 335)).toBe(2111);
  });

  it('throws on a non-positive or fractional day price', () => {
    expect(() => calcSetPrice('day', 0)).toThrow(RangeError);
    expect(() => calcSetPrice('week', 10.5)).toThrow(RangeError);
  });
});

describe('formatRub', () => {
  it('formats rubles with a thousands separator', () => {
    expect(formatRub(4095).replace(/\s/g, ' ')).toBe('4 095 ₽');
  });
});
