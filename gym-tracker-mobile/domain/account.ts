// Accounts work with a username: the email is optional.
// Supabase signs in with an email, so a username gets a private address that never receives mail.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 6;
const USERNAME_DOMAIN = 'users.gymtrack.app';

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** The message to show, or null when the username is fine. */
export function usernameError(raw: string): string | null {
  const name = normalizeUsername(raw);
  if (name.length < USERNAME_MIN) return `Ton pseudo doit faire au moins ${USERNAME_MIN} caractères.`;
  if (name.length > USERNAME_MAX) return `Ton pseudo doit faire ${USERNAME_MAX} caractères maximum.`;
  if (!/^[a-z0-9._-]+$/.test(name)) return 'Ton pseudo : lettres sans accent, chiffres, point, tiret ou _ seulement.';
  return null;
}

export function passwordError(password: string): string | null {
  return password.length < PASSWORD_MIN ? `Ton mot de passe doit faire au moins ${PASSWORD_MIN} caractères.` : null;
}

/** Empty is fine: the email is optional. */
export function contactEmailError(raw: string): string | null {
  const email = raw.trim();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : "Cet email n'a pas l'air valide.";
}

/** What Supabase signs in with: an email as typed, or the private address of a username. */
export function loginEmail(identifier: string): string {
  const id = identifier.trim();
  return id.includes('@') ? id : `${normalizeUsername(id)}@${USERNAME_DOMAIN}`;
}
