/**
 * The home's greeting: « Bonjour » by day, « Bonsoir » from 18 h, with the user's username when
 * they have an account (« djellon » shown « Djellon »).
 */

/** From 18 h to 4 h it is the evening. */
export const isEvening = (hour: number): boolean => hour >= 18 || hour < 5;

/** A username as a first name: its first letter up, the rest as typed. */
export function displayName(username: string | null | undefined): string | null {
  const name = username?.trim();
  return name ? name.charAt(0).toLocaleUpperCase('fr-FR') + name.slice(1) : null;
}
