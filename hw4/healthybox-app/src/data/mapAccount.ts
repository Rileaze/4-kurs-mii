import type { OrderLine, OrderStatus, OrderSummary, ProfileDetails, ProfileSummary } from '../types';
import { parseRole } from '../lib/roles';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseStatus(value: unknown): OrderStatus {
  return value === 'placed' || value === 'cancelled' ? value : 'draft';
}

/** Maps rows of the orders_with_total view; rows of an unexpected shape are skipped. */
export function mapOrderRows(rows: unknown): OrderSummary[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter(isRecord).map((r) => ({
    id: text(r.id),
    userId: text(r.user_id),
    status: parseStatus(r.status),
    deliveryDate: text(r.delivery_date),
    deliveryAddress: text(r.delivery_address),
    createdAt: text(r.created_at),
    total: typeof r.total === 'number' ? r.total : 0,
  }));
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Maps order_items rows with the embedded plan name; unexpected rows are skipped. */
export function mapOrderLineRows(rows: unknown): OrderLine[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter(isRecord).map((r) => ({
    orderId: text(r.order_id),
    planId: text(r.plan_id),
    planName: isRecord(r.plans) ? text(r.plans.name) : text(r.plan_id),
    period: r.period === 'day' ? 'day' : 'week',
    qty: count(r.qty),
    unitPrice: count(r.unit_price),
  }));
}

/** Maps rows of the profiles table; an unknown role becomes the safe 'user'. */
export function mapProfileRows(rows: unknown): ProfileSummary[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter(isRecord).map((r) => ({
    id: text(r.id),
    email: text(r.email),
    role: parseRole(r.role),
  }));
}

/** Maps one profiles row to the editable details; missing values become empty strings. */
export function mapProfileDetails(row: unknown): ProfileDetails {
  const r = isRecord(row) ? row : {};
  return { fullName: text(r.full_name), phone: text(r.phone), address: text(r.address) };
}
