/**
 * IMPORT — the history exported by Strong or Hevy (CSV), turned into
 * GymTrack sessions. Exercise names are matched to the catalog when it is
 * safe (same movement, same equipment); the others keep their own name.
 * Every session goes through the same zod schema as a stored one.
 */

import { allExercises, type ExerciseDef } from '@/domain/programs';
import { parseList, workoutSchema } from '@/domain/schemas';
import { EXERCISE_NAMES_EN } from '@/i18n/exerciseNames';
import type { CustomExercise, Equipment, Exercise, SetType, Workout, WorkoutSet } from '@/types';

export type ImportSource = 'strong' | 'hevy';

export interface ImportResult {
  source: ImportSource;
  workouts: Workout[];
  /** Exercises matched to the catalog: progression picks up from them. */
  recognized: number;
  /** Exercises kept under their own name: in the history only. */
  unknown: number;
  /** Lines that were not sets with reps (cardio, timed holds, broken lines). */
  skipped: number;
}

export type ImportError = 'empty' | 'unknownFormat' | 'noSets';

// ─── CSV ────────────────────────────────────────────────────────────────

/** RFC 4180 rows: quoted cells, "" for a quote, line breaks inside quotes. Comma or semicolon. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.slice(0, clean.search(/\r?\n|$/));
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i]!;
    if (quoted) {
      if (c === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) rows.push([...row, cell]);
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

// ─── Values ─────────────────────────────────────────────────────────────

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "2024-01-15 18:30:00" (Strong), "15 Jan 2024, 18:30" (Hevy), or anything Date understands. Local time. */
export function parseDate(text: string): Date | null {
  const s = text.trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (iso) {
    const [, y, mo, d, h = '0', mi = '0'] = iso;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  }
  const named = s.match(/^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4}),? (\d{1,2}):(\d{2})/);
  if (named) {
    const month = MONTHS.indexOf(named[2]!.toLowerCase());
    if (month >= 0) return new Date(Number(named[3]), month, Number(named[1]), Number(named[4]), Number(named[5]));
  }
  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

/** "62.5" or "62,5". Empty or not a number: null. */
export function parseNumber(text: string | undefined): number | null {
  if (text == null || text.trim() === '') return null;
  const n = Number(text.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const LB_TO_KG = 0.45359237;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Strong: "1h 5m", "45m" or seconds. */
function durationMinutes(text: string | undefined): number | undefined {
  if (!text?.trim()) return undefined;
  if (/^\d+$/.test(text.trim())) return Math.round(Number(text) / 60);
  const h = Number(text.match(/(\d+)\s*h/)?.[1] ?? 0);
  const m = Number(text.match(/(\d+)\s*m/)?.[1] ?? 0);
  return h * 60 + m || undefined;
}

// ─── Exercise names ─────────────────────────────────────────────────────

/** Lowercase words, no accents or punctuation, plural "s" dropped: "Pull-ups" and "Pull Up" meet. */
export function nameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w.length > 2 && w.endsWith('s') ? w.slice(0, -1) : w))
    .join(' ');
}

const EQUIPMENT_HINT: Record<string, Equipment> = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  machine: 'machine',
  cable: 'machine',
  smith: 'machine',
  bodyweight: 'bodyweight',
};

/** The catalog exercise for "Bench Press (Barbell)", only when movement and equipment agree. */
export function catalogMatch(raw: string, own: CustomExercise[] = []): ExerciseDef | undefined {
  const index = new Map<string, ExerciseDef>();
  for (const def of allExercises(own)) {
    for (const n of [def.name, EXERCISE_NAMES_EN[def.name], ...(def.aliases ?? [])]) {
      if (n && !index.has(nameKey(n))) index.set(nameKey(n), def);
    }
  }
  const m = raw.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  const base = (m ? m[1]! : raw).trim();
  const hintWord = m ? nameKey(m[2]!).split(' ')[0]! : '';
  const hint = EQUIPMENT_HINT[hintWord];
  if (m && !hint) return undefined;
  const candidates = hint ? [`${hintWord} ${base}`, base] : [base];
  for (const candidate of candidates) {
    const def = index.get(nameKey(candidate));
    if (def && (!hint || def.equipment === hint)) return def;
  }
  return undefined;
}

// ─── Formats ────────────────────────────────────────────────────────────

interface Row {
  date: Date;
  title: string;
  exercise: string;
  /** Held for a time (plank…): the reps are seconds. */
  timed: boolean;
  set: Omit<WorkoutSet, 'completed'>;
  minutes?: number;
}

type Columns = Record<string, number>;
const col = (cells: string[], columns: Columns, ...names: string[]) => {
  for (const n of names) {
    const i = columns[n];
    if (i !== undefined) return cells[i];
  }
  return undefined;
};

const STRONG_TYPES: Record<string, SetType> = { w: 'warmup', d: 'drop', f: 'failure' };
const HEVY_TYPES: Record<string, SetType> = { warmup: 'warmup', dropset: 'drop', failure: 'failure' };

/** Kilos. A pounds column is converted; a plain "Weight" (Strong) is read as kilos. */
function weightOf(cells: string[], columns: Columns): number {
  const lbs = parseNumber(col(cells, columns, 'weight_lbs', 'weight (lbs)', 'weight (lb)'));
  if (lbs !== null) return Math.max(0, round2(lbs * LB_TO_KG));
  const kg = parseNumber(col(cells, columns, 'weight_kg', 'weight (kg)', 'weight'));
  return kg !== null ? Math.max(0, round2(kg)) : 0;
}

function rpeOf(cells: string[], columns: Columns): number | undefined {
  const rpe = parseNumber(col(cells, columns, 'rpe'));
  return rpe !== null && rpe > 0 && rpe <= 10 ? rpe : undefined;
}

/**
 * Reps, or seconds for a hold with no distance (a plank, not a run).
 * Neither: null, the line is not a set the app can log.
 */
function amount(cells: string[], columns: Columns, secondsColumn: string, distanceColumns: string[]) {
  const reps = parseNumber(col(cells, columns, 'reps'));
  if (reps !== null && reps > 0) return { reps: Math.round(reps), timed: false };
  const seconds = parseNumber(col(cells, columns, secondsColumn));
  const distance = parseNumber(col(cells, columns, ...distanceColumns)) ?? 0;
  if (seconds !== null && seconds > 0 && distance <= 0) return { reps: Math.round(seconds), timed: true };
  return null;
}

function strongRow(cells: string[], columns: Columns): Row | 'skip' | null {
  const order = (col(cells, columns, 'set order') ?? '').trim().toLowerCase();
  // "Rest Timer" lines and notes are not sets: dropped without counting
  if (!/^\d+$/.test(order) && !STRONG_TYPES[order]) return null;
  const date = parseDate(col(cells, columns, 'date') ?? '');
  const done = amount(cells, columns, 'seconds', ['distance']);
  const exercise = col(cells, columns, 'exercise name')?.trim();
  if (!date || !exercise || !done) return 'skip';
  return {
    date,
    title: col(cells, columns, 'workout name')?.trim() ?? '',
    exercise,
    timed: done.timed,
    minutes: durationMinutes(col(cells, columns, 'duration')),
    set: {
      weight: weightOf(cells, columns),
      reps: done.reps,
      setType: STRONG_TYPES[order] ?? 'normal',
      rpe: rpeOf(cells, columns),
    },
  };
}

function hevyRow(cells: string[], columns: Columns): Row | 'skip' {
  const date = parseDate(col(cells, columns, 'start_time') ?? '');
  const end = parseDate(col(cells, columns, 'end_time') ?? '');
  const done = amount(cells, columns, 'duration_seconds', ['distance_km', 'distance_miles']);
  const exercise = col(cells, columns, 'exercise_title')?.trim();
  if (!date || !exercise || !done) return 'skip';
  const type = (col(cells, columns, 'set_type') ?? '').trim().toLowerCase();
  return {
    date,
    title: col(cells, columns, 'title')?.trim() ?? '',
    exercise,
    timed: done.timed,
    minutes: end ? Math.round((end.getTime() - date.getTime()) / 60000) : undefined,
    set: {
      weight: weightOf(cells, columns),
      reps: done.reps,
      setType: HEVY_TYPES[type] ?? 'normal',
      rpe: rpeOf(cells, columns),
    },
  };
}

function detect(columns: Columns): ImportSource | null {
  if ('exercise_title' in columns && 'start_time' in columns) return 'hevy';
  if ('exercise name' in columns && 'date' in columns && 'set order' in columns) return 'strong';
  return null;
}

const slug = (s: string) => nameKey(s).replace(/ /g, '-').slice(0, 40);

/**
 * Sessions from a Strong or Hevy CSV export. Weights in pounds are turned
 * into kilos. The ids come from the date and title: importing the same file
 * twice adds nothing.
 */
export function importWorkouts(text: string, own: CustomExercise[] = []): ImportResult | ImportError {
  const rows = parseCsv(text);
  const header = rows[0];
  if (!header) return 'empty';
  const columns: Columns = {};
  header.forEach((h, i) => (columns[h.trim().toLowerCase()] = i));
  const source = detect(columns);
  if (!source) return 'unknownFormat';

  let skipped = 0;
  // One lookup per distinct name, not per line
  const matches = new Map<string, ExerciseDef | undefined>();
  const match = (raw: string) => {
    if (!matches.has(raw)) matches.set(raw, catalogMatch(raw, own));
    return matches.get(raw);
  };
  const sessions = new Map<string, { date: Date; title: string; minutes?: number; exercises: Map<string, Exercise> }>();
  for (const cells of rows.slice(1)) {
    const row = source === 'hevy' ? hevyRow(cells, columns) : strongRow(cells, columns);
    if (row === null) continue;
    if (row === 'skip') {
      skipped++;
      continue;
    }
    const key = `${row.date.getTime()}|${row.title}`;
    const session = sessions.get(key) ?? {
      date: row.date,
      title: row.title,
      minutes: row.minutes,
      exercises: new Map(),
    };
    sessions.set(key, session);
    const def = match(row.exercise);
    const name = (def?.name ?? row.exercise).slice(0, 100);
    const exercise: Exercise = session.exercises.get(name) ?? {
      id: `${slug(name)}-${session.exercises.size}`,
      name,
      category: def?.category ?? 'compound',
      muscleGroups: def?.muscleGroups ?? [],
      sets: [],
      ...(row.timed || def?.timed ? { timed: true } : {}),
    };
    session.exercises.set(name, exercise);
    const { rpe, ...set } = row.set;
    exercise.sets.push({ ...set, ...(rpe !== undefined ? { rpe } : {}), completed: true });
  }

  const workouts: Workout[] = [...sessions.values()].map((s) => ({
    id: `import-${source}-${s.date.getTime()}-${slug(s.title)}`,
    date: s.date.toISOString(),
    name: s.title.slice(0, 100),
    type: 'strength',
    exercises: [...s.exercises.values()],
    ...(s.minutes !== undefined && s.minutes > 0 ? { duration: Math.min(s.minutes, 24 * 60) } : {}),
    feeling: 3,
    completed: true,
  }));
  const { valid } = parseList(workoutSchema, workouts);
  if (valid.length === 0) return 'noSets';

  const names = new Set(valid.flatMap((w) => w.exercises.map((e) => e.name)));
  const recognized = [...names].filter((n) => match(n)).length;
  return { source, workouts: valid, recognized, unknown: names.size - recognized, skipped };
}
