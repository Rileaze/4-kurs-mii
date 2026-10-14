import type { OrderStatus, OrderSummary, ProfileSummary } from '../types';
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
    createdAt: text(r.created_at),
    total: typeof r.total === 'number' ? r.total : 0,
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
