/**
 * LA VOIX ENREGISTRÉE — what the app says, as recorded clips chained one
 * after the other (« Série deux. » + « soixante-deux kilos et demi, » +
 * « dix reps. »). Every line keeps its text: when a clip is missing (an own
 * exercise, an unusual weight), the phone's voice says the whole line, never
 * half of it in another voice. Pure: the clips themselves are in services/.
 */

import { EXERCISES } from '@/domain/programs';
import { frenchNumber } from '@/domain/frenchNumber';

/** A line to say: its text, and the clips that say it in the recorded voice when they all exist. */
export interface Spoken {
  text: string;
  /** null: this line can only be said by the phone's voice. */
  clips: string[] | null;
  /** Said after the clips by the phone's voice: free text the user typed (a note). */
  tail?: string;
}

export const spoken = (text: string, clips: string[] | null, tail?: string): Spoken =>
  tail ? { text, clips, tail } : { text, clips };

/** Several lines one after the other. Recorded only if each of them is. */
export function joinSpoken(...lines: (Spoken | null)[]): Spoken {
  const parts = lines.filter((l): l is Spoken => !!l);
  const clips = parts.every((p) => p.clips) ? parts.flatMap((p) => p.clips!) : null;
  const tails = parts.map((p) => p.tail).filter(Boolean);
  return spoken(parts.map((p) => p.text).join(' '), clips, tails.join(' ') || undefined);
}

/** Recorded set numbers, reps and seconds. */
export const VOICE_RANGES = {
  sets: 20,
  warmups: 6,
  reps: 50,
  /** Seconds: every 5 s up to 5 min, then every 30 s up to 10 min. */
  seconds: [...range(5, 300, 5), ...range(330, 600, 30)],
  setsLeft: 10,
  /** Plates of the same kind on one side. */
  plateCount: 4,
} as const;

/** Recorded weights: every kilo up to 300, every half up to 250, every quarter up to 150. */
export function isRecordedWeight(kg: number): boolean {
  if (kg < 1 || kg > 300) return false;
  const quarters = Math.round(kg * 4);
  if (Math.abs(quarters - kg * 4) > 1e-6) return false;
  if (quarters % 4 === 0) return true;
  if (quarters % 2 === 0) return kg <= 250;
  return kg <= 150;
}

const key = (kg: number) => String(Math.round(kg * 100) / 100);

export const clipIds = {
  set: (n: number) => (n >= 1 && n <= VOICE_RANGES.sets ? `set-${n}` : null),
  lastSet: (variant: number) => `last-set-${(variant % 3) + 1}`,
  warmup: (n: number) => (n >= 1 && n <= VOICE_RANGES.warmups ? `warmup-${n}` : null),
  drop: () => 'drop',
  weight: (kg: number) => (isRecordedWeight(kg) ? `kg-${key(kg)}` : null),
  perSide: () => 'per-side',
  perHand: () => 'per-hand',
  reps: (n: number) => (n >= 1 && n <= VOICE_RANGES.reps ? `reps-${n}` : null),
  seconds: (n: number) => ((VOICE_RANGES.seconds as readonly number[]).includes(n) ? `sec-${n}` : null),
  /** One kind of plate on one side: « vingt », « deux fois vingt »; the last one after « et ». */
  plate: (kg: number, count: number, last: boolean) =>
    PLATE_WORDS[key(kg)] && count >= 1 && count <= VOICE_RANGES.plateCount
      ? `plate-${last ? 'and-' : ''}${count}x${key(kg)}`
      : null,
  putOn: () => 'put-on',
  eachSide: () => 'each-side',
  emptyBar: () => 'empty-bar',
  pickStart: () => 'pick-start',
  nextExercise: (name: string) => (CATALOG_NAMES.has(name) ? `next-${slug(name)}` : null),
  restOver: (variant: number) => `rest-over-${(variant % 3) + 1}`,
  holdGo: () => 'hold-go',
  setsLeft: (n: number) => (n >= 1 && n <= VOICE_RANGES.setsLeft ? `left-${n}` : null),
  sessionDone: (variant: number) => `done-${(variant % 3) + 1}`,
  voiceHello: () => 'hello',
};

/** Clip ids from the name of an exercise: lower case, no accents, dashes. */
export function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const CATALOG_NAMES = new Set(Object.values(EXERCISES).map((e) => e.name));

/** How each plate is said, without « kilos »: the gym's way. */
const PLATE_WORDS: Record<string, string> = {
  '25': 'vingt-cinq',
  '20': 'vingt',
  '15': 'quinze',
  '10': 'dix',
  '5': 'cinq',
  '2.5': 'deux et demi',
  '2': 'deux',
  '1.25': 'un vingt-cinq',
  '1': 'un',
  '0.5': 'cinq cents grammes',
  '0.25': 'deux cent cinquante grammes',
};

/** « soixante-deux kilos et demi », « cent un virgule vingt-cinq kilos ». */
export function weightWords(kg: number): string {
  const whole = Math.floor(kg + 1e-9);
  const cents = Math.round((kg - whole) * 100);
  const n = frenchNumber(whole);
  // Sous deux kilos, « kilo » reste au singulier : « un kilo et demi »
  const unit = whole < 2 ? 'kilo' : 'kilos';
  if (cents === 0) return `${n} ${unit}`;
  if (cents === 50) return `${n} ${unit} et demi`;
  return `${n} virgule ${frenchNumber(cents)} ${unit}`;
}

function range(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let n = from; n <= to; n += step) out.push(n);
  return out;
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Every clip to record, with the exact text to say. The voice pack must hold all of them. */
export function voiceInventory(): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  const add = (id: string | null, text: string) => {
    if (id) out.push({ id, text });
  };
  for (let n = 1; n <= VOICE_RANGES.sets; n++) add(clipIds.set(n), `Série ${frenchNumber(n)}.`);
  ['Dernière série !', 'Dernière série, donne tout !', 'Allez, la dernière !'].forEach((text, i) =>
    add(clipIds.lastSet(i), text),
  );
  for (let n = 1; n <= VOICE_RANGES.warmups; n++) add(clipIds.warmup(n), `Échauffement ${frenchNumber(n)}.`);
  add(clipIds.drop(), 'Dégressive.');
  for (let q = 4; q <= 1200; q++) {
    const kg = q / 4;
    if (isRecordedWeight(kg)) add(clipIds.weight(kg), `${capital(weightWords(kg))},`);
  }
  add(clipIds.perSide(), 'de chaque côté,');
  add(clipIds.perHand(), 'par haltère,');
  for (let n = 1; n <= VOICE_RANGES.reps; n++) add(clipIds.reps(n), n === 1 ? 'une rep.' : `${frenchNumber(n)} reps.`);
  for (const n of VOICE_RANGES.seconds) add(clipIds.seconds(n), `${frenchNumber(n)} secondes.`);
  for (const [plate, words] of Object.entries(PLATE_WORDS)) {
    for (let c = 1; c <= VOICE_RANGES.plateCount; c++) {
      const said = c === 1 ? words : `${frenchNumber(c)} fois ${words}`;
      add(clipIds.plate(Number(plate), c, false), `${said},`);
      add(clipIds.plate(Number(plate), c, true), `et ${said}`);
    }
  }
  add(clipIds.putOn(), 'Mets');
  add(clipIds.eachSide(), 'de chaque côté.');
  add(clipIds.emptyBar(), 'Barre à vide.');
  add(clipIds.pickStart(), 'Choisis ta charge de départ.');
  for (const name of [...CATALOG_NAMES].sort()) add(clipIds.nextExercise(name), `Prochain exercice : ${name}.`);
  ["C'est reparti !", 'On y retourne !', "Allez, c'est reparti !"].forEach((text, i) => add(clipIds.restOver(i), text));
  add(clipIds.holdGo(), "C'est parti !");
  add(clipIds.setsLeft(1), 'Plus qu’une série !');
  for (let n = 2; n <= VOICE_RANGES.setsLeft; n++) add(clipIds.setsLeft(n), `Plus que ${frenchNumber(n)} séries.`);
  [
    'Séance terminée. Énorme travail aujourd’hui !',
    'Et voilà, séance terminée ! Bien joué.',
    'Séance bouclée. Tu peux être fier de toi !',
  ].forEach((text, i) => add(clipIds.sessionDone(i), text));
  add(clipIds.voiceHello(), 'Voix activée. Je te dirai quoi charger.');
  return out;
}
