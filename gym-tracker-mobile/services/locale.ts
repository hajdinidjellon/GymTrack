/** The phone's language, "fr-FR". Hermes reads it from the system; null when it cannot. */
export function deviceLocaleTag(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return null;
  }
}
