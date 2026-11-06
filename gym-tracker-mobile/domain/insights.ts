/**
 * CE QUE L'APP SAIT DE TOI — ce que l'historique raconte de la façon dont
 * l'utilisateur s'entraîne : quand, combien de temps, à quel rythme, combien
 * il se repose sur chaque exercice, où il progresse le plus. Logique pure.
 */

import { formatRest, translatedList } from '@/domain/format';
import { formatKg } from '@/domain/plates';
import { allExercises } from '@/domain/programs';
import { usualRest } from '@/domain/rest';
import { exerciseHistory, weightHistory } from '@/domain/sessionBuilder';
import { LEFT_OPEN_MINUTES } from '@/domain/sessionTime';
import { exerciseName, listOf, t } from '@/i18n';
import type { CustomExercise, Workout } from '@/types';

export interface Insight {
  id: 'time' | 'days' | 'duration' | 'rhythm' | 'rest' | 'strong';
  title: string;
  text: string;
}

/** Sessions before there is anything worth saying. */
export const INSIGHTS_AFTER = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
// Sunday first, like Date.getDay()
const WEEKDAYS = translatedList([
  'domain.weekdays.sun',
  'domain.weekdays.mon',
  'domain.weekdays.tue',
  'domain.weekdays.wed',
  'domain.weekdays.thu',
  'domain.weekdays.fri',
  'domain.weekdays.sat',
]);

type PartOfDay = 'morning' | 'midday' | 'afternoon' | 'evening';

function partOfDay(hour: number): PartOfDay {
  if (hour < 12) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function trainingTime(workouts: Workout[]): Insight | null {
  const counts = new Map<PartOfDay, number>();
  for (const w of workouts) {
    const part = partOfDay(new Date(w.date).getHours());
    counts.set(part, (counts.get(part) ?? 0) + 1);
  }
  const [part, count] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? ['morning', 0];
  if (count / workouts.length < 0.5) return null;
  return {
    id: 'time',
    title: t('domain.insights.timeTitle'),
    text: t('domain.insights.timeText', { part: t(`domain.insights.${part}`) }),
  };
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
    title: t('domain.insights.daysTitle'),
    text: t('domain.insights.daysText', { days: listOf(days.map((d) => WEEKDAYS[d]!)) }),
  };
}

function duration(workouts: Workout[]): Insight | null {
  const minutes = workouts
    .slice(0, 5)
    .map((w) => w.duration ?? 0)
    // A session forgotten open (saved before the end was capped) tells nothing of the usual length
    .filter((m) => m >= 10 && m <= LEFT_OPEN_MINUTES);
  if (minutes.length < INSIGHTS_AFTER) return null;
  const mean = Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length / 5) * 5;
  return {
    id: 'duration',
    title: t('domain.insights.durationTitle'),
    text: t('domain.insights.durationText', { minutes: mean }),
  };
}

function rhythm(workouts: Workout[], perWeek: number, now: Date): Insight | null {
  const oldest = new Date(workouts[workouts.length - 1]!.date).getTime();
  const weeks = Math.min(4, Math.floor((now.getTime() - oldest) / (7 * DAY_MS)));
  if (weeks < 2) return null;
  const done = workouts.filter((w) => now.getTime() - new Date(w.date).getTime() < weeks * 7 * DAY_MS).length;
  const planned = weeks * perWeek;
  const text =
    done >= planned
      ? t('domain.insights.rhythmKept', { count: done, weeks, perWeek })
      : t('domain.insights.rhythmBehind', { count: done, planned, weeks });
  return { id: 'rhythm', title: t('domain.insights.rhythmTitle'), text };
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
    title: t('domain.insights.restTitle'),
    text: t('domain.insights.restText', {
      list: longest.map((r) => `${exerciseName(r.name)} ${formatRest(r.usual)}`).join(' · '),
    }),
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
  return {
    id: 'strong',
    title: t('domain.insights.strongTitle'),
    text: t('domain.insights.strongText', { name: exerciseName(best.name), gain: formatKg(best.gain) }),
  };
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
