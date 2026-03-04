import { useSyncExternalStore, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

let authState: AuthState = { session: null, user: null, loading: true };
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return authState;
}

// Initialize auth listener (runs once on module load)
supabase.auth.getSession().then(({ data: { session } }) => {
  authState = { session, user: session?.user ?? null, loading: false };
  listeners.forEach(l => l());
});

supabase.auth.onAuthStateChange((_event, session) => {
  authState = { session, user: session?.user ?? null, loading: false };
  listeners.forEach(l => l());
});

export function useAuth() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  const { session, user, loading } = state;
  const isGuest = session?.user?.is_anonymous === true;
  const isAuthenticated = !!session && !isGuest;

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/map',
      },
    });
    if (error) throw error;
  }, []);

  const signInAsGuest = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }, []);

  const linkGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/map',
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return {
    session,
    user,
    loading,
    isGuest,
    isAuthenticated,
    signInWithGoogle,
    signInAsGuest,
    linkGoogle,
    signOut,
  };
}
