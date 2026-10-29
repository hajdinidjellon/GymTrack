/**
 * CE QUE L'APP SAIT DE TOI — ce que l'historique raconte de la façon dont
 * l'utilisateur s'entraîne : quand, combien de temps, à quel rythme, combien
 * il se repose sur chaque exercice, où il progresse le plus. Logique pure.
 */

import { countFr, formatRest, listFr } from '@/domain/format';
import { formatKg } from '@/domain/plates';
import { allExercises } from '@/domain/programs';
import { usualRest } from '@/domain/rest';
import { exerciseHistory, weightHistory } from '@/domain/sessionBuilder';
import type { CustomExercise, Workout } from '@/types';

export interface Insight {
  id: 'time' | 'days' | 'duration' | 'rhythm' | 'rest' | 'strong';
  title: string;
  text: string;
}

/** Sessions before there is anything worth saying. */
export const INSIGHTS_AFTER = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function partOfDay(hour: number): string {
  if (hour < 12) return 'le matin';
  if (hour < 14) return 'le midi';
  if (hour < 18) return "l'après-midi";
  return 'le soir';
}

function trainingTime(workouts: Workout[]): Insight | null {
  const counts = new Map<string, number>();
  for (const w of workouts) {
    const part = partOfDay(new Date(w.date).getHours());
    counts.set(part, (counts.get(part) ?? 0) + 1);
  }
  const [part, count] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
  if (count / workouts.length < 0.5) return null;
  return { id: 'time', title: 'Ton moment', text: `Tu t'entraînes surtout ${part}.` };
}

function usualDays(workouts: Workout[], perWeek: number, now: Date): Insight | null {
  const recent = workouts.filter((w) => now.getTime() - new Date(w.date).getTime() < 8 * 7 * DAY_MS);
  if (recent.length < 4) return null;
  const counts = Array.from({ length: 7 }, () => 0);
  for (const w of recent) counts[new Date(w.date).getDay()]!++;
  const max = Math.max(...counts);
  // Lundi d'abord, dans l'ordre de la semaine
  const days = [1, 2, 3, 4, 5, 6, 0]
    .filter((d) => counts[d]! >= 2 && counts[d]! >= max / 2)
    .slice(0, Math.max(1, perWeek));
  if (days.length === 0) return null;
  return {
    id: 'days',
    title: 'Tes jours',
    text: `Tu viens le plus souvent le ${listFr(days.map((d) => WEEKDAYS[d]!))}.`,
  };
}

function duration(workouts: Workout[]): Insight | null {
  const minutes = workouts
    .slice(0, 5)
    .map((w) => w.duration ?? 0)
    .filter((m) => m >= 10);
  if (minutes.length < INSIGHTS_AFTER) return null;
  const mean = Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length / 5) * 5;
  return { id: 'duration', title: 'Ta séance type', text: `Tes séances durent environ ${mean} min.` };
}

function rhythm(workouts: Workout[], perWeek: number, now: Date): Insight | null {
  const oldest = new Date(workouts[workouts.length - 1]!.date).getTime();
  const weeks = Math.min(4, Math.floor((now.getTime() - oldest) / (7 * DAY_MS)));
  if (weeks < 2) return null;
  const done = workouts.filter((w) => now.getTime() - new Date(w.date).getTime() < weeks * 7 * DAY_MS).length;
  const planned = weeks * perWeek;
  const text =
    done >= planned
      ? `${countFr(done, 'séance')} en ${weeks} semaines : tu tiens ton rythme de ${perWeek} par semaine.`
      : `${countFr(done, 'séance')} sur ${planned} prévues ces ${weeks} dernières semaines.`;
  return { id: 'rhythm', title: 'Ton rythme', text };
}

function rests(workouts: Workout[], own: CustomExercise[]): Insight | null {
  const found = allExercises(own).flatMap((def) => {
    const usual = usualRest(exerciseHistory(def, workouts));
    return usual == null ? [] : [{ name: def.name, usual }];
  });
  if (found.length === 0) return null;
  const longest = [...found].sort((a, b) => b.usual - a.usual).slice(0, 3);
  return {
    id: 'rest',
    title: 'Tes repos',
    text: `${longest.map((r) => `${r.name} ${formatRest(r.usual)}`).join(' · ')}, en moyenne entre deux séries.`,
  };
}

function strongest(workouts: Workout[], own: CustomExercise[]): Insight | null {
  const best = allExercises(own)
    .flatMap((def) => {
      const points = weightHistory(def, workouts);
      const first = points[0];
      const last = points[points.length - 1];
      if (points.length < 3 || !first || !last || last.weight <= first.weight) return [];
      return [{ name: def.name, gain: last.weight - first.weight, ratio: last.weight / first.weight }];
    })
    .sort((a, b) => b.ratio - a.ratio)[0];
  if (!best) return null;
  return { id: 'strong', title: 'Ton point fort', text: `${best.name} : +${formatKg(best.gain)} kg depuis le début.` };
}

/** What the history says about the user. Empty until there are a few sessions. */
export function insights(
  workouts: Workout[],
  options: { perWeek: number; own?: CustomExercise[]; now: Date },
): Insight[] {
  if (workouts.length < INSIGHTS_AFTER) return [];
  const sorted = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const own = options.own ?? [];
  return [
    trainingTime(sorted),
    usualDays(sorted, options.perWeek, options.now),
    duration(sorted),
    rhythm(sorted, options.perWeek, options.now),
    rests(sorted, own),
    strongest(sorted, own),
  ].filter((i): i is Insight => i !== null);
}
