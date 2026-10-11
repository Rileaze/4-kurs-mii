'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { isDeliveryDateAllowed, addToCart, changeQty, cartTotal } = require('./cart');

const today = new Date(2026, 9, 11);
const set = { id: 'fit', name: 'Фит', period: 'week', price: 5000 };
const ok = new Date(2026, 9, 13);

test('дата ранее чем через 2 дня недоступна', () => {
  assert.equal(isDeliveryDateAllowed(new Date(2026, 9, 12), today), false);
  assert.equal(isDeliveryDateAllowed(ok, today), true);
});

test('добавление набора с допустимой датой', () => {
  const cart = addToCart([], set, ok, today);
  assert.equal(cart.length, 1);
  assert.equal(cartTotal(cart), 5000);
});

test('недопустимая дата вызывает ошибку', () => {
  assert.throws(() => addToCart([], set, new Date(2026, 9, 11), today), RangeError);
});

test('изменение количества пересчитывает итог', () => {
  let cart = addToCart([], set, ok, today);
  cart = changeQty(cart, cart[0].key, +1);
  assert.equal(cartTotal(cart), 10000);
});

test('уменьшение до 0 удаляет позицию', () => {
  let cart = addToCart([], set, ok, today);
  cart = changeQty(cart, cart[0].key, -1);
  assert.equal(cart.length, 0);
  assert.equal(cartTotal(cart), 0);
});
