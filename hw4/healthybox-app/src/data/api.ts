import type { Plan } from '../types';
import { PLANS } from './mock';
import { ApiError } from './api-error';
import { isSupabaseConfigured } from './supabaseClient';

export { ApiError };

const LATENCY_MS = 400;

function fetchPlansMock(shouldFail: boolean): Promise<Plan[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new ApiError('Не удалось загрузить данные', 500));
      else resolve(PLANS);
    }, LATENCY_MS);
  });
}

/**
 * Loads the catalog from Supabase when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set,
 * otherwise from mock data. `?fail=1` in the page URL simulates a network error (mock mode).
 */
export async function fetchPlans(shouldFail = false): Promise<Plan[]> {
  if (!isSupabaseConfigured) return fetchPlansMock(shouldFail);
  const { fetchPlansRemote } = await import('./supabaseApi');
  return fetchPlansRemote();
}
