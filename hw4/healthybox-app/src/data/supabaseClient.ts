import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when the Supabase env variables are set; otherwise the app uses mock data. */
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Lazily creates the client. Only the public anon key is used; access is limited by RLS. */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) throw new Error('Supabase is not configured');
  client ??= createClient(url, anonKey);
  return client;
}
