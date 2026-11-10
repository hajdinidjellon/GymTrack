/**
 * RÉCUPÉRATION DU COMPTE — calls to the Edge Functions (supabase/functions/). The service
 * role key stays on the server. A recovery code only passes through memory: never stored here.
 */

import type { z } from 'zod';
import { recoveryAnswerSchema } from '@/domain/schemas';
import { logger } from '@/services/logger';
import { isSupabaseConfigured, supabase } from '@/services/supabase';

type Answer = z.infer<typeof recoveryAnswerSchema>;

async function call(name: string, body: Record<string, unknown>): Promise<Answer | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) throw error;
    const answer = recoveryAnswerSchema.safeParse(data);
    return answer.success ? answer.data : null;
  } catch (error) {
    logger.warn(`${name} failed`, error);
    return null;
  }
}

export type CodeResult = { ok: true; code: string } | { ok: false; reason: 'limit' | 'password' | 'other' };

function toCodeResult(answer: Answer | null): CodeResult {
  if (answer?.ok && answer.code) return { ok: true, code: answer.code };
  return { ok: false, reason: answer?.reason ?? 'other' };
}

/** A new recovery code for the signed-in user; the old one stops working. */
export async function createRecoveryCode(password: string): Promise<CodeResult> {
  return toCodeResult(await call('recovery-code', { password }));
}

/**
 * Asks for a reset link by email. The server answers the same whether the account exists or
 * not: only a network failure is reported.
 */
export async function requestResetEmail(username: string, locale: string): Promise<boolean> {
  return (await call('password-reset', { action: 'email', username, locale })) !== null;
}

/** New password with the recovery code. On success, the new code to show once. */
export async function resetWithCode(username: string, code: string, password: string): Promise<CodeResult> {
  const answer = await call('password-reset', { action: 'code', username, code, password });
  // A wrong code and an unknown account get the same answer
  return answer?.reason === 'password' ? { ok: false, reason: 'other' } : toCodeResult(answer);
}

/** The reset link from the email: opens a session for it, then sets the new password. */
export async function resetWithEmailLink(tokenHash: string, password: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
  if (error) return false;
  const { error: updateError } = await supabase.auth.updateUser({ password });
  return !updateError;
}

/** The contact email of the signed-in account, read from the local session. */
export async function getContactEmail(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase.auth.getSession();
  const email: unknown = data.session?.user.user_metadata?.contact_email;
  return typeof email === 'string' && email ? email : null;
}

/**
 * Deletes the account and everything in it, in the cloud (supabase/functions/delete-account).
 * The password is checked again on the server. This phone's copy is cleared by the caller.
 */
export async function deleteAccount(password: string): Promise<'ok' | 'password' | 'limit' | 'other'> {
  const answer = await call('delete-account', { password });
  if (answer?.ok) return 'ok';
  return answer?.reason ?? 'other';
}

/** The password is checked again before the email changes: an unlocked phone is not enough. */
export async function updateContactEmail(email: string | null, password: string): Promise<'ok' | 'password' | 'other'> {
  if (!isSupabaseConfigured()) return 'other';
  const { data } = await supabase.auth.getSession();
  const signInEmail = data.session?.user.email;
  if (!signInEmail) return 'other';
  const { error: wrong } = await supabase.auth.signInWithPassword({ email: signInEmail, password });
  if (wrong) return 'password';
  const { error } = await supabase.auth.updateUser({ data: { contact_email: email } });
  return error ? 'other' : 'ok';
}
