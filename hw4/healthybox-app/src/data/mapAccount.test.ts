import { describe, expect, it } from 'vitest';
import { mapOrderRows, mapProfileRows } from './mapAccount';

describe('mapOrderRows', () => {
  it('maps a view row to an order summary', () => {
    const rows = [
      { id: 'o1', user_id: 'u1', status: 'placed', delivery_date: '2026-10-20', created_at: 't', total: 4095 },
    ];
    expect(mapOrderRows(rows)).toEqual([
      { id: 'o1', userId: 'u1', status: 'placed', deliveryDate: '2026-10-20', createdAt: 't', total: 4095 },
    ]);
  });

  it('falls back to safe defaults for odd values', () => {
    const [order] = mapOrderRows([{ id: 'o2', status: 'weird', total: 'x' }]);
    expect(order.status).toBe('draft');
    expect(order.total).toBe(0);
  });

  it('returns an empty list for a non-array response', () => {
    expect(mapOrderRows(null)).toEqual([]);
    expect(mapOrderRows([null, 5])).toEqual([]);
  });
});

describe('mapProfileRows', () => {
  it('keeps admin and downgrades unknown roles to user', () => {
    const rows = [
      { id: 'a', email: 'a@x.ru', role: 'admin' },
      { id: 'b', email: 'b@x.ru', role: 'root' },
    ];
    expect(mapProfileRows(rows).map((p) => p.role)).toEqual(['admin', 'user']);
  });
});
