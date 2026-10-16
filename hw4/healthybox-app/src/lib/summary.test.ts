import { describe, expect, it } from 'vitest';
import type { OrderLine, OrderSummary } from '../types';
import {
  buildSheetRows,
  customerSummary,
  sheetTotals,
  sortRows,
  statusBreakdown,
} from './summary';

const order = (
  id: string,
  status: OrderSummary['status'],
  total: number,
  userId: string,
  createdAt: string,
): OrderSummary => ({
  id,
  userId,
  status,
  deliveryDate: '2026-10-20',
  deliveryAddress: 'Казань',
  createdAt,
  total,
});

const line = (orderId: string, planName: string, qty: number, unitPrice: number): OrderLine => ({
  orderId,
  planId: planName,
  planName,
  period: 'week',
  qty,
  unitPrice,
});

const ORDERS = [
  order('o1', 'placed', 8190, 'u1', '2026-10-10T10:00:00Z'),
  order('o2', 'draft', 590, 'u1', '2026-10-12T10:00:00Z'),
  order('o3', 'placed', 4977, 'u2', '2026-10-11T10:00:00Z'),
  order('o4', 'cancelled', 650, 'u2', '2026-10-09T10:00:00Z'),
];
const LINES = [
  line('o1', 'Баланс', 2, 4095),
  line('o2', 'Лёгкий', 1, 590),
  line('o3', 'Масса', 1, 4977),
];
const EMAILS = new Map([
  ['u1', 'anna@mail.ru'],
  ['u2', 'boris@mail.ru'],
]);

describe('buildSheetRows', () => {
  it('makes one row per line and keeps an order without lines as an empty row', () => {
    const rows = buildSheetRows(ORDERS, LINES, EMAILS);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      orderId: 'o1',
      customer: 'anna@mail.ru',
      planName: 'Баланс',
      qty: 2,
      lineTotal: 8190,
    });
    expect(rows[3]).toMatchObject({ orderId: 'o4', planName: '', qty: 0, lineTotal: 0 });
  });

  it('returns no rows for no orders', () => {
    expect(buildSheetRows([], LINES, EMAILS)).toEqual([]);
  });
});

describe('sortRows', () => {
  const rows = buildSheetRows(ORDERS, LINES, EMAILS);

  it('sorts numbers numerically in both directions', () => {
    expect(sortRows(rows, 'lineTotal', 'desc').map((r) => r.orderId)).toEqual(['o1', 'o3', 'o2', 'o4']);
    expect(sortRows(rows, 'lineTotal', 'asc')[0].orderId).toBe('o4');
  });

  it('sorts text with the Russian collation', () => {
    const names = sortRows(rows, 'planName', 'asc').map((r) => r.planName);
    expect(names).toEqual(['', 'Баланс', 'Лёгкий', 'Масса']);
  });

  it('does not mutate its input', () => {
    const before = rows.map((r) => r.orderId);
    sortRows(rows, 'qty', 'desc');
    expect(rows.map((r) => r.orderId)).toEqual(before);
  });
});

describe('sheetTotals', () => {
  it('sums everything and separately the placed part', () => {
    const totals = sheetTotals(buildSheetRows(ORDERS, LINES, EMAILS));
    expect(totals).toEqual({ rows: 4, qty: 4, amount: 13757, placedAmount: 13167 });
  });

  it('is zero for an empty sheet', () => {
    expect(sheetTotals([])).toEqual({ rows: 0, qty: 0, amount: 0, placedAmount: 0 });
  });
});

describe('customerSummary', () => {
  it('counts orders, sums placed ones and finds the newest order', () => {
    const [first, second] = customerSummary(ORDERS, EMAILS);
    expect(first).toMatchObject({ customer: 'anna@mail.ru', orders: 2, placedOrders: 1, spent: 8190 });
    expect(first.lastOrderAt).toBe('2026-10-12T10:00:00Z');
    expect(second).toMatchObject({ customer: 'boris@mail.ru', orders: 2, spent: 4977 });
  });

  it('labels users without a known e-mail', () => {
    const [only] = customerSummary([order('o9', 'placed', 100, 'ghost', '2026-10-01T00:00:00Z')], EMAILS);
    expect(only.customer).toBe('Неизвестный пользователь');
  });
});

describe('statusBreakdown', () => {
  it('lists all statuses, including empty ones', () => {
    expect(statusBreakdown(ORDERS)).toEqual([
      { status: 'placed', count: 2, sum: 13167 },
      { status: 'draft', count: 1, sum: 590 },
      { status: 'cancelled', count: 1, sum: 650 },
    ]);
    expect(statusBreakdown([]).every((s) => s.count === 0 && s.sum === 0)).toBe(true);
  });
});
