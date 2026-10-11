import { describe, expect, it } from 'vitest';
import { PLANS } from '../data/mock';
import {
  addToCart,
  cartCount,
  cartTotal,
  changeQty,
  isDeliveryDateAllowed,
} from './cart';

const today = new Date(2026, 9, 11);
const okDate = new Date(2026, 9, 13);
const plan = PLANS[1];

describe('delivery date', () => {
  it('forbids dates earlier than today + 2 days', () => {
    expect(isDeliveryDateAllowed(new Date(2026, 9, 12), today)).toBe(false);
    expect(isDeliveryDateAllowed(okDate, today)).toBe(true);
  });
});

describe('addToCart', () => {
  it('adds a plan with the calculated price', () => {
    const cart = addToCart([], plan, 'week', okDate, today);
    expect(cart).toHaveLength(1);
    expect(cartTotal(cart)).toBe(4095);
  });

  it('increases qty for the same plan, period and date', () => {
    const once = addToCart([], plan, 'day', okDate, today);
    const twice = addToCart(once, plan, 'day', okDate, today);
    expect(twice).toHaveLength(1);
    expect(cartCount(twice)).toBe(2);
  });

  it('throws for a date that is too early and does not mutate the cart', () => {
    const cart = addToCart([], plan, 'day', okDate, today);
    expect(() => addToCart(cart, plan, 'day', today, today)).toThrow(RangeError);
    expect(cart).toHaveLength(1);
  });
});

describe('changeQty', () => {
  it('recalculates the total', () => {
    const cart = addToCart([], plan, 'day', okDate, today);
    expect(cartTotal(changeQty(cart, cart[0].key, 1))).toBe(1300);
  });

  it('removes the item when quantity reaches 0', () => {
    const cart = addToCart([], plan, 'day', okDate, today);
    const next = changeQty(cart, cart[0].key, -1);
    expect(next).toHaveLength(0);
    expect(cartTotal(next)).toBe(0);
  });
});
