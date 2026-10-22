import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { secureSessionStorage } from '@/services/secureStorage';

// Clé « anon » publique par conception : la sécurité des données repose sur les policies RLS côté Supabase
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = (): boolean => SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 0;

export const supabase = createClient(SUPABASE_URL || 'https://not-configured.invalid', SUPABASE_ANON_KEY || 'none', {
  auth: {
    storage: secureSessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Checked against the server, not just the local token. */
export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.auth.getUser();
  return error ? null : (data.user?.id ?? null);
}

export async function hasSession(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function signInWithEmail(email: string, password: string): Promise<{ ok: boolean }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { ok: !error };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
