import { describe, expect, it } from 'vitest';
import { mapOrderLineRows, mapOrderRows, mapProfileRows } from './mapAccount';

describe('mapOrderLineRows', () => {
  it('maps an order_items row with the embedded plan name', () => {
    const rows = [
      { order_id: 'o1', plan_id: 'balance', period: 'week', qty: 2, unit_price: 4095, plans: { name: 'Баланс' } },
    ];
    expect(mapOrderLineRows(rows)).toEqual([
      { orderId: 'o1', planId: 'balance', planName: 'Баланс', period: 'week', qty: 2, unitPrice: 4095 },
    ]);
  });

  it('falls back to the plan id when the name is missing and to safe numbers', () => {
    const [line] = mapOrderLineRows([{ order_id: 'o1', plan_id: 'mass', period: 'day', qty: 'x' }]);
    expect(line.planName).toBe('mass');
    expect(line.period).toBe('day');
    expect(line.qty).toBe(0);
    expect(line.unitPrice).toBe(0);
  });

  it('returns an empty list for a non-array response', () => {
    expect(mapOrderLineRows(undefined)).toEqual([]);
  });
});

describe('mapOrderRows', () => {
  it('maps a view row to an order summary', () => {
    const rows = [
      { id: 'o1', user_id: 'u1', status: 'placed', delivery_date: '2026-10-20', delivery_address: 'Казань', created_at: 't', total: 4095 },
    ];
    expect(mapOrderRows(rows)).toEqual([
      { id: 'o1', userId: 'u1', status: 'placed', deliveryDate: '2026-10-20', deliveryAddress: 'Казань', createdAt: 't', total: 4095 },
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

describe('mapProfileDetails', () => {
  it('maps columns and tolerates missing values', async () => {
    const { mapProfileDetails } = await import('./mapAccount');
    expect(mapProfileDetails({ full_name: 'Иван', phone: null, address: 'Казань' })).toEqual({
      fullName: 'Иван',
      phone: '',
      address: 'Казань',
    });
    expect(mapProfileDetails(null)).toEqual({ fullName: '', phone: '', address: '' });
  });
});
