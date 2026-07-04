import { createClient } from '@supabase/supabase-js';
import { largeSecureStore } from '@/lib/secureStorage';
import { tStatic } from '@/lib/i18n';
import 'react-native-url-polyfill/auto';

// Variables d'environnement — à définir dans .env.local
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = (): boolean =>
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

// Session persistée chiffrée : clé AES dans le Keychain/Keystore,
// données dans AsyncStorage (voir lib/secureStorage.ts).
// NB : les sessions stockées avant cette migration (AsyncStorage en clair)
// ne sont pas reprises — reconnexion unique demandée à l'utilisateur.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: largeSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Traduit les messages techniques Supabase en messages utilisateur i18n.
 *  Ne jamais afficher error.message brut (anglais technique). */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return tStatic('error.auth.invalidCredentials');
  if (m.includes('email not confirmed')) return tStatic('error.auth.emailNotConfirmed');
  if (m.includes('already registered')) return tStatic('error.auth.userExists');
  if (m.includes('password should be at least')) return tStatic('error.auth.weakPassword');
  if (m.includes('network') || m.includes('fetch')) return tStatic('error.auth.network');
  return tStatic('error.auth.generic');
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ? translateAuthError(error.message) : null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signUp({ email, password });
  return { error: error ? translateAuthError(error.message) : null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
