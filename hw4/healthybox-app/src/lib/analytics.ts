export type AnalyticsEvent =
  | 'view_catalog'
  | 'change_period'
  | 'open_set'
  | 'open_dish'
  | 'add_to_cart'
  | 'change_cart_qty';

type YmFn = (counterId: number, action: 'reachGoal', goal: string, params?: object) => void;

declare global {
  interface Window {
    ym?: YmFn;
  }
}

const COUNTER_ID = Number(import.meta.env.VITE_YM_COUNTER_ID);

/** Sends a goal to Yandex.Metrika; does nothing if the counter is not configured or blocked. */
export function track(event: AnalyticsEvent, params?: Record<string, string | number>): void {
  if (!Number.isInteger(COUNTER_ID) || COUNTER_ID <= 0) return;
  try {
    window.ym?.(COUNTER_ID, 'reachGoal', event, params);
  } catch {
    // analytics must never break the app
  }
}
