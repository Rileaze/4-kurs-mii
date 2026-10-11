'use strict';

const MIN_LEAD_DAYS = 2;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Earliest allowed first-delivery date (today + MIN_LEAD_DAYS, time stripped). */
function earliestDeliveryDate(today = new Date()) {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return new Date(d.getTime() + MIN_LEAD_DAYS * MS_PER_DAY);
}

function isDeliveryDateAllowed(date, today = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return d >= earliestDeliveryDate(today);
}

function addToCart(cart, item, deliveryDate, today = new Date()) {
  if (!isDeliveryDateAllowed(deliveryDate, today)) {
    throw new RangeError('Дата доставки не ранее чем через 2 дня');
  }
  const key = `${item.id}:${item.period}:${deliveryDate.toISOString().slice(0, 10)}`;
  const existing = cart.find((l) => l.key === key);
  if (existing) return cart.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
  return [...cart, { key, ...item, deliveryDate, qty: 1 }];
}

/** Changes quantity by delta; a line whose quantity reaches 0 is removed. */
function changeQty(cart, key, delta) {
  return cart
    .map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l))
    .filter((l) => l.qty > 0);
}

const lineTotal = (l) => l.price * l.qty;
const cartTotal = (cart) => cart.reduce((s, l) => s + lineTotal(l), 0);

module.exports = { earliestDeliveryDate, isDeliveryDateAllowed, addToCart, changeQty, lineTotal, cartTotal };
