/**
 * The muscles each catalog exercise works, finer than `muscleGroups`: the main
 * ones, then the ones that help. Drawn on the muscle map of the exercise page
 * and lit on the mascot in the exercise videos. Names are the muscle map's.
 */

import { EXERCISES, type ExerciseKey } from '@/domain/catalog';

export type Muscle =
  | 'chest'
  | 'deltoids'
  | 'biceps'
  | 'triceps'
  | 'forearm'
  | 'abs'
  | 'obliques'
  | 'trapezius'
  | 'upper-back'
  | 'lower-back'
  | 'gluteal'
  | 'quadriceps'
  | 'hamstring'
  | 'adductors'
  | 'calves';

export interface Worked {
  primary: Muscle[];
  secondary: Muscle[];
}

type M = Muscle;
const w = (primary: M[], secondary: M[] = []): Worked => ({ primary, secondary });

// Shared patterns
const PRESS = w(['chest'], ['triceps', 'deltoids']);
const INCLINE = w(['chest', 'deltoids'], ['triceps']);
const DECLINE = w(['chest'], ['triceps']);
const FLY = w(['chest'], ['deltoids']);
const PUSHUP = w(['chest'], ['triceps', 'deltoids', 'abs']);
const DIPS = w(['chest', 'triceps'], ['deltoids']);
const VERTICAL_PULL = w(['upper-back'], ['biceps', 'forearm']);
const ROW = w(['upper-back'], ['biceps', 'trapezius', 'deltoids']);
const DEADLIFT = w(['lower-back', 'gluteal', 'hamstring'], ['quadriceps', 'trapezius', 'forearm']);
const HINGE = w(['hamstring', 'gluteal'], ['lower-back']);
const SHRUG = w(['trapezius'], ['forearm']);
const BACK_EXT = w(['lower-back'], ['gluteal', 'hamstring']);
const OVERHEAD = w(['deltoids'], ['triceps', 'trapezius']);
const LATERAL = w(['deltoids'], ['trapezius']);
const FRONT_RAISE = w(['deltoids'], ['chest']);
const REAR_DELT = w(['deltoids'], ['upper-back', 'trapezius']);
const UPRIGHT = w(['deltoids', 'trapezius'], ['biceps']);
const CURL = w(['biceps'], ['forearm']);
const HAMMER = w(['biceps', 'forearm']);
const TRICEPS = w(['triceps']);
const CLOSE_PRESS = w(['triceps'], ['chest', 'deltoids']);
const SQUAT = w(['quadriceps', 'gluteal'], ['adductors', 'hamstring', 'lower-back']);
const LEG_PRESS = w(['quadriceps', 'gluteal'], ['adductors', 'hamstring']);
const LUNGE = w(['quadriceps', 'gluteal'], ['adductors', 'hamstring', 'calves']);
const HIP_THRUST = w(['gluteal'], ['hamstring', 'quadriceps']);
const GLUTE_SIDE = w(['gluteal']);
const GLUTE_KICK = w(['gluteal'], ['hamstring']);
const CALVES = w(['calves']);
const CRUNCH = w(['abs'], ['obliques']);
const LEG_RAISE = w(['abs'], ['obliques', 'quadriceps']);
const HANGING = w(['abs'], ['obliques', 'forearm', 'upper-back']);
const TWIST = w(['obliques'], ['abs']);
const PLANK = w(['abs'], ['obliques', 'deltoids']);

export const WORKED: Record<ExerciseKey, Worked> = {
  // Chest
  bench: PRESS,
  dbbench: PRESS,
  smithbench: PRESS,
  widebench: w(['chest'], ['deltoids', 'triceps']),
  inclinebar: INCLINE,
  incline: INCLINE,
  inclinesmith: INCLINE,
  decline: DECLINE,
  declinedb: DECLINE,
  declinesmith: DECLINE,
  declinemachine: DECLINE,
  floorpress: w(['chest', 'triceps'], ['deltoids']),
  dbfloorpress: w(['chest', 'triceps'], ['deltoids']),
  squeezepress: w(['chest'], ['triceps']),
  convergent: PRESS,
  chestpress: PRESS,
  inclinemachine: INCLINE,
  dips: DIPS,
  assisteddips: DIPS,
  ringdips: DIPS,
  pushup: PUSHUP,
  inclinepushup: PUSHUP,
  declinepushup: w(['chest', 'deltoids'], ['triceps', 'abs']),
  kneepushup: PUSHUP,
  clappushup: PUSHUP,
  archerpushup: PUSHUP,
  onearmpushup: w(['chest'], ['triceps', 'deltoids', 'abs', 'obliques']),
  fly: FLY,
  lowfly: FLY,
  highfly: FLY,
  pecdeck: FLY,
  dbfly: FLY,
  inclinefly: FLY,
  dbpullover: w(['chest', 'upper-back'], ['triceps']),

  // Back
  pullup: VERTICAL_PULL,
  chinup: w(['upper-back', 'biceps'], ['forearm']),
  widepullup: VERTICAL_PULL,
  neutralpullup: VERTICAL_PULL,
  assisted: VERTICAL_PULL,
  invertedrow: ROW,
  muscleup: w(['upper-back', 'triceps'], ['chest', 'biceps', 'deltoids']),
  pulldown: VERTICAL_PULL,
  closepulldown: VERTICAL_PULL,
  reversepulldown: w(['upper-back', 'biceps'], ['forearm']),
  singlepulldown: VERTICAL_PULL,
  machinepulldown: VERTICAL_PULL,
  row: w(['upper-back'], ['biceps', 'trapezius', 'lower-back']),
  pendlay: w(['upper-back'], ['biceps', 'trapezius', 'lower-back']),
  dbrow: ROW,
  chestrow: ROW,
  renegaderow: w(['upper-back'], ['biceps', 'abs', 'obliques']),
  meadows: ROW,
  seatedrow: ROW,
  singlecablerow: ROW,
  machinerow: ROW,
  highrow: w(['upper-back', 'trapezius'], ['biceps', 'deltoids']),
  tbar: ROW,
  deadlift: DEADLIFT,
  trapbar: w(['quadriceps', 'gluteal', 'lower-back'], ['hamstring', 'trapezius', 'forearm']),
  dbdeadlift: DEADLIFT,
  rackpull: w(['lower-back', 'trapezius'], ['gluteal', 'upper-back', 'forearm']),
  pullover: w(['upper-back'], ['triceps', 'chest']),
  machinepullover: w(['upper-back'], ['chest', 'triceps']),
  shrug: SHRUG,
  barshrug: SHRUG,
  machineshrug: SHRUG,
  smithshrug: SHRUG,
  backext: BACK_EXT,
  backextmachine: BACK_EXT,
  superman: BACK_EXT,
  frontlever: w(['upper-back', 'abs'], ['triceps', 'deltoids']),

  // Shoulders
  ohp: OVERHEAD,
  seatedohp: OVERHEAD,
  dbpress: OVERHEAD,
  smithpress: OVERHEAD,
  shoulderpress: OVERHEAD,
  arnold: OVERHEAD,
  pushpress: w(['deltoids'], ['triceps', 'quadriceps', 'gluteal']),
  landminepress: w(['deltoids', 'chest'], ['triceps']),
  kbpress: OVERHEAD,
  pikepushup: OVERHEAD,
  hspu: OVERHEAD,
  handstand: w(['deltoids'], ['triceps', 'trapezius', 'abs']),
  lateral: LATERAL,
  cablelateral: LATERAL,
  machinelateral: LATERAL,
  frontraise: FRONT_RAISE,
  cablefront: FRONT_RAISE,
  barfront: FRONT_RAISE,
  reardelt: REAR_DELT,
  cablereardelt: REAR_DELT,
  reversepec: REAR_DELT,
  facepull: REAR_DELT,
  uprightrow: UPRIGHT,
  dbupright: UPRIGHT,
  cableupright: UPRIGHT,

  // Biceps and forearms
  curl: CURL,
  barcurl: CURL,
  ezcurl: CURL,
  hammer: HAMMER,
  inclinecurl: CURL,
  concentration: CURL,
  preacher: CURL,
  barpreacher: CURL,
  dbpreacher: CURL,
  machinecurl: CURL,
  cablecurl: CURL,
  ropehammer: HAMMER,
  overheadcurl: CURL,
  bayesian: CURL,
  spider: CURL,
  zottman: HAMMER,
  reversecurl: w(['forearm'], ['biceps']),
  wristcurl: w(['forearm']),
  wristext: w(['forearm']),

  // Triceps
  pushdown: TRICEPS,
  ropepushdown: TRICEPS,
  singlepushdown: TRICEPS,
  overhead: TRICEPS,
  dbext: TRICEPS,
  machineext: TRICEPS,
  skull: TRICEPS,
  dbskull: TRICEPS,
  closegrip: CLOSE_PRESS,
  jmpress: CLOSE_PRESS,
  dipsmachine: w(['triceps'], ['chest', 'deltoids']),
  benchdips: w(['triceps'], ['chest', 'deltoids']),
  diamond: CLOSE_PRESS,
  closepushup: CLOSE_PRESS,
  kickback: TRICEPS,
  cablekickback: TRICEPS,

  // Legs
  squat: SQUAT,
  frontsquat: w(['quadriceps'], ['gluteal', 'abs', 'upper-back']),
  zercher: w(['quadriceps', 'gluteal'], ['abs', 'upper-back', 'biceps']),
  smithsquat: SQUAT,
  hacksquat: w(['quadriceps'], ['gluteal', 'adductors']),
  pendulum: w(['quadriceps'], ['gluteal', 'adductors']),
  beltsquat: w(['quadriceps', 'gluteal'], ['adductors']),
  goblet: w(['quadriceps', 'gluteal'], ['adductors', 'abs']),
  dbsquat: SQUAT,
  sumosquat: w(['quadriceps', 'adductors', 'gluteal']),
  bwsquat: SQUAT,
  jumpsquat: w(['quadriceps', 'gluteal'], ['calves', 'hamstring']),
  pistol: w(['quadriceps', 'gluteal'], ['abs', 'calves']),
  sissy: w(['quadriceps']),
  legpress: LEG_PRESS,
  seatedlegpress: LEG_PRESS,
  singlelegpress: LEG_PRESS,
  lunge: LUNGE,
  barlunge: LUNGE,
  walkinglunge: LUNGE,
  reverselunge: LUNGE,
  bwlunge: LUNGE,
  laterallunge: w(['adductors', 'quadriceps', 'gluteal']),
  jumplunge: LUNGE,
  smithlunge: LUNGE,
  splitsquat: LUNGE,
  bulgarian: LUNGE,
  stepup: LUNGE,
  boxjump: w(['quadriceps', 'gluteal'], ['calves', 'hamstring']),
  rdl: HINGE,
  dbrdl: HINGE,
  singlerdl: w(['hamstring', 'gluteal'], ['lower-back', 'obliques']),
  stiffleg: HINGE,
  sumo: w(['gluteal', 'adductors', 'hamstring'], ['quadriceps', 'lower-back', 'trapezius']),
  goodmorning: w(['hamstring', 'lower-back'], ['gluteal']),
  legext: w(['quadriceps']),
  legcurl: w(['hamstring'], ['calves']),
  seatedlegcurl: w(['hamstring'], ['calves']),
  standinglegcurl: w(['hamstring'], ['calves']),
  nordic: w(['hamstring'], ['gluteal', 'calves']),
  adductor: w(['adductors']),

  // Glutes
  hipthrust: HIP_THRUST,
  hipthrustmachine: HIP_THRUST,
  smithhipthrust: HIP_THRUST,
  singlehipthrust: HIP_THRUST,
  glutebridge: HIP_THRUST,
  barbridge: HIP_THRUST,
  swing: w(['gluteal', 'hamstring'], ['lower-back', 'deltoids', 'forearm']),
  pullthrough: w(['gluteal', 'hamstring'], ['lower-back']),
  abductor: GLUTE_SIDE,
  cableabduction: GLUTE_SIDE,
  glutekick: GLUTE_KICK,
  glutekickmachine: GLUTE_KICK,
  floorkick: GLUTE_KICK,

  // Calves
  calves: CALVES,
  seatedcalves: CALVES,
  presscalves: CALVES,
  smithcalves: CALVES,
  dbcalves: CALVES,
  bwcalves: CALVES,

  // Core
  cablecrunch: CRUNCH,
  machinecrunch: CRUNCH,
  crunch: CRUNCH,
  declinecrunch: CRUNCH,
  reversecrunch: CRUNCH,
  obliquecrunch: w(['obliques'], ['abs']),
  bicyclecrunch: w(['abs', 'obliques']),
  situp: CRUNCH,
  vup: CRUNCH,
  legraise: LEG_RAISE,
  hangingknee: HANGING,
  hangingleg: HANGING,
  captainchair: LEG_RAISE,
  toestobar: HANGING,
  abwheel: w(['abs'], ['upper-back', 'deltoids', 'triceps']),
  russiantwist: TWIST,
  flutterkicks: LEG_RAISE,
  deadbug: w(['abs'], ['obliques']),
  dragonflag: w(['abs'], ['obliques', 'upper-back']),
  mountainclimber: w(['abs'], ['deltoids', 'quadriceps', 'chest']),
  woodchopper: TWIST,
  pallof: w(['obliques', 'abs']),
  torsorotation: TWIST,
  sidebend: w(['obliques']),
  plank: PLANK,
  sideplank: w(['obliques'], ['abs', 'deltoids', 'gluteal']),
  reverseplank: w(['gluteal', 'lower-back'], ['hamstring', 'deltoids']),
  hollow: w(['abs'], ['obliques']),
  lsit: w(['abs'], ['triceps', 'quadriceps']),
  wallsit: w(['quadriceps'], ['gluteal']),
  deadhang: w(['forearm'], ['upper-back']),
  farmer: w(['forearm', 'trapezius'], ['abs', 'obliques']),

  // Full body
  powerclean: w(['gluteal', 'hamstring', 'trapezius'], ['quadriceps', 'deltoids', 'lower-back']),
  cleanjerk: w(['quadriceps', 'gluteal', 'deltoids'], ['trapezius', 'triceps', 'hamstring']),
  snatch: w(['gluteal', 'hamstring', 'trapezius', 'deltoids'], ['quadriceps', 'lower-back']),
  thruster: w(['quadriceps', 'gluteal', 'deltoids'], ['triceps']),
  burpee: w(['quadriceps', 'chest'], ['triceps', 'abs', 'deltoids']),
  getup: w(['deltoids', 'abs'], ['obliques', 'gluteal', 'triceps']),
};

const KEY_BY_NAME = new Map<string, ExerciseKey>(
  (Object.entries(EXERCISES) as [ExerciseKey, { name: string }][]).map(([key, def]) => [def.name, key]),
);

/** The catalog key of an exercise (its stored French name); nothing for one the user created. */
export const catalogKeyOf = (name: string): ExerciseKey | undefined => KEY_BY_NAME.get(name);

/** The muscles of an exercise; nothing for one the user created. */
export const workedBy = (name: string): Worked | undefined => {
  const key = catalogKeyOf(name);
  return key ? WORKED[key] : undefined;
};
