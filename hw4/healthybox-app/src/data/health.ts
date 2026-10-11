import { isSupabaseConfigured } from './supabaseClient';

export interface HealthReport {
  app: 'ok';
  database: 'ok' | 'down' | 'not_configured';
  checkedAt: string;
}

/** Checks the app and, if configured, the Supabase REST endpoint (public catalog, 1 row). */
export async function checkHealth(): Promise<HealthReport> {
  const checkedAt = new Date().toISOString();
  if (!isSupabaseConfigured) return { app: 'ok', database: 'not_configured', checkedAt };
  try {
    const { getSupabase } = await import('./supabaseClient');
    const { error } = await getSupabase().from('plans').select('id').limit(1);
    return { app: 'ok', database: error ? 'down' : 'ok', checkedAt };
  } catch {
    return { app: 'ok', database: 'down', checkedAt };
  }
}
