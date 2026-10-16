import { describe, expect, it } from 'vitest';
import type { OrderSummary } from '../types';
import { formatCompact, niceScale, revenueByDay } from './charts';

const order = (
  id: string,
  status: OrderSummary['status'],
  total: number,
  createdAt: string,
): OrderSummary => ({
  id,
  userId: 'u1',
  status,
  deliveryDate: '2026-12-01',
  deliveryAddress: '',
  createdAt,
  total,
});

describe('revenueByDay', () => {
  it('sums placed orders per day and fills the empty days with zeros', () => {
    const days = revenueByDay([
      order('a', 'placed', 1000, '2026-10-10T08:00:00Z'),
      order('b', 'placed', 500, '2026-10-10T20:00:00Z'),
      order('c', 'placed', 700, '2026-10-13T09:00:00Z'),
      order('d', 'draft', 9999, '2026-10-11T09:00:00Z'),
      order('e', 'cancelled', 9999, '2026-10-12T09:00:00Z'),
    ]);
    expect(days).toEqual([
      { date: '2026-10-10', revenue: 1500, orders: 2 },
      { date: '2026-10-11', revenue: 0, orders: 0 },
      { date: '2026-10-12', revenue: 0, orders: 0 },
      { date: '2026-10-13', revenue: 700, orders: 1 },
    ]);
  });

  it('is empty when no order is placed', () => {
    expect(revenueByDay([])).toEqual([]);
    expect(revenueByDay([order('a', 'draft', 100, '2026-10-10T00:00:00Z')])).toEqual([]);
  });

  it('keeps at most the last 31 days', () => {
    const days = revenueByDay([
      order('old', 'placed', 100, '2026-01-01T00:00:00Z'),
      order('new', 'placed', 200, '2026-10-15T00:00:00Z'),
    ]);
    expect(days).toHaveLength(31);
    expect(days[days.length - 1]).toEqual({ date: '2026-10-15', revenue: 200, orders: 1 });
    expect(days[0].date).toBe('2026-09-15');
  });

  it('returns a single day for a single order', () => {
    expect(revenueByDay([order('a', 'placed', 50, '2026-10-10T00:00:00Z')])).toHaveLength(1);
  });
});

describe('niceScale', () => {
  it('rounds the top up to a clean number with even ticks from zero', () => {
    expect(niceScale(8190)).toEqual({ ticks: [0, 2500, 5000, 7500, 10000], top: 10000 });
    expect(niceScale(100)).toEqual({ ticks: [0, 25, 50, 75, 100], top: 100 });
  });

  it('never returns a top below the maximum', () => {
    for (const max of [1, 7, 13, 999, 4977, 123456]) {
      expect(niceScale(max).top).toBeGreaterThanOrEqual(max);
    }
  });

  it('has a sane scale for zero, negative and invalid input', () => {
    expect(niceScale(0)).toEqual({ ticks: [0, 1], top: 1 });
    expect(niceScale(-5).top).toBe(1);
    expect(niceScale(Number.NaN).top).toBe(1);
  });
});

describe('formatCompact', () => {
  it('abbreviates thousands and millions with a decimal comma', () => {
    expect(formatCompact(0)).toBe('0');
    expect(formatCompact(950)).toBe('950');
    expect(formatCompact(2500)).toBe('2,5 тыс.');
    expect(formatCompact(10000)).toBe('10 тыс.');
    expect(formatCompact(1_200_000)).toBe('1,2 млн');
  });
});
