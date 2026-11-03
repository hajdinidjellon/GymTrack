// Accounts work with a username: the email is optional.
// Supabase signs in with an email, so a username gets a private address that never receives mail.

import { t } from '@/i18n';

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 6;
// Kept from the app's first name: accounts already created sign in with it.
const USERNAME_DOMAIN = 'users.gymtrack.app';

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** The message to show, or null when the username is fine. */
export function usernameError(raw: string): string | null {
  const name = normalizeUsername(raw);
  if (name.length < USERNAME_MIN) return t('domain.account.usernameShort', { min: USERNAME_MIN });
  if (name.length > USERNAME_MAX) return t('domain.account.usernameLong', { max: USERNAME_MAX });
  if (!/^[a-z0-9._-]+$/.test(name)) return t('domain.account.usernameChars');
  return null;
}

export function passwordError(password: string): string | null {
  return password.length < PASSWORD_MIN ? t('domain.account.passwordShort', { min: PASSWORD_MIN }) : null;
}

/** Empty is fine: the email is optional. */
export function contactEmailError(raw: string): string | null {
  const email = raw.trim();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : t('domain.account.emailInvalid');
}

/** What Supabase signs in with: an email as typed, or the private address of a username. */
export function loginEmail(identifier: string): string {
  const id = identifier.trim();
  return id.includes('@') ? id : `${normalizeUsername(id)}@${USERNAME_DOMAIN}`;
}
