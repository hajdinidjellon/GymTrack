// Account recovery, server side. Runs on Supabase Edge Functions (Deno) with the service
// role key, which never ships in the app. The app's code is not imported here: Supabase
// bundles only this folder.
//
// Setup (once):
//   1. Run supabase/schema.sql (recovery_codes, recovery_attempts, recovery_lookup).
//   2. supabase functions deploy password-reset --no-verify-jwt   (called signed out)
//      supabase functions deploy recovery-code                    (needs the user's JWT)
//   3. supabase secrets set RESEND_API_KEY=… RECOVERY_EMAIL_FROM="Okilo <no-reply@your-domain>"
//      RESET_LINK_URL=https://your-domain/reset-password (a page opening okilo://reset-password
//      with the same query; mail apps often refuse custom schemes). Default: okilo://reset-password.
//   SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are given by Supabase.
//   Emails go through Resend (verified sending domain needed); any other API fits in sendMail().

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

/** Kept from the app's first name: accounts already created sign in with it (domain/account.ts). */
export const USERNAME_DOMAIN = 'users.gymtrack.app';
export const PASSWORD_MIN = 6;

export const env = (name: string): string => Deno.env.get(name) ?? '';

export function adminClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function anonClient(authorization?: string): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: authorization ? { headers: { Authorization: authorization } } : undefined,
  });
}

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

export function normalizeUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.trim().toLowerCase();
  return /^[a-z0-9._-]{3,20}$/.test(name) ? name : null;
}

export const authEmail = (username: string) => `${username}@${USERNAME_DOMAIN}`;

// ------------------------------------------------------------
// Recovery code: OKL-XXXX-XXXX-XXXX, 12 symbols of Crockford base 32 (no I, L, O, U) = 60 bits
// ------------------------------------------------------------

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateCode(): string {
  // 256 is a multiple of 32: the low 5 bits of a random byte are uniform
  const symbols = [...crypto.getRandomValues(new Uint8Array(12))].map((b) => ALPHABET[b & 31]).join('');
  return `OKL-${symbols.slice(0, 4)}-${symbols.slice(4, 8)}-${symbols.slice(8)}`;
}

/** As typed: any case, spaces or dashes, O for 0 and I or L for 1. Null when it cannot be a code. */
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const body = raw
    .toUpperCase()
    .replace(/^\s*OKL/, '')
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  return /^[0-9A-HJKMNP-TV-Z]{12}$/.test(body) ? body : null;
}

// ------------------------------------------------------------
// Slow hash: PBKDF2-SHA256, random salt. Stored as "pbkdf2$<iterations>$<salt>$<hash>".
// ------------------------------------------------------------

const ITERATIONS = 210_000;
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function derive(secret: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

export async function hashCode(normalized: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(await derive(normalized, salt, ITERATIONS))}`;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** Same work whether the account exists or not (no stored hash: a dummy one), so time tells nothing. */
export async function verifyCode(normalized: string, stored: string | null): Promise<boolean> {
  const [scheme, iterations, salt, hash] = (stored ?? `pbkdf2$${ITERATIONS}$${b64(new Uint8Array(16))}$`).split('$');
  const derived = await derive(normalized, unb64(salt ?? ''), Number(iterations) || ITERATIONS);
  return scheme === 'pbkdf2' && !!stored && constantTimeEqual(derived, unb64(hash ?? ''));
}

// ------------------------------------------------------------
// Rate limit: attempts per key (username, IP, user id) in a sliding window
// ------------------------------------------------------------

const WINDOW_MINUTES = 15;

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/** Counts this attempt. True when one of the keys went over its limit. */
export async function overLimit(admin: SupabaseClient, limits: Record<string, number>): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  let over = false;
  for (const [key, max] of Object.entries(limits)) {
    const { count } = await admin
      .from('recovery_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('key', key)
      .gte('attempted_at', since);
    if ((count ?? 0) >= max) over = true;
    await admin.from('recovery_attempts').insert({ key });
  }
  // Old attempts are of no use
  await admin
    .from('recovery_attempts')
    .delete()
    .lt('attempted_at', new Date(Date.now() - 86_400_000).toISOString());
  return over;
}

export async function storeCode(admin: SupabaseClient, userId: string, code: string): Promise<void> {
  const { error } = await admin.from('recovery_codes').upsert({
    user_id: userId,
    code_hash: await hashCode(normalizeCode(code) ?? ''),
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function lookupAccount(
  admin: SupabaseClient,
  username: string,
): Promise<{ user_id: string; contact_email: string | null } | null> {
  const { data } = await admin.rpc('recovery_lookup', { p_email: authEmail(username) });
  return (data as { user_id: string; contact_email: string | null }[] | null)?.[0] ?? null;
}
