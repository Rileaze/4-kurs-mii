import type { Period } from '../types';

const DAYS_IN_WEEK = 7;
const WEEK_DISCOUNT_PERCENT = 10;

const rubFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/**
 * Price of one set for the given period, in whole rubles.
 * A week is 7 days with a 10% discount, rounded to the nearest ruble.
 * @throws RangeError if dayPrice is not a positive integer
 */
export function calcSetPrice(period: Period, dayPrice: number): number {
  if (!Number.isInteger(dayPrice) || dayPrice <= 0) {
    throw new RangeError('dayPrice must be a positive integer');
  }
  if (period === 'day') return dayPrice;
  return Math.round((dayPrice * DAYS_IN_WEEK * (100 - WEEK_DISCOUNT_PERCENT)) / 100);
}

/** Formats rubles for the UI, e.g. "4 095 ₽". */
export function formatRub(value: number): string {
  return `${rubFormatter.format(value)} ₽`;
}
