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

/** "1:30" for a timer. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** "45 s", "2 min", "2 min 30" for a rest. */
export function formatRest(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s} s`;
  const rest = s % 60;
  return rest ? `${Math.floor(s / 60)} min ${String(rest).padStart(2, '0')}` : `${s / 60} min`;
}

/** "1 série", "3 séries". French keeps 0 and 1 singular. */
export function countFr(n: number, word: string, format: (n: number) => string = String): string {
  return `${format(n)} ${n > 1 ? `${word}s` : word}`;
}

/** "a, b et c" */
export function listFr(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
}
