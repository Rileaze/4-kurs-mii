import type { OrderLine, OrderSummary, ProfileSummary } from '../types';
import { toCsv } from './csv';
import { ORDER_STATUS_LABELS, groupLines, orderLineTotal } from './orders';
import { sheetTotals } from './summary';
import type { SheetRow } from './summary';

const PERIOD_LABELS = { day: 'День', week: 'Неделя' } as const;

/**
 * One CSV row per order line (an order without lines still gets one row).
 * `emails` adds a customer column; pass null for the customer's own export.
 */
export function buildOrdersCsv(
  orders: readonly OrderSummary[],
  lines: readonly OrderLine[],
  emails: ReadonlyMap<string, string> | null,
): string {
  const grouped = groupLines(lines);
  const header = [
    'Заказ',
    'Создан',
    ...(emails ? ['Клиент'] : []),
    'Статус',
    'Доставка с',
    'Адрес доставки',
    'Рацион',
    'Период',
    'Количество',
    'Цена, ₽',
    'Сумма позиции, ₽',
    'Итого по заказу, ₽',
  ];
  const rows = orders.flatMap((o) => {
    const head = [
      o.id,
      o.createdAt.slice(0, 10),
      ...(emails ? [emails.get(o.userId) ?? ''] : []),
      ORDER_STATUS_LABELS[o.status],
      o.deliveryDate,
      o.deliveryAddress,
    ];
    const orderLines = grouped.get(o.id) ?? [];
    if (orderLines.length === 0) return [[...head, '', '', '', '', '', o.total]];
    return orderLines.map((l) => [
      ...head,
      l.planName,
      PERIOD_LABELS[l.period],
      l.qty,
      l.unitPrice,
      orderLineTotal(l),
      o.total,
    ]);
  });
  return toCsv([header, ...rows]);
}

/** The summary sheet exactly as shown on screen (same rows, same order), plus a totals row. */
export function buildSheetCsv(rows: readonly SheetRow[]): string {
  const totals = sheetTotals(rows);
  const header = [
    'Заказ',
    'Создан',
    'Клиент',
    'Статус',
    'Доставка с',
    'Адрес доставки',
    'Рацион',
    'Период',
    'Количество',
    'Цена, ₽',
    'Сумма, ₽',
  ];
  const body = rows.map((r) => [
    r.orderId,
    r.createdAt.slice(0, 10),
    r.customer,
    ORDER_STATUS_LABELS[r.status],
    r.deliveryDate,
    r.address,
    r.planName,
    r.period === '' ? '' : PERIOD_LABELS[r.period],
    r.qty,
    r.unitPrice,
    r.lineTotal,
  ]);
  const footer = ['Итого', '', '', '', '', '', '', '', totals.qty, '', totals.amount];
  return toCsv([header, ...body, footer]);
}

/** Users with their order counts and the sum of their placed orders. */
export function buildUsersCsv(
  profiles: readonly ProfileSummary[],
  orders: readonly OrderSummary[],
): string {
  const header = ['Email', 'Роль', 'Заказов', 'Оформлено на сумму, ₽'];
  const rows = profiles.map((p) => {
    const own = orders.filter((o) => o.userId === p.id);
    const spent = own.filter((o) => o.status === 'placed').reduce((sum, o) => sum + o.total, 0);
    return [p.email, p.role === 'admin' ? 'Администратор' : 'Пользователь', own.length, spent];
  });
  return toCsv([header, ...rows]);
}
