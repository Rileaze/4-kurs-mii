import type { OrderLine, OrderStatus, OrderSummary } from '../types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Черновик',
  placed: 'Оформлен',
  cancelled: 'Отменён',
};

export type StatusFilter = OrderStatus | 'all';

export interface OrderFilter {
  status: StatusFilter;
  /** Matched against the customer's e-mail, order id and delivery date. */
  query: string;
}

export interface OrderStats {
  count: number;
  /** Sum of placed orders only. */
  revenue: number;
  /** Average of placed orders, rounded to whole rubles. */
  average: number;
}

export interface PlanSales {
  planId: string;
  planName: string;
  qty: number;
  revenue: number;
}

export function orderLineTotal(line: OrderLine): number {
  return line.unitPrice * line.qty;
}

/** Groups lines by order id without changing the input. */
export function groupLines(lines: readonly OrderLine[]): Map<string, OrderLine[]> {
  const grouped = new Map<string, OrderLine[]>();
  for (const line of lines) {
    grouped.set(line.orderId, [...(grouped.get(line.orderId) ?? []), line]);
  }
  return grouped;
}

/** Filters orders by status and a free-text query; `emails` maps user ids to e-mails. */
export function filterOrders(
  orders: readonly OrderSummary[],
  filter: OrderFilter,
  emails: ReadonlyMap<string, string>,
): OrderSummary[] {
  const query = filter.query.trim().toLowerCase();
  return orders.filter((o) => {
    if (filter.status !== 'all' && o.status !== filter.status) return false;
    if (!query) return true;
    const haystack = `${emails.get(o.userId) ?? ''} ${o.id} ${o.deliveryDate}`.toLowerCase();
    return haystack.includes(query);
  });
}

/** Counts all given orders; revenue and average only include placed ones. */
export function summarize(orders: readonly OrderSummary[]): OrderStats {
  const placed = orders.filter((o) => o.status === 'placed');
  const revenue = placed.reduce((sum, o) => sum + o.total, 0);
  return {
    count: orders.length,
    revenue,
    average: placed.length === 0 ? 0 : Math.round(revenue / placed.length),
  };
}

/** Sales per plan over placed orders, best sellers first. */
export function planPopularity(
  orders: readonly OrderSummary[],
  lines: readonly OrderLine[],
): PlanSales[] {
  const placed = new Set(orders.filter((o) => o.status === 'placed').map((o) => o.id));
  const byPlan = new Map<string, PlanSales>();
  for (const line of lines) {
    if (!placed.has(line.orderId)) continue;
    const prev = byPlan.get(line.planId) ?? {
      planId: line.planId,
      planName: line.planName,
      qty: 0,
      revenue: 0,
    };
    byPlan.set(line.planId, {
      ...prev,
      qty: prev.qty + line.qty,
      revenue: prev.revenue + orderLineTotal(line),
    });
  }
  return [...byPlan.values()].sort((a, b) => b.revenue - a.revenue);
}
