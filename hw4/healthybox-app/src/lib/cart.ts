import type { CartItem, Period, Plan } from '../types';
import { calcSetPrice } from './pricing';

const MIN_LEAD_DAYS = 2;

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIso(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Earliest allowed first-delivery date: today + 2 days. */
export function earliestDeliveryDate(today: Date): Date {
  const base = stripTime(today);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + MIN_LEAD_DAYS);
}

export function isDeliveryDateAllowed(date: Date, today: Date): boolean {
  return stripTime(date).getTime() >= earliestDeliveryDate(today).getTime();
}

/**
 * Returns a new cart with the plan added. Same plan + period + date increases qty.
 * @throws RangeError if the delivery date is earlier than today + 2 days
 */
export function addToCart(
  cart: readonly CartItem[],
  plan: Plan,
  period: Period,
  deliveryDate: Date,
  today: Date,
): CartItem[] {
  if (!isDeliveryDateAllowed(deliveryDate, today)) {
    throw new RangeError('Delivery date must be at least 2 days from today');
  }
  const key = `${plan.id}:${period}:${toIso(deliveryDate)}`;
  if (cart.some((i) => i.key === key)) {
    return cart.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
  }
  const item: CartItem = {
    key,
    planId: plan.id,
    name: plan.name,
    emoji: plan.emoji,
    period,
    unitPrice: calcSetPrice(period, plan.dayPrice),
    qty: 1,
    deliveryDate: stripTime(deliveryDate),
  };
  return [...cart, item];
}

/** Changes quantity by delta; an item whose quantity reaches 0 is removed. */
export function changeQty(cart: readonly CartItem[], key: string, delta: number): CartItem[] {
  return cart
    .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
    .filter((i) => i.qty > 0);
}

export const lineTotal = (item: CartItem): number => item.unitPrice * item.qty;

export const cartTotal = (cart: readonly CartItem[]): number =>
  cart.reduce((sum, item) => sum + lineTotal(item), 0);

export const cartCount = (cart: readonly CartItem[]): number =>
  cart.reduce((sum, item) => sum + item.qty, 0);
