import { describe, expect, it } from 'vitest';
import { canAccess, parseRole } from './roles';

describe('canAccess', () => {
  it('lets everyone see the public screens', () => {
    for (const role of [null, 'user', 'admin'] as const) {
      expect(canAccess(role, 'catalog')).toBe(true);
      expect(canAccess(role, 'cart')).toBe(true);
    }
  });

  it('hides orders from guests only', () => {
    expect(canAccess(null, 'orders')).toBe(false);
    expect(canAccess('user', 'orders')).toBe(true);
    expect(canAccess('admin', 'orders')).toBe(true);
  });

  it('opens the admin panel for admins only', () => {
    expect(canAccess(null, 'admin')).toBe(false);
    expect(canAccess('user', 'admin')).toBe(false);
    expect(canAccess('admin', 'admin')).toBe(true);
  });
});

describe('parseRole', () => {
  it('accepts admin', () => {
    expect(parseRole('admin')).toBe('admin');
  });

  it('falls back to user for unknown, empty or missing values', () => {
    expect(parseRole('superuser')).toBe('user');
    expect(parseRole(undefined)).toBe('user');
    expect(parseRole(null)).toBe('user');
  });
});
