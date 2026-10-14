import { describe, expect, it } from 'vitest';
import { parsePrice, validateCredentials } from './validation';

describe('validateCredentials', () => {
  it('accepts a valid email and password', () => {
    expect(validateCredentials('user@example.com', 'secret1')).toBeNull();
  });

  it('accepts the shortest allowed password and trims the email', () => {
    expect(validateCredentials('  user@example.com ', '123456')).toBeNull();
  });

  it('rejects a malformed email', () => {
    expect(validateCredentials('user@', 'secret1')).toBe('Введите корректный email');
    expect(validateCredentials('', 'secret1')).toBe('Введите корректный email');
  });

  it('rejects a short password', () => {
    expect(validateCredentials('user@example.com', '12345')).toMatch(/не короче 6/);
  });
});

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
