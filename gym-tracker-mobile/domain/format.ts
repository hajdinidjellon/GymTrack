import { clampAmount } from '@/domain/limits';
import { getLocale, listOf, localeTag, t, type TKey } from '@/i18n';

/** "Mardi 21 oct." */
export function formatDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const text = d.toLocaleDateString(localeTag(), { weekday: 'long', day: 'numeric', month: 'short' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Mar. 14 oct." */
export function formatShortDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const text = d.toLocaleDateString(localeTag(), { weekday: 'short', day: 'numeric', month: 'short' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "19:42". */
export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit' });
}

/** "19:42" today, "hier à 19:42", "Lun. 3 nov. à 19:42" further back. */
export function formatMoment(ms: number, now: number): string {
  const time = formatTime(ms);
  const day = new Date(ms).toDateString();
  if (day === new Date(now).toDateString()) return time;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (day === yesterday.toDateString()) return t('domain.format.yesterdayAt', { time });
  return t('domain.format.dayAt', { day: formatShortDay(new Date(ms)), time });
}

/** "45 min", "1 h 08" for a session. */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return t('domain.format.minutes', { m });
  return t('domain.format.hoursMinutes', { h: Math.floor(m / 60), m: String(m % 60).padStart(2, '0') });
}

/** "4 800" with a thin space, the French way; "4,800" in English. */
export function formatThousands(n: number): string {
  const separator = getLocale() === 'fr' ? ' ' : ',';
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, separator);
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
  // Over what a session can save: the most it can hold
  const kept = clampAmount(n);
  return integer ? Math.round(kept) : Math.round(kept * 100) / 100;
}

/** "1:30" for a timer. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** "45 s", "2 min", "2 min 30" for a rest. */
export function formatRest(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return t('domain.format.seconds', { s });
  const rest = s % 60;
  return rest
    ? t('domain.format.minutesSeconds', { m: Math.floor(s / 60), s: String(rest).padStart(2, '0') })
    : t('domain.format.minutes', { m: s / 60 });
}

/** "1 série", "3 séries". French keeps 0 and 1 singular. */
export function countFr(n: number, word: string, format: (n: number) => string = String): string {
  return `${format(n)} ${n > 1 ? `${word}s` : word}`;
}

/** "a, b et c", "a, b and c" in English. */
export function listFr(items: string[]): string {
  return listOf(items);
}

/**
 * A list of display texts that follows the language: each item is read when
 * it is used, so a module-level constant does not freeze the French.
 */
export function translatedList(keys: readonly TKey[]): string[] {
  const list: string[] = [];
  keys.forEach((key, i) => Object.defineProperty(list, i, { get: () => t(key), enumerable: true }));
  return list;
}
