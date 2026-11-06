/** Dos : tractions, tirages, rowings, soulevés de terre, lombaires, trapèzes. */

import { ex, held, helped, onCable, onSmith, withPlates, type ExerciseDef } from '@/domain/catalog/define';

export const BACK = {
  pullup: ex('Tractions', 'bodyweight', 'compound', ['back', 'biceps'], ['Tractions pronation', 'Traction']),
  chinup: ex('Tractions supination', 'bodyweight', 'compound', ['back', 'biceps'], ['Chin-up']),
  widepullup: ex('Tractions prise large', 'bodyweight', 'compound', ['back', 'biceps']),
  neutralpullup: ex(
    'Tractions prise neutre',
    'bodyweight',
    'compound',
    ['back', 'biceps'],
    ['Tractions prise marteau'],
  ),
  assisted: helped(
    ex('Tractions assistées', 'machine', 'compound', ['back', 'biceps'], ['Tractions assistées machine']),
  ),
  invertedrow: ex('Tractions australiennes', 'bodyweight', 'compound', ['back', 'biceps'], ['Rowing inversé']),
  muscleup: ex('Muscle-up', 'bodyweight', 'compound', ['back', 'triceps', 'chest']),
  pulldown: onCable(
    ex(
      'Tirage vertical',
      'machine',
      'compound',
      ['back', 'biceps'],
      ['Tirage vertical poulie', 'Lat pulldown', 'Tirage poitrine', 'Tirage haut'],
    ),
  ),
  closepulldown: onCable(
    ex('Tirage vertical prise serrée', 'machine', 'compound', ['back', 'biceps'], ['Tirage vertical triangle']),
  ),
  reversepulldown: onCable(
    ex('Tirage vertical supination', 'machine', 'compound', ['back', 'biceps'], ['Tirage vertical prise inversée']),
  ),
  singlepulldown: onCable(ex('Tirage vertical unilatéral', 'machine', 'compound', ['back', 'biceps'])),
  machinepulldown: withPlates(
    ex('Tirage vertical machine', 'machine', 'compound', ['back', 'biceps'], ['Tirage vertical convergent']),
  ),
  row: ex('Rowing barre', 'barbell', 'compound', ['back', 'biceps'], ['Rowing buste penché']),
  pendlay: ex('Rowing Pendlay', 'barbell', 'compound', ['back', 'biceps']),
  dbrow: ex('Rowing haltère', 'dumbbell', 'compound', ['back', 'biceps'], ['Rowing unilatéral haltère']),
  chestrow: ex('Rowing buste appuyé haltères', 'dumbbell', 'compound', ['back', 'biceps'], ['Rowing incliné haltères']),
  renegaderow: ex('Rowing renegade', 'dumbbell', 'compound', ['back', 'core', 'biceps']),
  meadows: ex('Rowing Meadows', 'barbell', 'compound', ['back', 'biceps']),
  seatedrow: onCable(
    ex(
      'Rowing assis poulie',
      'machine',
      'compound',
      ['back', 'biceps'],
      ['Tirage horizontal', 'Tirage horizontal poulie'],
    ),
  ),
  singlecablerow: onCable(ex('Rowing unilatéral poulie', 'machine', 'compound', ['back', 'biceps'])),
  machinerow: withPlates(
    ex('Rowing machine', 'machine', 'compound', ['back', 'biceps'], ['Low row', 'Rowing assis machine']),
  ),
  highrow: withPlates(ex('Rowing haut machine', 'machine', 'compound', ['back', 'biceps'], ['High row'])),
  tbar: withPlates(ex('Rowing T-bar', 'machine', 'compound', ['back', 'biceps'], ['Rowing landmine'])),
  deadlift: ex('Soulevé de terre', 'barbell', 'compound', ['back', 'legs', 'glutes'], ['SDT']),
  trapbar: ex(
    'Soulevé de terre trap bar',
    'barbell',
    'compound',
    ['legs', 'glutes', 'back'],
    ['Soulevé de terre hex bar'],
  ),
  dbdeadlift: ex('Soulevé de terre haltères', 'dumbbell', 'compound', ['back', 'legs', 'glutes']),
  rackpull: ex('Rack pull', 'barbell', 'compound', ['back', 'glutes'], ['Soulevé de terre partiel']),
  pullover: onCable(
    ex('Pull-over poulie', 'machine', 'isolation', ['back'], ['Tirage bras tendus', 'Pull-down bras tendus']),
  ),
  machinepullover: ex('Pull-over machine', 'machine', 'isolation', ['back', 'chest']),
  shrug: ex('Shrugs haltères', 'dumbbell', 'isolation', ['back'], ['Shrugs', 'Haussements d’épaules']),
  barshrug: ex('Shrugs barre', 'barbell', 'isolation', ['back']),
  machineshrug: ex('Shrugs machine', 'machine', 'isolation', ['back']),
  smithshrug: onSmith(ex('Shrugs Smith', 'machine', 'isolation', ['back'])),
  backext: ex(
    'Extensions lombaires',
    'bodyweight',
    'isolation',
    ['back', 'glutes'],
    ['Hyperextensions', 'Banc à lombaires'],
  ),
  backextmachine: ex('Extensions lombaires machine', 'machine', 'isolation', ['back', 'glutes'], ['Lombaires machine']),
  superman: ex('Superman', 'bodyweight', 'isolation', ['back', 'glutes']),
  frontlever: held(ex('Front lever', 'bodyweight', 'isolation', ['back', 'core'])),
} satisfies Record<string, ExerciseDef>;
