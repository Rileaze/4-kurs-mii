import type { Session } from '@supabase/supabase-js';
import type {
  AuthUser,
  OrderLine,
  OrderStatus,
  OrderSummary,
  ProfileDetails,
  ProfileSummary,
  Role,
} from '../types';
import { ApiError } from './api-error';
import { mapOrderLineRows, mapOrderRows, mapProfileDetails, mapProfileRows } from './mapAccount';
import { getSupabase } from './supabaseClient';
import { toApiError } from './supabaseApi';
import { logger } from '../lib/logger';
import { parseRole } from '../lib/roles';

/**
 * Subscribes to sign-in state. Calls `onUser` with the user and their role from `profiles`
 * (or null when signed out). Returns an unsubscribe function.
 */
export function subscribeAuth(onUser: (user: AuthUser | null) => void): () => void {
  const sb = getSupabase();

  const load = async (session: Session | null): Promise<void> => {
    if (!session) {
      onUser(null);
      return;
    }
    const { data, error } = await sb
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) logger.warning('profile load failed', { code: error.code });
    onUser({
      id: session.user.id,
      email: session.user.email ?? '',
      role: parseRole(data?.role),
    });
  };

  // Supabase queries must not run inside the auth callback itself (can deadlock): defer them.
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => void load(session), 0);
  });
  return () => data.subscription.unsubscribe();
}

/** Own orders for a user, all orders for an admin (RLS decides which rows are visible). */
export async function fetchOrders(): Promise<OrderSummary[]> {
  const { data, error, status } = await getSupabase()
    .from('orders_with_total')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw toApiError(error, status);
  return mapOrderRows(data);
}

/** Order lines (with plan names) of the visible orders: own for a user, all for an admin. */
export async function fetchOrderLines(): Promise<OrderLine[]> {
  const { data, error, status } = await getSupabase()
    .from('order_items')
    .select('order_id, plan_id, period, qty, unit_price, plans(name)');
  if (error) throw toApiError(error, status);
  return mapOrderLineRows(data);
}

/** Admin: all profiles. A regular user only receives their own profile (RLS). */
export async function fetchProfiles(): Promise<ProfileSummary[]> {
  const { data, error, status } = await getSupabase()
    .from('profiles')
    .select('id, email, role')
    .order('created_at');
  if (error) throw toApiError(error, status);
  return mapProfileRows(data);
}

/** The signed-in user's own editable profile details. */
export async function fetchMyProfile(userId: string): Promise<ProfileDetails> {
  const { data, error, status } = await getSupabase()
    .from('profiles')
    .select('full_name, phone, address')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw toApiError(error, status);
  return mapProfileDetails(data);
}

/** Saves the signed-in user's own details (empty strings are stored as null). */
export async function updateMyProfile(userId: string, details: ProfileDetails): Promise<void> {
  const { data, error, status } = await getSupabase()
    .from('profiles')
    .update({
      full_name: details.fullName.trim() || null,
      phone: details.phone.trim() || null,
      address: details.address.trim() || null,
    })
    .eq('id', userId)
    .select('id');
  if (error) throw toApiError(error, status);
  requireUpdated(data);
}

/** RLS hides forbidden rows instead of failing, so zero updated rows means no access. */
function requireUpdated(rows: readonly unknown[] | null): void {
  if (!rows || rows.length === 0) throw new ApiError('Нет доступа к этим данным', 403);
}

/** Admin: changes a user's role. */
export async function setUserRole(userId: string, role: Role): Promise<void> {
  const { data, error, status } = await getSupabase()
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select('id');
  if (error) throw toApiError(error, status);
  requireUpdated(data);
}

/** Admin: changes an order status. */
export async function setOrderStatus(orderId: string, orderStatus: OrderStatus): Promise<void> {
  const { data, error, status } = await getSupabase()
    .from('orders')
    .update({ status: orderStatus })
    .eq('id', orderId)
    .select('id');
  if (error) throw toApiError(error, status);
  requireUpdated(data);
}

/** Admin: changes the price of one plan day (whole rubles). */
export async function updatePlanPrice(planId: string, dayPrice: number): Promise<void> {
  const { data, error, status } = await getSupabase()
    .from('plans')
    .update({ day_price: dayPrice })
    .eq('id', planId)
    .select('id');
  if (error) throw toApiError(error, status);
  requireUpdated(data);
}
