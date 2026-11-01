/**
 * EXPORT — tout l'historique en CSV, une ligne par série, lisible dans
 * Excel ou Numbers (séparateur « ; » et virgule décimale, à la française).
 */

import { t } from '@/i18n';
import type { Workout } from '@/types';

const header = () =>
  (['date', 'time', 'session', 'exercise', 'set', 'weight', 'reps', 'warmup', 'rest'] as const).map((k) =>
    t(`domain.csv.${k}`),
  );

/** Same values in every language: decimal comma, as the « ; » separator expects. */
const kg = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

function cell(value: string): string {
  return /[;"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Validated sets only, oldest session first. */
export function workoutsToCsv(workouts: Workout[]): string {
  const rows = [...workouts]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .flatMap((w) => {
      const d = new Date(w.date);
      const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      return w.exercises.flatMap((e) =>
        e.sets
          .filter((s) => s.completed !== false)
          .map((s, i) => [
            day,
            time,
            w.name,
            e.name,
            String(i + 1),
            kg(s.weight),
            String(s.reps),
            s.setType === 'warmup' ? t('domain.csv.yes') : t('domain.csv.no'),
            s.restTaken != null ? String(s.restTaken) : '',
          ]),
      );
    });
  return [header(), ...rows].map((r) => r.map(cell).join(';')).join('\n');
}
