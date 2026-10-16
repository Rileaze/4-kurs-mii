import type { OrderLine, OrderStatus, OrderSummary, Period } from '../types';
import { groupLines, orderLineTotal } from './orders';

/** One row of the summary sheet: an order line together with its order and customer. */
export interface SheetRow {
  orderId: string;
  createdAt: string;
  customer: string;
  status: OrderStatus;
  deliveryDate: string;
  address: string;
  planName: string;
  period: Period | '';
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export type SheetColumn = keyof SheetRow;
export type SortDirection = 'asc' | 'desc';

export interface SheetTotals {
  rows: number;
  qty: number;
  /** Sum of all rows regardless of status. */
  amount: number;
  /** Sum of rows from placed orders only. */
  placedAmount: number;
}

export interface CustomerSummary {
  userId: string;
  customer: string;
  orders: number;
  placedOrders: number;
  /** Sum of placed orders. */
  spent: number;
  /** Creation date of the newest order (ISO), empty when there are none. */
  lastOrderAt: string;
}

export interface StatusBreakdown {
  status: OrderStatus;
  count: number;
  sum: number;
}

const STATUS_ORDER: readonly OrderStatus[] = ['placed', 'draft', 'cancelled'];

const NUMERIC_COLUMNS: readonly SheetColumn[] = ['qty', 'unitPrice', 'lineTotal'];

/**
 * Flattens orders into sheet rows, one per order line. An order without visible lines
 * still gets a single row so that it does not disappear from the sheet.
 */
export function buildSheetRows(
  orders: readonly OrderSummary[],
  lines: readonly OrderLine[],
  emails: ReadonlyMap<string, string>,
): SheetRow[] {
  const grouped = groupLines(lines);
  return orders.flatMap((o): SheetRow[] => {
    const base = {
      orderId: o.id,
      createdAt: o.createdAt,
      customer: emails.get(o.userId) ?? '',
      status: o.status,
      deliveryDate: o.deliveryDate,
      address: o.deliveryAddress,
    };
    const orderLines = grouped.get(o.id) ?? [];
    if (orderLines.length === 0) {
      return [{ ...base, planName: '', period: '', qty: 0, unitPrice: 0, lineTotal: 0 }];
    }
    return orderLines.map((l) => ({
      ...base,
      planName: l.planName,
      period: l.period,
      qty: l.qty,
      unitPrice: l.unitPrice,
      lineTotal: orderLineTotal(l),
    }));
  });
}

/** Returns a sorted copy; numbers compare numerically, text by the Russian collation. */
export function sortRows(
  rows: readonly SheetRow[],
  column: SheetColumn,
  direction: SortDirection,
): SheetRow[] {
  const sign = direction === 'asc' ? 1 : -1;
  const numeric = NUMERIC_COLUMNS.includes(column);
  return [...rows].sort((a, b) => {
    const x = a[column];
    const y = b[column];
    const diff =
      numeric && typeof x === 'number' && typeof y === 'number'
        ? x - y
        : String(x).localeCompare(String(y), 'ru');
    return diff * sign;
  });
}

export function sheetTotals(rows: readonly SheetRow[]): SheetTotals {
  return rows.reduce<SheetTotals>(
    (acc, r) => ({
      rows: acc.rows + 1,
      qty: acc.qty + r.qty,
      amount: acc.amount + r.lineTotal,
      placedAmount: acc.placedAmount + (r.status === 'placed' ? r.lineTotal : 0),
    }),
    { rows: 0, qty: 0, amount: 0, placedAmount: 0 },
  );
}

/** Per-customer figures, biggest spenders first. */
export function customerSummary(
  orders: readonly OrderSummary[],
  emails: ReadonlyMap<string, string>,
): CustomerSummary[] {
  const byUser = new Map<string, CustomerSummary>();
  for (const o of orders) {
    const prev = byUser.get(o.userId) ?? {
      userId: o.userId,
      customer: emails.get(o.userId) ?? 'Неизвестный пользователь',
      orders: 0,
      placedOrders: 0,
      spent: 0,
      lastOrderAt: '',
    };
    byUser.set(o.userId, {
      ...prev,
      orders: prev.orders + 1,
      placedOrders: prev.placedOrders + (o.status === 'placed' ? 1 : 0),
      spent: prev.spent + (o.status === 'placed' ? o.total : 0),
      lastOrderAt: o.createdAt > prev.lastOrderAt ? o.createdAt : prev.lastOrderAt,
    });
  }
  return [...byUser.values()].sort((a, b) => b.spent - a.spent || a.customer.localeCompare(b.customer, 'ru'));
}

/** Count and sum of orders per status, always listing all three statuses. */
export function statusBreakdown(orders: readonly OrderSummary[]): StatusBreakdown[] {
  return STATUS_ORDER.map((status) => {
    const own = orders.filter((o) => o.status === status);
    return { status, count: own.length, sum: own.reduce((sum, o) => sum + o.total, 0) };
  });
}
