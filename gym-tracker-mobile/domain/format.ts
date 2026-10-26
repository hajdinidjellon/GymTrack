/** "Mardi 21 oct." */
export function formatDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const text = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Mar. 14 oct." */
export function formatShortDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const text = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "4 800" with a thin space, the French way. */
export function formatThousands(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * A number typed on the keyboard: "62,5" or "62.5". Null while it is not a
 * valid amount yet (empty, "abc", negative). `integer` rounds reps.
 */
export function parseAmount(text: string, integer = false): number | null {
  const clean = text.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(clean)) return null;
  const n = Number(clean);
  if (!Number.isFinite(n)) return null;
  return integer ? Math.round(n) : Math.round(n * 100) / 100;
}
