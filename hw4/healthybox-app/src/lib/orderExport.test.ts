import { describe, expect, it } from 'vitest';
import type { OrderLine, OrderSummary, ProfileSummary } from '../types';
import { buildOrdersCsv, buildUsersCsv } from './orderExport';

const ORDER: OrderSummary = {
  id: 'o1',
  userId: 'u1',
  status: 'placed',
  deliveryDate: '2026-10-20',
  deliveryAddress: 'Казань, ул. Баумана, 1',
  createdAt: '2026-10-14T10:00:00Z',
  total: 4095,
};
const LINE: OrderLine = {
  orderId: 'o1',
  planId: 'balance',
  planName: 'Баланс',
  period: 'week',
  qty: 1,
  unitPrice: 4095,
};

const rowsOf = (csv: string) => csv.slice(1).split('\r\n');

describe('buildOrdersCsv', () => {
  it('writes a header and one row per line, with a customer column for admins', () => {
    const rows = rowsOf(buildOrdersCsv([ORDER], [LINE], new Map([['u1', 'anna@mail.ru']])));
    expect(rows[0].split(';')).toContain('Клиент');
    expect(rows[1]).toBe(
      'o1;2026-10-14;anna@mail.ru;Оформлен;2026-10-20;Казань, ул. Баумана, 1;Баланс;Неделя;1;4095;4095;4095',
    );
  });

  it('omits the customer column for a personal export', () => {
    const rows = rowsOf(buildOrdersCsv([ORDER], [LINE], null));
    expect(rows[0].split(';')).not.toContain('Клиент');
    expect(rows[1].split(';')).toHaveLength(11);
  });

  it('keeps an order without lines as one row and exports only the header for no orders', () => {
    expect(rowsOf(buildOrdersCsv([ORDER], [], null))).toHaveLength(2);
    expect(rowsOf(buildOrdersCsv([], [], null))).toHaveLength(1);
  });

  it('neutralises formulas in e-mails', () => {
    const rows = rowsOf(buildOrdersCsv([ORDER], [LINE], new Map([['u1', '=HYPERLINK("x")']])));
    expect(rows[1]).toContain('"\'=HYPERLINK(""x"")"');
  });
});

describe('buildUsersCsv', () => {
  it('counts orders and sums only placed ones', () => {
    const profiles: ProfileSummary[] = [
      { id: 'u1', email: 'anna@mail.ru', role: 'user' },
      { id: 'u2', email: 'boss@mail.ru', role: 'admin' },
    ];
    const orders: OrderSummary[] = [ORDER, { ...ORDER, id: 'o2', status: 'draft', total: 500 }];
    const rows = rowsOf(buildUsersCsv(profiles, orders));
    expect(rows[1]).toBe('anna@mail.ru;Пользователь;2;4095');
    expect(rows[2]).toBe('boss@mail.ru;Администратор;0;0');
  });
});
