/**
 * EXPORT — tout l'historique en CSV, une ligne par série, lisible dans
 * Excel ou Numbers (séparateur « ; » et virgule décimale, à la française).
 */

import { formatKg } from '@/domain/plates';
import type { Workout } from '@/types';

const HEADER = ['date', 'heure', 'séance', 'exercice', 'série', 'charge (kg)', 'reps', 'échauffement', 'repos (s)'];

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
            formatKg(s.weight),
            String(s.reps),
            s.setType === 'warmup' ? 'oui' : 'non',
            s.restTaken != null ? String(s.restTaken) : '',
          ]),
      );
    });
  return [HEADER, ...rows].map((r) => r.map(cell).join(';')).join('\n');
}
