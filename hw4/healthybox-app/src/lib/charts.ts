import type { OrderSummary } from '../types';

export interface DayRevenue {
  /** Calendar day, YYYY-MM-DD. */
  date: string;
  revenue: number;
  orders: number;
}

export interface NiceScale {
  ticks: number[];
  top: number;
}

const DAY_MS = 86_400_000;
const MAX_DAYS = 31;

function toTime(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function toDate(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

/**
 * Revenue of placed orders per creation day, with empty days filled in as zeros so the line
 * shows real gaps. Covers at most the last 31 days that have data; empty when nothing is placed.
 */
export function revenueByDay(orders: readonly OrderSummary[]): DayRevenue[] {
  const placed = orders.filter((o) => o.status === 'placed' && o.createdAt.length >= 10);
  if (placed.length === 0) return [];

  const byDay = new Map<string, DayRevenue>();
  for (const o of placed) {
    const date = o.createdAt.slice(0, 10);
    const prev = byDay.get(date) ?? { date, revenue: 0, orders: 0 };
    byDay.set(date, { date, revenue: prev.revenue + o.total, orders: prev.orders + 1 });
  }

  const times = [...byDay.keys()].map(toTime);
  const last = Math.max(...times);
  const first = Math.max(Math.min(...times), last - (MAX_DAYS - 1) * DAY_MS);
  const days: DayRevenue[] = [];
  for (let t = first; t <= last; t += DAY_MS) {
    const date = toDate(t);
    days.push(byDay.get(date) ?? { date, revenue: 0, orders: 0 });
  }
  return days;
}

/** Round axis ticks from 0 up to a clean maximum that is not below `max`. */
export function niceScale(max: number, target = 4): NiceScale {
  if (!Number.isFinite(max) || max <= 0) return { ticks: [0, 1], top: 1 };
  const raw = max / target;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor = [1, 2, 2.5, 5, 10].find((f) => normalized <= f) ?? 10;
  const step = factor * magnitude;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return { ticks, top };
}

/** Short axis label: 950, 2,5 тыс., 1,2 млн. */
export function formatCompact(value: number): string {
  const trim = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
  if (Math.abs(value) >= 1_000_000) return `${trim(value / 1_000_000)} млн`;
  if (Math.abs(value) >= 1_000) return `${trim(value / 1_000)} тыс.`;
  return String(value);
}
