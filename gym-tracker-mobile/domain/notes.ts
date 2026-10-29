/**
 * A short note per exercise, kept from one session to the next:
 * "siège cran 4", "prise serrée", "poulie haute".
 */

export const NOTE_MAX_LENGTH = 120;

/** One line, no stray spaces, never longer than the limit. Nothing left: no note. */
export function cleanNote(text: string): string | null {
  const line = text.replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX_LENGTH).trim();
  return line || null;
}
