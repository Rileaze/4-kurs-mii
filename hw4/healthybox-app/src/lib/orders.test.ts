import { describe, expect, it } from 'vitest';
import type { OrderLine, OrderSummary } from '../types';
import { filterOrders, groupLines, orderLineTotal, planPopularity, summarize } from './orders';

const order = (
  id: string,
  status: OrderSummary['status'],
  total: number,
  userId = 'u1',
): OrderSummary => ({
  id,
  userId,
  status,
  deliveryDate: '2026-10-20',
  deliveryAddress: 'Казань, ул. Баумана, 1',
  createdAt: '2026-10-14T10:00:00Z',
  total,
});

const line = (orderId: string, planId: string, qty: number, unitPrice: number): OrderLine => ({
  orderId,
  planId,
  planName: planId.toUpperCase(),
  period: 'week',
  qty,
  unitPrice,
});

const ORDERS = [
  order('o1', 'placed', 4095),
  order('o2', 'placed', 5000, 'u2'),
  order('o3', 'draft', 900),
];
const EMAILS = new Map([
  ['u1', 'anna@mail.ru'],
  ['u2', 'boris@mail.ru'],
]);

describe('orderLineTotal', () => {
  it('multiplies price by quantity', () => {
    expect(orderLineTotal(line('o1', 'a', 3, 590))).toBe(1770);
  });
});

describe('groupLines', () => {
  it('groups by order and keeps the input untouched', () => {
    const lines = [line('o1', 'a', 1, 10), line('o2', 'b', 1, 20), line('o1', 'c', 2, 5)];
    const grouped = groupLines(lines);
    expect(grouped.get('o1')?.map((l) => l.planId)).toEqual(['a', 'c']);
    expect(grouped.get('o2')).toHaveLength(1);
    expect(lines).toHaveLength(3);
  });

  it('returns an empty map for no lines', () => {
    expect(groupLines([]).size).toBe(0);
  });
});

describe('filterOrders', () => {
  it('filters by status', () => {
    const found = filterOrders(ORDERS, { status: 'draft', query: '' }, EMAILS);
    expect(found.map((o) => o.id)).toEqual(['o3']);
  });

  it('searches by e-mail ignoring case and spaces', () => {
    const found = filterOrders(ORDERS, { status: 'all', query: '  BORIS ' }, EMAILS);
    expect(found.map((o) => o.id)).toEqual(['o2']);
  });

  it('returns everything for an empty filter and nothing for no match', () => {
    expect(filterOrders(ORDERS, { status: 'all', query: '' }, EMAILS)).toHaveLength(3);
    expect(filterOrders(ORDERS, { status: 'all', query: 'zzz' }, EMAILS)).toHaveLength(0);
  });
});

describe('summarize', () => {
  it('counts every order but sums only placed ones', () => {
    expect(summarize(ORDERS)).toEqual({ count: 3, revenue: 9095, average: 4548 });
  });

  it('is zero for an empty list', () => {
    expect(summarize([])).toEqual({ count: 0, revenue: 0, average: 0 });
  });
});

describe('planPopularity', () => {
  it('sums placed lines per plan, best revenue first, ignoring drafts', () => {
    const lines = [
      line('o1', 'balance', 1, 4095),
      line('o2', 'mass', 1, 4977),
      line('o2', 'balance', 1, 4095),
      line('o3', 'light', 5, 590),
    ];
    const sales = planPopularity(ORDERS, lines);
    expect(sales.map((s) => [s.planId, s.qty, s.revenue])).toEqual([
      ['balance', 2, 8190],
      ['mass', 1, 4977],
    ]);
  });
});
