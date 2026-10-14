import type { CartItem, Plan } from '../types';
import { ApiError } from './api-error';
import { mapPlanRows, type PlanRow } from './mapRows';
import { getSupabase } from './supabaseClient';

interface DbError {
  message: string;
  code?: string;
}

/** Maps Supabase/PostgREST errors to ApiError with a user-facing message. */
export function toApiError(error: DbError, httpStatus?: number): ApiError {
  const status = httpStatus ?? 500;
  if (status === 401 || error.code === 'PGRST301') {
    return new ApiError('Войдите в аккаунт, чтобы продолжить', 401);
  }
  if (status === 403 || error.code === '42501') {
    return new ApiError('Нет доступа к этим данным', 403);
  }
  if (error.code === '22023') {
    return new ApiError('Дата доставки не ранее чем через 2 дня', 422);
  }
  if (error.code === '23514') {
    return new ApiError('Проверьте корректность введённых данных', 422);
  }
  return new ApiError('Не удалось выполнить запрос. Попробуйте ещё раз', status);
}

/** Read: catalog with the 7-day menu. Public (anon) access by RLS. */
export async function fetchPlansRemote(): Promise<Plan[]> {
  const { data, error, status } = await getSupabase()
    .from('plans')
    .select('*, plan_meals(day, meal_title, dishes(*))')
    .order('day_price');
  if (error) throw toApiError(error, status);
  return mapPlanRows(data as unknown as PlanRow[]);
}

function iso(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/**
 * Create: places an order from the cart. Requires a signed-in user.
 * Prices are computed by the database trigger, the client only sends plan, period and qty.
 */
export async function createOrder(cart: readonly CartItem[]): Promise<string> {
  if (cart.length === 0) throw new ApiError('Корзина пуста', 422);
  const sb = getSupabase();
  const first = [...cart].sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime())[0];

  const order = await sb
    .from('orders')
    .insert({ delivery_date: iso(first.deliveryDate) })
    .select('id')
    .single();
  if (order.error) throw toApiError(order.error, order.status);

  const items = await sb.from('order_items').insert(
    cart.map((i) => ({ order_id: order.data.id, plan_id: i.planId, period: i.period, qty: i.qty })),
  );
  if (items.error) {
    await sb.from('orders').delete().eq('id', order.data.id);
    throw toApiError(items.error, items.status);
  }
  return order.data.id as string;
}

/** Update: confirms a draft order. */
export async function placeOrder(orderId: string): Promise<void> {
  const { error, status } = await getSupabase()
    .from('orders')
    .update({ status: 'placed' })
    .eq('id', orderId);
  if (error) throw toApiError(error, status);
}

/** Delete: removes a draft order (RLS forbids deleting placed orders). */
export async function deleteDraftOrder(orderId: string): Promise<void> {
  const { error, status } = await getSupabase().from('orders').delete().eq('id', orderId);
  if (error) throw toApiError(error, status);
}

/** Registers a user. Returns true when the project requires e-mail confirmation before sign-in. */
export async function signUp(email: string, password: string): Promise<boolean> {
  const { data, error } = await getSupabase().auth.signUp({ email, password });
  if (error) {
    throw new ApiError('Не удалось зарегистрироваться. Проверьте email и пароль', error.status ?? 400);
  }
  return data.session === null;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw new ApiError('Неверный email или пароль', error.status ?? 400);
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}

/** OAuth2 sign-in (Google). The provider must be enabled in Supabase Auth settings. */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw new ApiError('Не удалось войти через Google', error.status ?? 400);
}
