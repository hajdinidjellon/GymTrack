/**
 * ACCOUNT RECOVERY — the recovery code as the user types it, and when to suggest an email.
 * The code itself is made and checked on the server (supabase/functions/_shared/recovery.ts):
 * OKL-XXXX-XXXX-XXXX, 12 symbols of Crockford base 32, 60 bits.
 */

/** As typed: any case, spaces or dashes, O for 0 and I or L for 1. Null when it cannot be a code. */
export function normalizeRecoveryCode(raw: string): string | null {
  const body = raw
    .toUpperCase()
    .replace(/^\s*OKL/, '')
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  return /^[0-9A-HJKMNP-TV-Z]{12}$/.test(body) ? body : null;
}

/** "OKL-7K2M-…" grouped by 4, easier to read aloud or copy by hand. */
export function displayRecoveryCode(code: string): string[] {
  return code.split('-');
}

/** After this many saved sessions, an account without email is asked once to add one. */
export const RECOVERY_PROMPT_AFTER = 5;

export function shouldSuggestRecoveryEmail(input: {
  signedIn: boolean;
  hasEmail: boolean;
  sessions: number;
  dismissed: boolean;
}): boolean {
  return input.signedIn && !input.hasEmail && !input.dismissed && input.sessions >= RECOVERY_PROMPT_AFTER;
}
