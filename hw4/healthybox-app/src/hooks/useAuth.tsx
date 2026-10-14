import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../types';
import { isSupabaseConfigured } from '../data/supabaseClient';

interface AuthState {
  /** False when Supabase is not configured (mock mode): no sign-in is offered. */
  enabled: boolean;
  /** True until the stored session has been restored. */
  loading: boolean;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves to true when the e-mail must be confirmed before the first sign-in. */
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const DISABLED: AuthState = {
  enabled: false,
  loading: false,
  user: null,
  signIn: () => Promise.reject(new Error('Auth is not configured')),
  signUp: () => Promise.reject(new Error('Auth is not configured')),
  signOut: () => Promise.resolve(),
};

const AuthContext = createContext<AuthState>(DISABLED);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void import('../data/accountApi').then((api) => {
      if (cancelled) return;
      unsubscribe = api.subscribeAuth((next) => {
        setUser(next);
        setLoading(false);
      });
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const api = await import('../data/supabaseApi');
    await api.signIn(email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const api = await import('../data/supabaseApi');
    return api.signUp(email, password);
  }, []);

  const signOut = useCallback(async () => {
    const api = await import('../data/supabaseApi');
    await api.signOut();
  }, []);

  const value = useMemo<AuthState>(
    () => ({ enabled: isSupabaseConfigured, loading, user, signIn, signUp, signOut }),
    [loading, user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
